import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PlatformStats {
    /** Total USD volume across all trades */
    total_volume: number;
    /** Number of live trades in the system */
    total_trades: number;
    /** Best ROI % among all clans */
    top_roi: number;
    /** Total number of clans on the platform */
    total_clans: number;
    /** Total number of registered users */
    total_users: number;
    /** Total volume in the last 24h */
    volume_24h: number;
}

const DEFAULT_STATS: PlatformStats = {
    total_volume: 0,
    total_trades: 0,
    top_roi: 0,
    total_clans: 0,
    total_users: 0,
    volume_24h: 0,
};

interface UsePlatformStatsReturn {
    stats: PlatformStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook that fetches platform-wide aggregate stats.
 *
 * Uses the `get_platform_stats()` RPC function in Supabase
 * which aggregates data across all clans/users/trades.
 *
 * Falls back to individual queries if the RPC function doesn't exist yet.
 */
export const usePlatformStats = (): UsePlatformStatsReturn => {
    const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Try the RPC function first
            const { data, error: rpcError } = await supabase.rpc('get_platform_stats');

            if (!rpcError && data) {
                setStats({
                    total_volume: Number(data.total_volume) || 0,
                    total_trades: Number(data.total_trades) || 0,
                    top_roi: Number(data.top_roi) || 0,
                    total_clans: Number(data.total_clans) || 0,
                    total_users: Number(data.total_users) || 0,
                    volume_24h: Number(data.volume_24h) || 0,
                });
                return;
            }

            // Fallback: query tables individually
            console.warn('get_platform_stats RPC not found, falling back to individual queries');

            const [tradesRes, clansRes, usersRes] = await Promise.all([
                supabase
                    .from('trades')
                    .select('amount_usd, pnl_usd, created_at', { count: 'exact' }),
                supabase
                    .from('clans')
                    .select('id', { count: 'exact' }),
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact' }),
            ]);

            const trades = tradesRes.data || [];
            const totalVolume = trades.reduce((s, t) => s + (Number(t.amount_usd) || 0), 0);
            const now = Date.now();
            const dayAgo = now - 24 * 60 * 60 * 1000;
            const vol24h = trades
                .filter(t => new Date(t.created_at).getTime() > dayAgo)
                .reduce((s, t) => s + (Number(t.amount_usd) || 0), 0);

            // Get top ROI from leaderboard
            let topRoi = 0;
            try {
                const { data: leaderboard } = await supabase.rpc('get_leaderboard');
                if (leaderboard && leaderboard.length > 0) {
                    topRoi = Number(leaderboard[0].roi_pct) || 0;
                }
            } catch { /* ignore */ }

            setStats({
                total_volume: totalVolume,
                total_trades: tradesRes.count || trades.length,
                top_roi: topRoi,
                total_clans: clansRes.count || 0,
                total_users: usersRes.count || 0,
                volume_24h: vol24h,
            });
        } catch (err: any) {
            console.error('Error fetching platform stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        // Refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
    };
};
