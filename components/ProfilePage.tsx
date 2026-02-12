import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import {
    Shield, TrendingUp, TrendingDown, Trophy, Star, Zap,
    Calendar, Target, BarChart3, Clock, Copy, CheckCircle2,
    Flame, Award, Users, ArrowUpRight, ArrowDownRight,
    Activity, Heart, Crosshair, Crown, Edit3, Loader2, AlertCircle,
    Link2, Unlink, ExternalLink, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useClan } from '../hooks/useClan';
import { useWalletAuth } from '../hooks/useWalletAuth';
import { RANKS, BADGES, getRank } from '../types/gamification';
import { useUserStats, formatPnl, formatRoiPercent } from '../hooks/useUserStats';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, loading: profileLoading, updateUsername } = useProfile();
    const { myClan, myMembership, loading: clanLoading, leaveClan } = useClan();
    const { connected, publicKey, disconnect } = useWallet();
    const { setVisible: setWalletModalVisible } = useWalletModal();
    const {
        walletAddress,
        isLinked,
        linking,
        unlinking,
        error: walletError,
        linkWallet,
        unlinkWallet,
    } = useWalletAuth();
    const { stats: userStats, recentTrades, loading: statsLoading, refetch: refetchStats } = useUserStats();

    const [copiedId, setCopiedId] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);
    const [pnlPeriod, setPnlPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('daily');
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const xp = profile?.xp ?? 0;
    const currentRank = getRank(xp);
    const nextRank = RANKS.find(r => r.minXp > xp);
    const xpProgress = nextRank
        ? ((xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100
        : 100;

    const displayName = profile?.username
        || user?.user_metadata?.username
        || user?.user_metadata?.full_name
        || user?.email?.split('@')[0]
        || 'Anonymous';

    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const userId = user?.id?.slice(0, 8) || '0x000000';

    const joinDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-';

    const copyId = () => {
        navigator.clipboard.writeText(user?.id || '');
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const copyWalletAddress = () => {
        if (!walletAddress) return;
        navigator.clipboard.writeText(walletAddress);
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
    };

    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 4)}...${addr.slice(-4)}`;

    const handleSaveUsername = async () => {
        if (!newUsername.trim()) return;
        setSavingUsername(true);
        const ok = await updateUsername(newUsername.trim());
        setSavingUsername(false);
        if (ok) setEditingUsername(false);
    };

    // Compute PnL data per period from real stats
    const pnlMap = {
        daily: { pnl: userStats.pnlDaily, vol: userStats.volumeDaily },
        weekly: { pnl: userStats.pnlWeekly, vol: userStats.volumeWeekly },
        monthly: { pnl: userStats.pnlMonthly, vol: userStats.volumeMonthly },
        allTime: { pnl: userStats.totalPnl, vol: userStats.volumeAlltime },
    };
    const currentPnl = pnlMap[pnlPeriod];
    const pnlValue = formatPnl(currentPnl.pnl);
    const pnlPercent = formatRoiPercent(currentPnl.pnl, currentPnl.vol);
    const pnlTrend = currentPnl.pnl >= 0 ? 'up' : 'down';

    const earnedBadgeIds = ['early_trencher'];

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (profileLoading || clanLoading) {
        return (
            <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 animate-fade-in-up min-h-screen">

            {/* ═══════════════ PROFILE HEADER ═══════════════ */}
            <div className="relative mb-12">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="relative w-28 h-28 rounded-3xl object-cover border-2 border-white/10" />
                        ) : (
                            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-4xl font-black text-black border-2 border-white/10">
                                {displayName[0]?.toUpperCase()}
                            </div>
                        )}
                        {/* Rank Badge */}
                        <div className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-black ${currentRank.color} border-current shadow-lg`}>
                            {currentRank.label}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            {editingUsername ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                                        placeholder={displayName}
                                        autoFocus
                                        className="text-2xl md:text-3xl font-black text-white bg-black/50 border border-white/20 rounded-xl px-3 py-1 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <button onClick={handleSaveUsername} disabled={savingUsername} className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                                        {savingUsername ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    </button>
                                    <button onClick={() => setEditingUsername(false)} className="p-2 bg-white/5 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors">
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                        {displayName}
                                    </h1>
                                    <button onClick={() => { setNewUsername(displayName); setEditingUsername(true); }} className="p-2 text-zinc-600 hover:text-emerald-400 transition-colors">
                                        <Edit3 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-zinc-500 mb-4">
                            <button onClick={copyId} className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-colors font-mono text-xs">
                                ID: {userId}...
                                {copiedId ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> Joined {joinDate}
                            </span>
                            <span className="flex items-center gap-1">
                                <Activity size={14} className="text-blue-500" /> {userStats.totalTrades} trades
                            </span>
                        </div>

                        {/* XP Bar */}
                        <div className="max-w-md mx-auto md:mx-0">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className={`font-bold ${currentRank.color}`}>{currentRank.label}</span>
                                {nextRank && (
                                    <span className="text-zinc-600">
                                        {xp.toLocaleString()} / {nextRank.minXp.toLocaleString()} XP
                                    </span>
                                )}
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                            {nextRank && (
                                <div className="text-right text-[10px] text-zinc-600 mt-1">
                                    {(nextRank.minXp - xp).toLocaleString()} XP to {nextRank.label}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ MAIN GRID ═══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ─── LEFT COLUMN ─── */}
                <div className="space-y-6">

                    {/* Clan Card */}
                    {myClan ? (
                        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => navigate('/war-room')}>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={14} className="text-emerald-500" /> My Clan
                            </h3>
                            <div className="flex items-center gap-4 mb-4">
                                <img src={myClan.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${myClan.tag}&backgroundColor=10b981`} alt="" className="w-14 h-14 rounded-xl border border-white/10 group-hover:scale-105 transition-transform" />
                                <div>
                                    <h4 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{myClan.name}</h4>
                                    <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">${myClan.tag}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Role</div>
                                    <div className="font-bold text-white capitalize">{myMembership?.role || 'Member'}</div>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="text-[10px] text-zinc-500 uppercase mb-1">Member Since</div>
                                    <div className="font-bold text-white">{myMembership?.joined_at ? new Date(myMembership.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}</div>
                                </div>
                            </div>

                            {/* Leave Clan (not for owners) */}
                            {myMembership?.role !== 'owner' && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    {!confirmLeave ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmLeave(true); }}
                                            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 transition-colors"
                                        >
                                            <LogOut size={12} /> Leave Clan
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-xs text-red-400">Are you sure?</span>
                                            <button
                                                disabled={leaving}
                                                onClick={async () => {
                                                    setLeaving(true);
                                                    await leaveClan();
                                                    setLeaving(false);
                                                    setConfirmLeave(false);
                                                }}
                                                className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                            >
                                                {leaving ? 'Leaving...' : 'Yes, leave'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmLeave(false)}
                                                className="px-3 py-1 bg-zinc-800 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:bg-zinc-700 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-zinc-900/40 border border-dashed border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => navigate('/create-clan')}>
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={14} className="text-zinc-600" /> No Clan Yet
                            </h3>
                            <p className="text-sm text-zinc-500 mb-4">Join or create a clan to unlock the War Room, team competitions, and more.</p>
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold group-hover:gap-3 transition-all">
                                <Users size={16} /> Create or Join a Clan →
                            </div>
                        </div>
                    )}

                    {/* Wallet Card */}
                    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/20 transition-all">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Wallet size={14} className="text-purple-500" /> Solana Wallet
                        </h3>

                        {!connected ? (
                            /* STATE: Not connected */
                            <div className="text-center py-2">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <Wallet size={24} className="text-purple-500/60" />
                                </div>
                                <p className="text-sm text-zinc-500 mb-4">
                                    Connect your Phantom wallet to import trades and track on-chain activity.
                                </p>
                                <button
                                    onClick={() => setWalletModalVisible(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                                >
                                    <Wallet size={16} />
                                    Connect Wallet
                                </button>
                            </div>
                        ) : !isLinked ? (
                            /* STATE: Connected but NOT linked */
                            <div>
                                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-black/30 border border-white/5">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                        <Wallet size={16} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Connected</div>
                                        <button
                                            onClick={copyWalletAddress}
                                            className="flex items-center gap-1.5 text-sm font-mono text-white hover:text-purple-400 transition-colors"
                                        >
                                            {truncateAddress(walletAddress!)}
                                            {copiedWallet
                                                ? <CheckCircle2 size={12} className="text-emerald-400" />
                                                : <Copy size={12} className="text-zinc-600" />
                                            }
                                        </button>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" title="Not linked" />
                                </div>

                                <p className="text-xs text-zinc-500 mb-3">
                                    Link this wallet to your profile to track trades and earn XP.
                                </p>

                                {walletError && (
                                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                        <AlertCircle size={12} className="flex-shrink-0" />
                                        {walletError}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={linkWallet}
                                        disabled={linking}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all disabled:opacity-50"
                                    >
                                        {linking
                                            ? <><Loader2 size={14} className="animate-spin" /> Linking...</>
                                            : <><Link2 size={14} /> Link Wallet</>
                                        }
                                    </button>
                                    <button
                                        onClick={() => disconnect()}
                                        className="px-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all"
                                        title="Disconnect"
                                    >
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* STATE: Connected AND linked */
                            <div>
                                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Linked & Verified
                                        </div>
                                        <button
                                            onClick={copyWalletAddress}
                                            className="flex items-center gap-1.5 text-sm font-mono text-white hover:text-emerald-400 transition-colors"
                                        >
                                            {truncateAddress(walletAddress!)}
                                            {copiedWallet
                                                ? <CheckCircle2 size={12} className="text-emerald-400" />
                                                : <Copy size={12} className="text-zinc-600" />
                                            }
                                        </button>
                                    </div>
                                </div>

                                <a
                                    href={`https://solscan.io/account/${walletAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full mb-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 bg-black/30 border border-white/5 hover:border-white/15 hover:text-white transition-all"
                                >
                                    <ExternalLink size={12} /> View on Solscan
                                </a>

                                {walletError && (
                                    <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                        <AlertCircle size={12} className="flex-shrink-0" />
                                        {walletError}
                                    </div>
                                )}

                                <button
                                    onClick={unlinkWallet}
                                    disabled={unlinking}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs text-zinc-600 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                                >
                                    {unlinking
                                        ? <><Loader2 size={12} className="animate-spin" /> Unlinking...</>
                                        : <><Unlink size={12} /> Unlink Wallet</>
                                    }
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Badges */}
                    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Award size={14} className="text-amber-500" /> Badges Earned
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {BADGES.map((badge) => {
                                const earned = earnedBadgeIds.includes(badge.id);
                                const rarityColors: Record<string, string> = {
                                    Common: 'border-zinc-700 text-zinc-500',
                                    Rare: 'border-blue-500/30 text-blue-400',
                                    Epic: 'border-purple-500/30 text-purple-400',
                                    Legendary: 'border-amber-500/30 text-amber-400',
                                };
                                return (
                                    <div
                                        key={badge.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${earned
                                            ? `bg-white/5 ${rarityColors[badge.rarity]} hover:bg-white/10`
                                            : 'bg-black/20 border-white/5 opacity-40 grayscale'
                                            }`}
                                    >
                                        <span className="text-2xl">{badge.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{badge.name}</div>
                                            <div className="text-[10px] text-zinc-500 truncate">{badge.description}</div>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${rarityColors[badge.rarity]}`}>
                                            {badge.rarity}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rank Perks */}
                    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={14} className="text-cyan-500" /> Rank Perks
                        </h3>
                        <div className="space-y-2">
                            {currentRank.perks.map((perk, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                    {perk}
                                </div>
                            ))}
                            {nextRank && (
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Next unlock at {nextRank.label}:</div>
                                    {nextRank.perks.filter(p => !currentRank.perks.includes(p)).map((perk, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex-shrink-0" />
                                            {perk}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── CENTER + RIGHT COLUMNS ─── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* PnL Overview */}
                    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={14} className="text-emerald-500" /> Performance
                            </h3>
                            <div className="flex bg-black/40 rounded-lg border border-white/5 p-0.5">
                                {(['daily', 'weekly', 'monthly', 'allTime'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setPnlPeriod(period)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pnlPeriod === period
                                            ? 'bg-white/10 text-white'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                    >
                                        {period === 'allTime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Big PnL Display */}
                        <div className="flex items-end gap-4 mb-8">
                            <div>
                                {statsLoading ? (
                                    <Loader2 size={28} className="animate-spin text-zinc-600" />
                                ) : (
                                    <>
                                        <div className={`text-5xl font-black font-mono tracking-tight ${pnlTrend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {pnlValue}
                                        </div>
                                        <div className={`flex items-center gap-1 mt-1 text-sm font-bold ${pnlTrend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {pnlTrend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            {pnlPercent}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Trades', value: userStats.totalTrades.toLocaleString(), icon: <Activity size={14} className="text-blue-400" /> },
                                { label: 'Win Rate', value: `${userStats.winRate}%`, icon: <Target size={14} className="text-emerald-400" /> },
                                { label: 'Best Trade', value: formatPnl(userStats.bestTradePnl), sub: userStats.bestTradeToken, icon: <Crown size={14} className="text-amber-400" /> },
                                { label: 'Buys / Sells', value: `${userStats.totalBuys} / ${userStats.totalSells}`, icon: <TrendingUp size={14} className="text-purple-400" /> },
                                { label: 'Total Volume', value: formatPnl(userStats.totalVolume).replace('+', ''), icon: <BarChart3 size={14} className="text-cyan-400" /> },
                                { label: 'Active Days', value: `${userStats.activeDays}d`, icon: <Flame size={14} className="text-orange-400" /> },
                                { label: 'Total PnL', value: formatPnl(userStats.totalPnl), icon: <Star size={14} className="text-yellow-400" /> },
                                { label: 'Clan Loyalty', value: myClan ? '100%' : '-', icon: <Heart size={14} className="text-red-400" /> },
                            ].map((stat, i) => (
                                <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                                        {stat.icon} {stat.label}
                                    </div>
                                    <div className="text-xl font-bold text-white font-mono group-hover:text-emerald-400 transition-colors">
                                        {stat.value}
                                    </div>
                                    {stat.sub && stat.sub !== '-' && <div className="text-[10px] text-zinc-600 mt-0.5">on ${stat.sub}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Trades */}
                    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Crosshair size={14} className="text-emerald-500" /> Recent Operations
                        </h3>
                        <div className="space-y-2">
                            {statsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-zinc-600" />
                                </div>
                            ) : recentTrades.length > 0 ? recentTrades.map((trade) => {
                                const isBuy = trade.trade_type === 'buy';
                                const pnlNum = Number(trade.pnl_usd) || 0;
                                return (
                                    <div key={trade.id} className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border ${isBuy
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                                }`}>
                                                {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">${trade.token_symbol}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isBuy
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {trade.trade_type}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-zinc-600">{formatPnl(Number(trade.amount_usd)).replace('+', '').replace('-', '')} SOL</div>
                                            </div>
                                        </div>
                                        {!isBuy && pnlNum !== 0 && (
                                            <div className="text-right">
                                                <div className={`text-sm font-bold font-mono ${pnlNum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {formatPnl(pnlNum)}
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-xs text-zinc-600 w-16 text-right flex items-center justify-end gap-1">
                                            <Clock size={10} /> {formatTimeAgo(trade.created_at)}
                                        </div>
                                        {trade.signature && (
                                            <a
                                                href={`https://solscan.io/tx/${trade.signature}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-700 hover:text-emerald-400 transition-colors flex-shrink-0"
                                                title="View on Solscan"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8 text-zinc-600">
                                    <Activity size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No trades recorded yet</p>
                                    <p className="text-xs text-zinc-700 mt-1">Connect your wallet and import trades to see your stats here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
