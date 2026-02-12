import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardClan {
    id: string;
    rank: number;
    name: string;
    tag: string;
    avatar_url: string;
    member_count: number;
    total_volume: number;
    volume_24h: number;
    total_pnl: number;
    trade_count: number;
    roi_pct: number;
}

interface UseLeaderboardReturn {
    clans: LeaderboardClan[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Format a USD value into a human-readable string.
 * e.g. 1234567 -> "$1.23M", 45000 -> "$45.0K"
 */
export const formatVolume = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    if (value > 0) return `$${value.toFixed(0)}`;
    return '$0';
};

/**
 * Format ROI percentage with sign.
 */
export const formatROI = (roi: number): string => {
    const sign = roi >= 0 ? '+' : '';
    return `${sign}${roi.toFixed(1)}%`;
};

export const useLeaderboard = (): UseLeaderboardReturn => {
    const [clans, setClans] = useState<LeaderboardClan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: rpcError } = await supabase.rpc('get_leaderboard');

            if (rpcError) throw rpcError;

            const ranked: LeaderboardClan[] = (data || []).map((clan: any, i: number) => ({
                id: clan.id,
                rank: i + 1,
                name: clan.name,
                tag: clan.tag,
                avatar_url: clan.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${clan.tag}&backgroundColor=10b981`,
                member_count: Number(clan.member_count) || 0,
                total_volume: Number(clan.total_volume) || 0,
                volume_24h: Number(clan.volume_24h) || 0,
                total_pnl: Number(clan.total_pnl) || 0,
                trade_count: Number(clan.trade_count) || 0,
                roi_pct: Number(clan.roi_pct) || 0,
            }));

            setClans(ranked);
        } catch (err: any) {
            console.error('Error fetching leaderboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return {
        clans,
        loading,
        error,
        refetch: fetchLeaderboard,
    };
};
