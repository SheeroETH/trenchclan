import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Tournament {
    id: string;
    season: number;
    week: number;
    starts_at: string;
    ends_at: string;
    prize_pool: number;
    prize_1st: number;
    prize_2nd: number;
    prize_3rd: number;
    status: 'upcoming' | 'active' | 'completed';
    created_at: string;
}

export interface TournamentClan {
    clan_id: string;
    name: string;
    tag: string;
    avatar_url: string;
    member_count: number;
    total_volume: number;
    total_pnl: number;
    trade_count: number;
    roi_pct: number;
    rank?: number;
}

interface UseTournamentsReturn {
    tournament: Tournament | null;
    leaderboard: TournamentClan[];
    pastTournaments: Tournament[];
    loading: boolean;
    error: string | null;
    timeLeft: string;
    refetch: () => Promise<void>;
}

/**
 * Format a countdown string from milliseconds remaining.
 */
function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Ended';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

export const useTournaments = (): UseTournamentsReturn => {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [leaderboard, setLeaderboard] = useState<TournamentClan[]>([]);
    const [pastTournaments, setPastTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Get the active/upcoming tournament via RPC
            const { data: activeData, error: activeError } = await supabase
                .rpc('get_active_tournament');

            if (activeError) throw activeError;

            if (activeData) {
                const t: Tournament = {
                    id: activeData.id,
                    season: activeData.season,
                    week: activeData.week,
                    starts_at: activeData.starts_at,
                    ends_at: activeData.ends_at,
                    prize_pool: Number(activeData.prize_pool) || 0,
                    prize_1st: Number(activeData.prize_1st) || 0,
                    prize_2nd: Number(activeData.prize_2nd) || 0,
                    prize_3rd: Number(activeData.prize_3rd) || 0,
                    status: activeData.status,
                    created_at: activeData.created_at,
                };
                setTournament(t);

                // 2. Get tournament leaderboard
                const { data: lbData, error: lbError } = await supabase
                    .rpc('get_tournament_leaderboard', { p_tournament_id: t.id });

                if (lbError) throw lbError;

                if (lbData && Array.isArray(lbData)) {
                    const ranked = lbData.map((c: any, i: number) => ({
                        clan_id: c.clan_id,
                        name: c.name,
                        tag: c.tag,
                        avatar_url: c.avatar_url,
                        member_count: Number(c.member_count) || 0,
                        total_volume: Number(c.total_volume) || 0,
                        total_pnl: Number(c.total_pnl) || 0,
                        trade_count: Number(c.trade_count) || 0,
                        roi_pct: Number(c.roi_pct) || 0,
                        rank: i + 1,
                    }));
                    setLeaderboard(ranked);
                }
            }

            // 3. Get past tournaments
            const { data: pastData, error: pastError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('status', 'completed')
                .order('ends_at', { ascending: false })
                .limit(10);

            if (!pastError && pastData) {
                setPastTournaments(pastData);
            }
        } catch (err: any) {
            console.error('Error fetching tournaments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Countdown timer
    useEffect(() => {
        if (!tournament) return;

        const tick = () => {
            const now = Date.now();
            if (tournament.status === 'active') {
                const remaining = new Date(tournament.ends_at).getTime() - now;
                setTimeLeft(formatCountdown(remaining));
            } else if (tournament.status === 'upcoming') {
                const remaining = new Date(tournament.starts_at).getTime() - now;
                setTimeLeft('Starts in ' + formatCountdown(remaining));
            } else {
                setTimeLeft('Ended');
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [tournament]);

    return {
        tournament,
        leaderboard,
        pastTournaments,
        loading,
        error,
        timeLeft,
        refetch: fetchData,
    };
};
