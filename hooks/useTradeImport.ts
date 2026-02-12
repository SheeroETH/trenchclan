import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../contexts/AuthContext';
import { useClan } from '../hooks/useClan';
import { supabase } from '../lib/supabase';
import {
    fetchParsedTransactions,
    parseSwapsToTrades,
    resolveTokenMetadata,
    type ParsedTrade,
} from '../lib/helius';

interface ImportResult {
    imported: number;
    skipped: number;
    total: number;
}

interface UseTradeImportReturn {
    importing: boolean;
    progress: string;
    lastResult: ImportResult | null;
    error: string | null;
    importTrades: () => Promise<ImportResult | null>;
}

/**
 * Hook to import trades from a connected Solana wallet into the Supabase trades table.
 *
 * Flow:
 *   1. Read wallet address from wallet-adapter
 *   2. Fetch parsed swap transactions from Helius
 *   3. Resolve token metadata (proper symbols)
 *   4. Deduplicate against existing trades (by signature)
 *   5. Insert new trades into Supabase
 */
export const useTradeImport = (): UseTradeImportReturn => {
    const { publicKey } = useWallet();
    const { user } = useAuth();
    const { myClan } = useClan();

    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState('');
    const [lastResult, setLastResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const importTrades = useCallback(async (): Promise<ImportResult | null> => {
        if (!publicKey || !user || !myClan) {
            setError('Connect your wallet and join a clan first');
            return null;
        }

        const walletAddress = publicKey.toBase58();

        setImporting(true);
        setError(null);
        setProgress('Fetching transactions from Solana...');

        try {
            // Step 1: Fetch parsed swap transactions
            const swaps = await fetchParsedTransactions(walletAddress, 100);

            if (swaps.length === 0) {
                setProgress('No swap transactions found');
                setImporting(false);
                const result = { imported: 0, skipped: 0, total: 0 };
                setLastResult(result);
                return result;
            }

            setProgress(`Found ${swaps.length} swaps. Parsing...`);

            // Step 2: Parse swaps into our trade format
            const parsedTrades = parseSwapsToTrades(swaps);

            if (parsedTrades.length === 0) {
                setProgress('No parseable DEX swaps found');
                setImporting(false);
                const result = { imported: 0, skipped: 0, total: swaps.length };
                setLastResult(result);
                return result;
            }

            // Step 3: Resolve token metadata for proper symbols
            setProgress(`Resolving ${parsedTrades.length} token names...`);
            const mints = parsedTrades.map(t => t.token_mint);
            const symbolMap = await resolveTokenMetadata(mints);

            // Apply resolved symbols
            for (const trade of parsedTrades) {
                const resolved = symbolMap.get(trade.token_mint);
                if (resolved) {
                    trade.token_symbol = resolved;
                }
            }

            // Step 4: Check which signatures already exist to avoid duplicates
            setProgress('Checking for duplicates...');
            const signatures = parsedTrades.map(t => t.signature);
            const { data: existingTrades } = await supabase
                .from('trades')
                .select('signature')
                .eq('user_id', user.id)
                .in('signature', signatures);

            const existingSignatures = new Set(
                (existingTrades || []).map((t: any) => t.signature)
            );

            const newTrades = parsedTrades.filter(t => !existingSignatures.has(t.signature));
            const skipped = parsedTrades.length - newTrades.length;

            if (newTrades.length === 0) {
                setProgress(`All ${parsedTrades.length} trades already imported`);
                setImporting(false);
                const result = { imported: 0, skipped, total: parsedTrades.length };
                setLastResult(result);
                return result;
            }

            // Step 5: Insert new trades into Supabase
            setProgress(`Importing ${newTrades.length} new trades...`);

            const rows = newTrades.map(trade => ({
                user_id: user.id,
                clan_id: myClan.id,
                token_symbol: trade.token_symbol,
                token_mint: trade.token_mint,
                trade_type: trade.type,
                amount_usd: trade.amount_sol,
                token_amount: trade.amount_tokens,
                price_per_token: trade.price_per_token,
                pnl_usd: 0,
                signature: trade.signature,
                created_at: trade.traded_at,
            }));

            // Batch insert (Supabase handles up to 1000 rows per insert)
            const { error: insertError } = await supabase
                .from('trades')
                .insert(rows);

            if (insertError) {
                throw insertError;
            }

            const result = { imported: newTrades.length, skipped, total: parsedTrades.length };
            setLastResult(result);
            setProgress(`✅ Imported ${newTrades.length} trades (${skipped} already existed)`);
            setImporting(false);
            return result;
        } catch (err: any) {
            console.error('Trade import error:', err);
            setError(err.message || 'Failed to import trades');
            setProgress('');
            setImporting(false);
            return null;
        }
    }, [publicKey, user, myClan]);

    return {
        importing,
        progress,
        lastResult,
        error,
        importTrades,
    };
};
