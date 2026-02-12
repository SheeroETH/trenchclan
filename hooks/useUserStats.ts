import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface UserStats {
    totalTrades: number;
    totalBuys: number;
    totalSells: number;
    totalVolume: number;
    totalPnl: number;
    winRate: number;
    bestTradePnl: number;
    bestTradeToken: string;
    pnlDaily: number;
    pnlWeekly: number;
    pnlMonthly: number;
    volumeDaily: number;
    volumeWeekly: number;
    volumeMonthly: number;
    volumeAlltime: number;
    activeDays: number;
}

export interface RecentTrade {
    id: string;
    token_symbol: string;
    token_mint: string;
    trade_type: 'buy' | 'sell';
    amount_usd: number;
    token_amount: number;
    pnl_usd: number;
    created_at: string;
    signature: string | null;
}

interface UseUserStatsReturn {
    stats: UserStats;
    recentTrades: RecentTrade[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const EMPTY_STATS: UserStats = {
    totalTrades: 0,
    totalBuys: 0,
    totalSells: 0,
    totalVolume: 0,
    totalPnl: 0,
    winRate: 0,
    bestTradePnl: 0,
    bestTradeToken: '-',
    pnlDaily: 0,
    pnlWeekly: 0,
    pnlMonthly: 0,
    volumeDaily: 0,
    volumeWeekly: 0,
    volumeMonthly: 0,
    volumeAlltime: 0,
    activeDays: 0,
};

/**
 * Hook to fetch user trading stats and recent trades.
 *
 * Uses the `get_user_stats` RPC function for aggregated stats
 * and a direct query for the most recent trades list.
 */
export const useUserStats = (): UseUserStatsReturn => {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
    const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!user) {
            setStats(EMPTY_STATS);
            setRecentTrades([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch aggregated stats via RPC
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_user_stats', { p_user_id: user.id });

            if (rpcError) {
                // If RPC doesn't exist yet, fall back to client-side calculation
                console.warn('get_user_stats RPC not available, falling back to client-side:', rpcError.message);
                await fetchStatsClientSide(user.id);
            } else if (rpcData) {
                setStats({
                    totalTrades: rpcData.total_trades ?? 0,
                    totalBuys: rpcData.total_buys ?? 0,
                    totalSells: rpcData.total_sells ?? 0,
                    totalVolume: Number(rpcData.total_volume) || 0,
                    totalPnl: Number(rpcData.total_pnl) || 0,
                    winRate: Number(rpcData.win_rate) || 0,
                    bestTradePnl: Number(rpcData.best_trade_pnl) || 0,
                    bestTradeToken: rpcData.best_trade_token || '-',
                    pnlDaily: Number(rpcData.pnl_daily) || 0,
                    pnlWeekly: Number(rpcData.pnl_weekly) || 0,
                    pnlMonthly: Number(rpcData.pnl_monthly) || 0,
                    volumeDaily: Number(rpcData.volume_daily) || 0,
                    volumeWeekly: Number(rpcData.volume_weekly) || 0,
                    volumeMonthly: Number(rpcData.volume_monthly) || 0,
                    volumeAlltime: Number(rpcData.volume_alltime) || 0,
                    activeDays: rpcData.active_days ?? 0,
                });
            }

            // Fetch recent trades (last 10)
            const { data: tradesData, error: tradesError } = await supabase
                .from('trades')
                .select('id, token_symbol, token_mint, trade_type, amount_usd, token_amount, pnl_usd, created_at, signature')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!tradesError && tradesData) {
                setRecentTrades(tradesData as RecentTrade[]);
            }
        } catch (err: any) {
            console.error('Error fetching user stats:', err);
            setError(err.message || 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Fallback: calculate stats client-side if the RPC function
     * hasn't been created in Supabase yet.
     */
    const fetchStatsClientSide = async (userId: string) => {
        const { data: trades, error: fetchError } = await supabase
            .from('trades')
            .select('trade_type, amount_usd, pnl_usd, token_symbol, created_at')
            .eq('user_id', userId);

        if (fetchError || !trades) {
            setStats(EMPTY_STATS);
            return;
        }

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;

        let totalVolume = 0;
        let totalPnl = 0;
        let totalBuys = 0;
        let totalSells = 0;
        let winCount = 0;
        let bestPnl = 0;
        let bestToken = '-';
        let pnlDaily = 0, pnlWeekly = 0, pnlMonthly = 0;
        let volDaily = 0, volWeekly = 0, volMonthly = 0, volAlltime = 0;
        const activeDaysSet = new Set<string>();

        for (const t of trades) {
            const amount = Number(t.amount_usd) || 0;
            const pnl = Number(t.pnl_usd) || 0;
            const createdAt = new Date(t.created_at).getTime();
            const age = now - createdAt;
            const dayStr = new Date(t.created_at).toISOString().slice(0, 10);

            totalVolume += amount;
            totalPnl += pnl;
            activeDaysSet.add(dayStr);

            if (t.trade_type === 'buy') {
                totalBuys++;
                volAlltime += amount;
                if (age < DAY) volDaily += amount;
                if (age < 7 * DAY) volWeekly += amount;
                if (age < 30 * DAY) volMonthly += amount;
            } else {
                totalSells++;
                if (pnl > 0) winCount++;
                if (pnl > bestPnl) {
                    bestPnl = pnl;
                    bestToken = t.token_symbol;
                }
            }

            if (age < DAY) pnlDaily += pnl;
            if (age < 7 * DAY) pnlWeekly += pnl;
            if (age < 30 * DAY) pnlMonthly += pnl;
        }

        setStats({
            totalTrades: trades.length,
            totalBuys,
            totalSells,
            totalVolume,
            totalPnl,
            winRate: totalSells > 0 ? Math.round((winCount / totalSells) * 1000) / 10 : 0,
            bestTradePnl: bestPnl,
            bestTradeToken: bestToken,
            pnlDaily,
            pnlWeekly,
            pnlMonthly,
            volumeDaily: volDaily,
            volumeWeekly: volWeekly,
            volumeMonthly: volMonthly,
            volumeAlltime: volAlltime,
            activeDays: activeDaysSet.size,
        });
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        recentTrades,
        loading,
        error,
        refetch: fetchStats,
    };
};

/**
 * Utility formatters for profile display
 */
export const formatPnl = (value: number): string => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${value >= 0 ? '+' : '-'}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${value >= 0 ? '+' : '-'}$${(abs / 1_000).toFixed(1)}K`;
    if (abs >= 1) return `${value >= 0 ? '+' : '-'}$${abs.toFixed(2)}`;
    if (abs > 0) return `${value >= 0 ? '+' : '-'}$${abs.toFixed(4)}`;
    return '$0';
};

export const formatRoiPercent = (pnl: number, volume: number): string => {
    if (volume <= 0) return '0%';
    const roi = (pnl / volume) * 100;
    const sign = roi >= 0 ? '+' : '';
    if (Math.abs(roi) >= 1000) return `${sign}${(roi / 1000).toFixed(1)}K%`;
    return `${sign}${roi.toFixed(1)}%`;
};
