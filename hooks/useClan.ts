import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Clan {
    id: string;
    name: string;
    tag: string;
    description: string;
    avatar_url: string;
    entry_fee: number;
    max_members: number;
    is_private: boolean;
    owner_id: string;
    created_at: string;
}

export interface ClanWithMembers extends Clan {
    member_count: number;
}

export interface ClanMember {
    id: string;
    clan_id: string;
    user_id: string;
    role: 'owner' | 'commander' | 'vanguard' | 'member';
    joined_at: string;
    left_at: string | null;
}

interface UseClanReturn {
    myClan: Clan | null;
    myMembership: ClanMember | null;
    allClans: ClanWithMembers[];
    loading: boolean;
    browsing: boolean;
    error: string | null;
    createClan: (data: CreateClanData) => Promise<Clan | null>;
    joinClan: (clanId: string) => Promise<boolean>;
    leaveClan: () => Promise<boolean>;
    fetchAllClans: () => Promise<void>;
    refetch: () => Promise<void>;
}

interface CreateClanData {
    name: string;
    tag: string;
    description: string;
    entry_fee: number;
    max_members: number;
    is_private: boolean;
    avatar_url?: string;
}

/** Hard cap: maximum members allowed per clan */
export const MAX_CLAN_MEMBERS = 6;

export const useClan = (): UseClanReturn => {
    const { user } = useAuth();
    const [myClan, setMyClan] = useState<Clan | null>(null);
    const [myMembership, setMyMembership] = useState<ClanMember | null>(null);
    const [allClans, setAllClans] = useState<ClanWithMembers[]>([]);
    const [loading, setLoading] = useState(true);
    const [browsing, setBrowsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMyClan = async () => {
        if (!user) {
            setMyClan(null);
            setMyMembership(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // ★ Only fetch ACTIVE membership (left_at IS NULL)
            const { data: membership, error: memberError } = await supabase
                .from('clan_members')
                .select('*')
                .eq('user_id', user.id)
                .is('left_at', null)
                .maybeSingle();

            if (memberError) throw memberError;

            if (membership) {
                setMyMembership(membership);

                const { data: clan, error: clanError } = await supabase
                    .from('clans')
                    .select('*')
                    .eq('id', membership.clan_id)
                    .single();

                if (clanError) throw clanError;
                setMyClan(clan);
            } else {
                setMyClan(null);
                setMyMembership(null);
            }
        } catch (err: any) {
            console.error('Error fetching clan:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyClan();
    }, [user]);

    // Fetch all public clans with ACTIVE member counts
    const fetchAllClans = async () => {
        try {
            setBrowsing(true);
            setError(null);

            // Get all public clans
            const { data: clans, error: clansError } = await supabase
                .from('clans')
                .select('*')
                .eq('is_private', false)
                .order('created_at', { ascending: false });

            if (clansError) throw clansError;

            // ★ Get only ACTIVE members (left_at IS NULL)
            const { data: memberCounts, error: countError } = await supabase
                .from('clan_members')
                .select('clan_id')
                .is('left_at', null);

            if (countError) throw countError;

            // Count members per clan
            const counts: Record<string, number> = {};
            memberCounts?.forEach((m) => {
                counts[m.clan_id] = (counts[m.clan_id] || 0) + 1;
            });

            const clansWithMembers: ClanWithMembers[] = (clans || []).map((clan) => ({
                ...clan,
                member_count: counts[clan.id] || 0,
            }));

            setAllClans(clansWithMembers);
        } catch (err: any) {
            console.error('Error fetching clans:', err);
            setError(err.message);
        } finally {
            setBrowsing(false);
        }
    };

    const createClan = async (data: CreateClanData): Promise<Clan | null> => {
        if (!user) {
            setError('You must be logged in to create a clan');
            return null;
        }

        try {
            setError(null);

            // Force max_members to MAX_CLAN_MEMBERS (6)
            const { data: newClan, error: clanError } = await supabase
                .from('clans')
                .insert({
                    name: data.name,
                    tag: data.tag.toUpperCase(),
                    description: data.description,
                    avatar_url: data.avatar_url || '',
                    entry_fee: data.entry_fee,
                    max_members: MAX_CLAN_MEMBERS,
                    is_private: data.is_private,
                    owner_id: user.id,
                })
                .select()
                .single();

            if (clanError) throw clanError;

            const { error: memberError } = await supabase
                .from('clan_members')
                .insert({
                    clan_id: newClan.id,
                    user_id: user.id,
                    role: 'owner',
                });

            if (memberError) throw memberError;

            setMyClan(newClan);
            setMyMembership({
                id: '',
                clan_id: newClan.id,
                user_id: user.id,
                role: 'owner',
                joined_at: new Date().toISOString(),
                left_at: null,
            });

            return newClan;
        } catch (err: any) {
            console.error('Error creating clan:', err);
            setError(err.message);
            return null;
        }
    };

    const joinClan = async (clanId: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to join a clan');
            return false;
        }

        if (myClan) {
            setError('You must leave your current clan before joining another');
            return false;
        }

        try {
            setError(null);

            // ★ Check ACTIVE member count before joining
            const { count, error: countError } = await supabase
                .from('clan_members')
                .select('*', { count: 'exact', head: true })
                .eq('clan_id', clanId)
                .is('left_at', null);

            if (countError) throw countError;

            if ((count ?? 0) >= MAX_CLAN_MEMBERS) {
                setError(`Clan is full. Maximum ${MAX_CLAN_MEMBERS} members allowed.`);
                return false;
            }

            const { error: joinError } = await supabase
                .from('clan_members')
                .insert({
                    clan_id: clanId,
                    user_id: user.id,
                    role: 'member',
                });

            if (joinError) throw joinError;

            // Refresh state
            await fetchMyClan();
            return true;
        } catch (err: any) {
            console.error('Error joining clan:', err);
            setError(err.message);
            return false;
        }
    };

    const leaveClan = async (): Promise<boolean> => {
        if (!user || !myClan) {
            setError('No clan to leave');
            return false;
        }

        if (myMembership?.role === 'owner') {
            setError('Owners cannot leave their clan. Transfer ownership first.');
            return false;
        }

        try {
            setError(null);

            // ★ Soft-delete: set left_at instead of deleting the row.
            //   This preserves the membership record so trades made during
            //   this membership period still count toward the clan's PnL.
            const { error: leaveError } = await supabase
                .from('clan_members')
                .update({ left_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('clan_id', myClan.id)
                .is('left_at', null);

            if (leaveError) throw leaveError;

            setMyClan(null);
            setMyMembership(null);
            return true;
        } catch (err: any) {
            console.error('Error leaving clan:', err);
            setError(err.message);
            return false;
        }
    };

    return {
        myClan,
        myMembership,
        allClans,
        loading,
        browsing,
        error,
        createClan,
        joinClan,
        leaveClan,
        fetchAllClans,
        refetch: fetchMyClan,
    };
};
