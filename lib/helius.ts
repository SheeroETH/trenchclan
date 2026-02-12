/**
 * Helius API client for parsing Solana transactions.
 *
 * Uses the Enhanced Transactions API to get human-readable swap data
 * from Jupiter, Raydium, Pump.fun, and other DEXes.
 *
 * Free tier: 1M credits/month — more than enough for our use case.
 * Docs: https://docs.helius.dev/solana-apis/enhanced-transactions-api
 */

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';
const HELIUS_BASE = 'https://api.helius.dev';

export interface HeliusSwap {
    signature: string;
    timestamp: number;
    type: string;
    source: string; // e.g. "JUPITER", "RAYDIUM", "PUMP_FUN"
    description: string;
    tokenInputs: HeliusTokenTransfer[];
    tokenOutputs: HeliusTokenTransfer[];
    nativeInput?: { amount: number };
    nativeOutput?: { amount: number };
    fee: number;
}

export interface HeliusTokenTransfer {
    mint: string;
    amount: number;
    tokenStandard: string;
}

export interface ParsedTrade {
    token_symbol: string;
    token_mint: string;
    type: 'buy' | 'sell';
    amount_sol: number;
    amount_tokens: number;
    price_per_token: number;
    signature: string;
    traded_at: string;
}

/**
 * Fetch parsed transactions for a wallet address.
 * Returns the last N transactions with human-readable swap data.
 */
export const fetchParsedTransactions = async (
    walletAddress: string,
    limit: number = 50,
    beforeSignature?: string
): Promise<HeliusSwap[]> => {
    if (!HELIUS_API_KEY) {
        console.warn('Helius API key not set. Add VITE_HELIUS_API_KEY to .env.local');
        return [];
    }

    try {
        const url = new URL(`${HELIUS_BASE}/v0/addresses/${walletAddress}/transactions`);
        url.searchParams.set('api-key', HELIUS_API_KEY);
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('type', 'SWAP');
        if (beforeSignature) {
            url.searchParams.set('before', beforeSignature);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Helius API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data as HeliusSwap[];
    } catch (err) {
        console.error('Failed to fetch parsed transactions:', err);
        throw err;
    }
};

/**
 * SOL mint address (native SOL is wrapped as this on DEXes)
 */
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Parse Helius swap transactions into our trade format.
 *
 * Logic:
 * - If user sent SOL and received tokens → BUY
 * - If user sent tokens and received SOL → SELL
 * - For token-to-token swaps, we use the SOL equivalent
 */
export const parseSwapsToTrades = (swaps: HeliusSwap[]): ParsedTrade[] => {
    const trades: ParsedTrade[] = [];

    for (const swap of swaps) {
        try {
            const { tokenInputs, tokenOutputs, nativeInput, nativeOutput, signature, timestamp } = swap;

            // Case 1: SOL → Token (BUY)
            if (nativeInput && nativeInput.amount > 0 && tokenOutputs.length > 0) {
                const solAmount = nativeInput.amount / LAMPORTS_PER_SOL;
                const tokenOut = tokenOutputs[0];

                trades.push({
                    token_symbol: tokenOut.mint.slice(0, 6).toUpperCase(), // We'll resolve names later
                    token_mint: tokenOut.mint,
                    type: 'buy',
                    amount_sol: solAmount,
                    amount_tokens: tokenOut.amount,
                    price_per_token: tokenOut.amount > 0 ? solAmount / tokenOut.amount : 0,
                    signature,
                    traded_at: new Date(timestamp * 1000).toISOString(),
                });
                continue;
            }

            // Case 2: Token → SOL (SELL)
            if (nativeOutput && nativeOutput.amount > 0 && tokenInputs.length > 0) {
                const solAmount = nativeOutput.amount / LAMPORTS_PER_SOL;
                const tokenIn = tokenInputs[0];

                trades.push({
                    token_symbol: tokenIn.mint.slice(0, 6).toUpperCase(),
                    token_mint: tokenIn.mint,
                    type: 'sell',
                    amount_sol: solAmount,
                    amount_tokens: tokenIn.amount,
                    price_per_token: tokenIn.amount > 0 ? solAmount / tokenIn.amount : 0,
                    signature,
                    traded_at: new Date(timestamp * 1000).toISOString(),
                });
                continue;
            }

            // Case 3: Token → Token (use the non-SOL side)
            if (tokenInputs.length > 0 && tokenOutputs.length > 0) {
                const isSolInput = tokenInputs.some(t => t.mint === SOL_MINT);
                const isSolOutput = tokenOutputs.some(t => t.mint === SOL_MINT);

                if (isSolInput) {
                    // SOL-wrapped input → buying the output token
                    const solToken = tokenInputs.find(t => t.mint === SOL_MINT)!;
                    const otherToken = tokenOutputs.find(t => t.mint !== SOL_MINT) || tokenOutputs[0];
                    const solAmount = solToken.amount / LAMPORTS_PER_SOL;

                    trades.push({
                        token_symbol: otherToken.mint.slice(0, 6).toUpperCase(),
                        token_mint: otherToken.mint,
                        type: 'buy',
                        amount_sol: solAmount,
                        amount_tokens: otherToken.amount,
                        price_per_token: otherToken.amount > 0 ? solAmount / otherToken.amount : 0,
                        signature,
                        traded_at: new Date(timestamp * 1000).toISOString(),
                    });
                } else if (isSolOutput) {
                    // Receiving SOL → selling the input token
                    const solToken = tokenOutputs.find(t => t.mint === SOL_MINT)!;
                    const otherToken = tokenInputs.find(t => t.mint !== SOL_MINT) || tokenInputs[0];
                    const solAmount = solToken.amount / LAMPORTS_PER_SOL;

                    trades.push({
                        token_symbol: otherToken.mint.slice(0, 6).toUpperCase(),
                        token_mint: otherToken.mint,
                        type: 'sell',
                        amount_sol: solAmount,
                        amount_tokens: otherToken.amount,
                        price_per_token: otherToken.amount > 0 ? solAmount / otherToken.amount : 0,
                        signature,
                        traded_at: new Date(timestamp * 1000).toISOString(),
                    });
                }
                // Skip pure token-to-token swaps without SOL involvement for now
            }
        } catch (err) {
            console.warn('Failed to parse swap:', swap.signature, err);
        }
    }

    return trades;
};

/**
 * Resolve token mint addresses to symbols using Helius DAS API.
 * This gives us proper token names instead of truncated mint addresses.
 */
export const resolveTokenMetadata = async (
    mintAddresses: string[]
): Promise<Map<string, string>> => {
    if (!HELIUS_API_KEY || mintAddresses.length === 0) return new Map();

    const uniqueMints = [...new Set(mintAddresses)];
    const symbolMap = new Map<string, string>();

    try {
        const response = await fetch(`${HELIUS_BASE}/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mintAccounts: uniqueMints,
                includeOffChain: true,
                disableCache: false,
            }),
        });

        if (!response.ok) return symbolMap;

        const data = await response.json();

        for (const item of data) {
            const symbol = item.onChainMetadata?.metadata?.data?.symbol
                || item.offChainMetadata?.metadata?.symbol
                || item.account?.slice(0, 6).toUpperCase();

            if (symbol) {
                symbolMap.set(item.account, symbol.trim());
            }
        }
    } catch (err) {
        console.warn('Failed to resolve token metadata:', err);
    }

    return symbolMap;
};
