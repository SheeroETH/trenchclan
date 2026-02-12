import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UseWalletAuthReturn {
    walletAddress: string | null;
    isLinked: boolean;
    linking: boolean;
    unlinking: boolean;
    error: string | null;
    linkWallet: () => Promise<boolean>;
    unlinkWallet: () => Promise<boolean>;
}

/**
 * Hook that manages the link between a Solana wallet and a Supabase user profile.
 *
 * Flow:
 *   1. User connects wallet via Phantom (handled by wallet-adapter)
 *   2. User clicks "Link Wallet" → we save the public key in profiles.wallet_address
 *   3. On subsequent visits, autoConnect re-establishes the wallet connection
 *   4. We check if the connected wallet matches profiles.wallet_address
 */
export const useWalletAuth = (): UseWalletAuthReturn => {
    const { publicKey, connected } = useWallet();
    const { user } = useAuth();

    const [savedAddress, setSavedAddress] = useState<string | null>(null);
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch saved wallet address from profile on mount
    useEffect(() => {
        if (!user) {
            setSavedAddress(null);
            return;
        }

        const fetchWallet = async () => {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('wallet_address')
                .eq('id', user.id)
                .single();

            if (!fetchError && data) {
                setSavedAddress(data.wallet_address || null);
            }
        };

        fetchWallet();
    }, [user]);

    const walletAddress = connected && publicKey ? publicKey.toBase58() : null;
    const isLinked = !!savedAddress && savedAddress === walletAddress;

    // Link the currently connected wallet to the user's profile
    const linkWallet = useCallback(async (): Promise<boolean> => {
        if (!user || !walletAddress) {
            setError('Connect your wallet first');
            return false;
        }

        setLinking(true);
        setError(null);

        try {
            // Check if this wallet is already linked to another account
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('wallet_address', walletAddress)
                .neq('id', user.id)
                .maybeSingle();

            if (existing) {
                setError('This wallet is already linked to another account');
                setLinking(false);
                return false;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ wallet_address: walletAddress })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSavedAddress(walletAddress);
            setLinking(false);
            return true;
        } catch (err: any) {
            console.error('Error linking wallet:', err);
            setError(err.message || 'Failed to link wallet');
            setLinking(false);
            return false;
        }
    }, [user, walletAddress]);

    // Unlink wallet from profile
    const unlinkWallet = useCallback(async (): Promise<boolean> => {
        if (!user) return false;

        setUnlinking(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ wallet_address: null })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSavedAddress(null);
            setUnlinking(false);
            return true;
        } catch (err: any) {
            console.error('Error unlinking wallet:', err);
            setError(err.message || 'Failed to unlink wallet');
            setUnlinking(false);
            return false;
        }
    }, [user]);

    return {
        walletAddress,
        isLinked,
        linking,
        unlinking,
        error,
        linkWallet,
        unlinkWallet,
    };
};
