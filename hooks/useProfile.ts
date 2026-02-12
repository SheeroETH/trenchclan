import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    xp: number;
    created_at: string;
}

interface UseProfileReturn {
    profile: Profile | null;
    loading: boolean;
    error: string | null;
    updateUsername: (newUsername: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                setProfile(data);
            } else {
                // Profile doesn't exist yet — create it
                const fallbackUsername =
                    user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.email?.split('@')[0] ||
                    'Anonymous';

                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: fallbackUsername,
                        avatar_url: user.user_metadata?.avatar_url || null,
                        xp: 0,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setProfile(newProfile);
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const updateUsername = async (newUsername: string): Promise<boolean> => {
        if (!user) return false;

        try {
            setError(null);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: newUsername })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile((prev) =>
                prev ? { ...prev, username: newUsername } : prev
            );
            return true;
        } catch (err: any) {
            console.error('Error updating username:', err);
            setError(err.message);
            return false;
        }
    };

    return {
        profile,
        loading,
        error,
        updateUsername,
        refetch: fetchProfile,
    };
};
