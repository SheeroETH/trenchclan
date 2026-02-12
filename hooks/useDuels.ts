import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useClan } from './useClan';

export interface Duel {
    id: string;
    challenger_clan_id: string;
    defender_clan_id: string;
    status: 'pending' | 'active' | 'completed' | 'declined';
    started_at: string | null;
    ended_at: string | null;
    winner_clan_id: string | null;
    challenger_roi: number | null;
    defender_roi: number | null;
    created_at: string;
}

export interface DuelStats {
    roi: number;
    volume: number;
    trades: number;
}

export interface ActiveDuelData {
    duel: Duel;
    challenger_stats: DuelStats;
    defender_stats: DuelStats;
    challenger_name?: string;
    defender_name?: string;
    challenger_tag?: string;
    defender_tag?: string;
    challenger_avatar?: string;
    defender_avatar?: string;
}

export const useDuels = () => {
    const { myClan } = useClan();
    const [activeDuels, setActiveDuels] = useState<ActiveDuelData[]>([]);
    const [pendingDuels, setPendingDuels] = useState<Duel[]>([]);
    const [outgoingDuels, setOutgoingDuels] = useState<Duel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch active & pending duels for MY clan
    const fetchDuels = useCallback(async () => {
        if (!myClan) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Get Active Duels (where my clan is involved)
            const { data: active, error: activeError } = await supabase
                .from('duels')
                .select(`
                    *,
                    challenger:clans!challenger_clan_id(name, tag, avatar_url),
                    defender:clans!defender_clan_id(name, tag, avatar_url)
                `)
                .or(`challenger_clan_id.eq.${myClan.id},defender_clan_id.eq.${myClan.id}`)
                .eq('status', 'active');

            if (activeError) throw activeError;

            // Enrich active duels with live stats
            const enrichedActive: ActiveDuelData[] = [];
            for (const d of active || []) {
                const { data: stats, error: statsError } = await supabase.rpc('get_duel_stats', { p_duel_id: d.id });
                if (!statsError && stats) {
                    enrichedActive.push({
                        duel: d,
                        challenger_stats: stats.challenger,
                        defender_stats: stats.defender,
                        challenger_name: d.challenger.name,
                        defender_name: d.defender.name,
                        challenger_tag: d.challenger.tag,
                        defender_tag: d.defender.tag,
                        challenger_avatar: d.challenger.avatar_url,
                        defender_avatar: d.defender.avatar_url,
                    });
                }
            }
            setActiveDuels(enrichedActive);

            // 2. Get Pending Challenges (INCOMING)
            const { data: pendingIn, error: pendingInError } = await supabase
                .from('duels')
                .select('*, challenger:clans!challenger_clan_id(name, tag)')
                .eq('defender_clan_id', myClan.id)
                .eq('status', 'pending');

            if (pendingInError) throw pendingInError;
            setPendingDuels(pendingIn || []);

            // 3. Get Pending Challenges (OUTGOING)
            const { data: pendingOut, error: pendingOutError } = await supabase
                .from('duels')
                .select('*, defender:clans!defender_clan_id(name, tag)')
                .eq('challenger_clan_id', myClan.id)
                .eq('status', 'pending');

            if (pendingOutError) throw pendingOutError;
            setOutgoingDuels(pendingOut || []);

        } catch (err: any) {
            console.error('Error fetching duels:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [myClan]);

    // Create a challenge
    const challengeClan = async (targetClanId: string) => {
        if (!myClan) throw new Error("No clan");

        // Check if already dueling
        const existing = activeDuels.find(d =>
            (d.duel.challenger_clan_id === myClan.id && d.duel.defender_clan_id === targetClanId) ||
            (d.duel.defender_clan_id === myClan.id && d.duel.challenger_clan_id === targetClanId)
        );
        if (existing) throw new Error("Already in a duel with this clan!");

        const { error } = await supabase.from('duels').insert({
            challenger_clan_id: myClan.id,
            defender_clan_id: targetClanId,
            status: 'pending',
            // Default 24h duration upon start
        });
        if (error) throw error;
        await fetchDuels();
    };

    // Accept a challenge
    const acceptDuel = async (duelId: string) => {
        const now = new Date();
        const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

        const { error } = await supabase
            .from('duels')
            .update({
                status: 'active',
                started_at: now.toISOString(),
                ended_at: endsAt.toISOString()
            })
            .eq('id', duelId);

        if (error) throw error;
        await fetchDuels();
    };

    const declineDuel = async (duelId: string) => {
        const { error } = await supabase
            .from('duels')
            .update({ status: 'declined' })
            .eq('id', duelId);

        if (error) throw error;
        await fetchDuels();
    };

    // Initial fetch
    useEffect(() => {
        fetchDuels();

        // Poll for updates (simplified realtime)
        const interval = setInterval(fetchDuels, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [fetchDuels]);

    return {
        activeDuels,
        pendingDuels,
        outgoingDuels,
        challengeClan,
        acceptDuel,
        declineDuel,
        loading,
        error,
        refetch: fetchDuels
    };
};
