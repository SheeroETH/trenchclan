import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export interface TokenHolding {
    symbol: string;
    name: string;
    mint: string;
    amount: number;          // human-readable token amount
    decimals: number;
    imageUrl?: string;
    /** Estimated value in SOL */
    valueSol: number;
    /** Estimated value in USD (SOL × price) */
    valueUsd: number;
    /** For display only — we don't have historical data to compute real PnL */
    pnlPct: null;
}

interface UseHoldingsReturn {
    holdings: TokenHolding[];
    totalValueUsd: number;
    solBalance: number;
    solPrice: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Fetch real token holdings for the connected Solana wallet.
 *
 * Uses:
 * - Helius DAS API `getAssetsByOwner` for fungible tokens
 * - Solana connection `getBalance` for native SOL
 * - CoinGecko (free) to get SOL → USD price
 */
export const useHoldings = (): UseHoldingsReturn => {
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();

    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [totalValueUsd, setTotalValueUsd] = useState(0);
    const [solBalance, setSolBalance] = useState(0);
    const [solPrice, setSolPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHoldings = useCallback(async () => {
        if (!connected || !publicKey || !HELIUS_API_KEY) {
            setHoldings([]);
            setTotalValueUsd(0);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch SOL price from CoinGecko (free, no key needed)
            let currentSolPrice = solPrice;
            try {
                const priceRes = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
                );
                if (priceRes.ok) {
                    const priceData = await priceRes.json();
                    currentSolPrice = priceData.solana?.usd || 0;
                    setSolPrice(currentSolPrice);
                }
            } catch {
                console.warn('Could not fetch SOL price, using cached value');
            }

            // 2. Fetch native SOL balance
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / LAMPORTS_PER_SOL;
            setSolBalance(sol);

            // 3. Fetch fungible token assets via Helius DAS API
            const response = await fetch(HELIUS_RPC, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'holdings',
                    method: 'getAssetsByOwner',
                    params: {
                        ownerAddress: publicKey.toBase58(),
                        displayOptions: {
                            showFungible: true,
                            showNativeBalance: false,
                        },
                        sortBy: { sortBy: 'recent_action', sortDirection: 'desc' },
                        limit: 50,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Helius DAS API error: ${response.status}`);
            }

            const json = await response.json();
            const assets = json.result?.items || [];

            // 4. Parse fungible tokens
            const tokens: TokenHolding[] = [];

            for (const asset of assets) {
                // Only include fungible tokens with a balance
                if (asset.interface !== 'FungibleToken' && asset.interface !== 'FungibleAsset') continue;

                const tokenInfo = asset.token_info;
                if (!tokenInfo) continue;

                const decimals = tokenInfo.decimals || 0;
                const rawBalance = Number(tokenInfo.balance || 0);
                const humanAmount = rawBalance / Math.pow(10, decimals);

                // Skip dust (less than 0.001 in human-readable)
                if (humanAmount < 0.001) continue;

                // Try to get price from Helius (they include token_info.price_info if available)
                const pricePerToken = tokenInfo.price_info?.price_per_token || 0;
                const valueUsd = pricePerToken > 0
                    ? humanAmount * pricePerToken
                    : 0;

                const valueSol = currentSolPrice > 0
                    ? valueUsd / currentSolPrice
                    : 0;

                const symbol = tokenInfo.symbol || asset.content?.metadata?.symbol || asset.id?.slice(0, 6).toUpperCase();
                const name = asset.content?.metadata?.name || symbol;

                tokens.push({
                    symbol,
                    name,
                    mint: asset.id,
                    amount: humanAmount,
                    decimals,
                    imageUrl: asset.content?.links?.image || asset.content?.files?.[0]?.uri || undefined,
                    valueSol,
                    valueUsd,
                    pnlPct: null, // Cannot compute PnL without cost basis
                });
            }

            // Sort by value descending (tokens with price data come first)
            tokens.sort((a, b) => b.valueUsd - a.valueUsd);

            // 5. Compute total treasury value (SOL + all tokens)
            const totalTokensUsd = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
            const totalSolUsd = sol * currentSolPrice;
            const grandTotal = totalSolUsd + totalTokensUsd;

            setHoldings(tokens);
            setTotalValueUsd(grandTotal);
        } catch (err: any) {
            console.error('Error fetching holdings:', err);
            setError(err.message || 'Failed to fetch holdings');
        } finally {
            setLoading(false);
        }
    }, [connected, publicKey, connection, solPrice]);

    // Auto-fetch on wallet connect
    useEffect(() => {
        if (connected && publicKey) {
            fetchHoldings();
        } else {
            setHoldings([]);
            setTotalValueUsd(0);
            setSolBalance(0);
        }
    }, [connected, publicKey]);

    return {
        holdings,
        totalValueUsd,
        solBalance,
        solPrice,
        loading,
        error,
        refetch: fetchHoldings,
    };
};
