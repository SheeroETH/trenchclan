import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ClanStats {
    total_volume: number;
    volume_24h: number;
    total_pnl: number;
    total_cost_basis: number;
    total_sells: number;
    trade_count: number;
    roi_pct: number;
}

const DEFAULT_STATS: ClanStats = {
    total_volume: 0,
    volume_24h: 0,
    total_pnl: 0,
    total_cost_basis: 0,
    total_sells: 0,
    trade_count: 0,
    roi_pct: 0,
};

interface UseClanStatsReturn {
    stats: ClanStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    logTrade: (trade: LogTradeData) => Promise<boolean>;
}

interface LogTradeData {
    clanId: string;
    tokenSymbol: string;
    tokenName?: string;
    tradeType: 'buy' | 'sell';
    amountUsd: number;
    tokenAmount: number;
    pricePerToken: number;
    pnlUsd?: number;
}

export const useClanStats = (clanId: string | null | undefined): UseClanStatsReturn => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ClanStats>(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!clanId) {
            setStats(DEFAULT_STATS);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: rpcError } = await supabase
                .rpc('get_clan_stats', { p_clan_id: clanId });

            if (rpcError) throw rpcError;

            if (data) {
                setStats({
                    total_volume: Number(data.total_volume) || 0,
                    volume_24h: Number(data.volume_24h) || 0,
                    total_pnl: Number(data.total_pnl) || 0,
                    total_cost_basis: Number(data.total_cost_basis) || 0,
                    total_sells: Number(data.total_sells) || 0,
                    trade_count: Number(data.trade_count) || 0,
                    roi_pct: Number(data.roi_pct) || 0,
                });
            }
        } catch (err: any) {
            console.error('Error fetching clan stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clanId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const logTrade = async (trade: LogTradeData): Promise<boolean> => {
        if (!user) return false;

        try {
            setError(null);

            const { error: insertError } = await supabase
                .from('trades')
                .insert({
                    clan_id: trade.clanId,
                    user_id: user.id,
                    token_symbol: trade.tokenSymbol,
                    token_name: trade.tokenName || '',
                    trade_type: trade.tradeType,
                    amount_usd: trade.amountUsd,
                    token_amount: trade.tokenAmount,
                    price_per_token: trade.pricePerToken,
                    pnl_usd: trade.pnlUsd || 0,
                });

            if (insertError) throw insertError;

            // Refresh stats after logging
            await fetchStats();
            return true;
        } catch (err: any) {
            console.error('Error logging trade:', err);
            setError(err.message);
            return false;
        }
    };

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
        logTrade,
    };
};
