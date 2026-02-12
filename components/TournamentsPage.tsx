import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Coins, Timer, Users, Swords,
    Crown, Loader2, TrendingUp, BarChart3, Medal,
    Calendar, Zap, Shield, ArrowRight
} from 'lucide-react';
import { useTournaments, type TournamentClan } from '../hooks/useTournaments';
import { formatVolume, formatROI } from '../hooks/useLeaderboard';
import Button from './ui/Button';

const MEDAL_COLORS = [
    { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-500', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]', label: '🥇 1ST' },
    { border: 'border-zinc-400/50', bg: 'bg-zinc-400/10', text: 'text-zinc-400', glow: '', label: '🥈 2ND' },
    { border: 'border-orange-600/50', bg: 'bg-orange-600/10', text: 'text-orange-600', glow: '', label: '🥉 3RD' },
];

const TournamentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { tournament, leaderboard, pastTournaments, loading, timeLeft } = useTournaments();

    if (loading) {
        return (
            <div className="pt-32 pb-24 min-h-screen flex items-center justify-center bg-black">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const isActive = tournament?.status === 'active';
    const isUpcoming = tournament?.status === 'upcoming';
    const prizePool = tournament?.prize_pool || 0;

    return (
        <div className="pt-40 pb-20 min-h-screen bg-black text-white relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-400">

            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-900/10 via-black to-transparent pointer-events-none" />
            <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-40 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <Trophy size={14} />
                        {tournament ? `Season ${tournament.season} • Week ${tournament.week}` : 'No Tournament'}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
                        Weekly <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-500">Tournament</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Compete every week. Top 3 clans by ROI win the prize pool.
                        <br className="hidden md:block" />
                        Trades during the week are what counts.
                    </p>
                </div>

                {/* Tournament Status + Prize Pool */}
                {tournament && (
                    <div className="mb-20 animate-fade-in-up delay-100">
                        <div className="relative bg-zinc-900/30 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl shadow-black/50">
                            {/* Decorative gradients */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                            <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                                {/* Left: Info */}
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 ${isActive ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                                            isUpcoming ? 'bg-yellow-500 text-black' :
                                                'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {isActive && <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                                            </span>}
                                            {isActive ? 'LIVE NOW' : isUpcoming ? 'UPCOMING' : 'ENDED'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
                                            <Timer size={14} className="text-emerald-500" />
                                            <span className="font-mono font-bold text-zinc-200">{timeLeft}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-xl text-zinc-400 font-medium mb-2 flex items-center gap-2">
                                        Total Prize Pool
                                    </h2>
                                    <div className="text-6xl md:text-7xl font-mono font-black text-white mb-8 tracking-tighter">
                                        ${prizePool.toLocaleString()}
                                    </div>

                                    {/* Prize breakdown */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 border border-white/10 rounded-xl p-4 text-center group hover:border-emerald-500/30 transition-colors">
                                            <div className="text-[10px] text-yellow-500 font-bold mb-2 uppercase tracking-wider">1st Place</div>
                                            <div className="text-xl md:text-2xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">${tournament.prize_1st}</div>
                                        </div>
                                        <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 border border-white/10 rounded-xl p-4 text-center group hover:border-emerald-500/30 transition-colors">
                                            <div className="text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-wider">2nd Place</div>
                                            <div className="text-xl md:text-2xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">${tournament.prize_2nd}</div>
                                        </div>
                                        <div className="bg-gradient-to-b from-zinc-800/50 to-zinc-900/50 border border-white/10 rounded-xl p-4 text-center group hover:border-emerald-500/30 transition-colors">
                                            <div className="text-[10px] text-orange-400 font-bold mb-2 uppercase tracking-wider">3rd Place</div>
                                            <div className="text-xl md:text-2xl font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">${tournament.prize_3rd}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Visual */}
                                <div className="relative flex items-center justify-center py-8 md:py-0">
                                    {/* Rotating Rings */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                        <div className="w-[300px] h-[300px] border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                        <div className="absolute w-[240px] h-[240px] border border-emerald-500/30 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]" />
                                    </div>

                                    {/* Center Content */}
                                    <div className="relative text-center z-10 bg-black/50 backdrop-blur-md p-8 rounded-full border border-white/5 shadow-2xl">
                                        <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 mb-1">
                                            ${Math.round(prizePool / 1000)}k
                                        </div>
                                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-[0.3em]">
                                            Week {tournament.week}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Stats */}
                            <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-zinc-500 uppercase tracking-wide font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-emerald-500" />
                                    <span>Start: <span className="text-zinc-300 font-mono text-sm ml-1 capitalize">{new Date(tournament.starts_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-emerald-500" />
                                    <span>End: <span className="text-zinc-300 font-mono text-sm ml-1 capitalize">{new Date(tournament.ends_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <Users size={14} className="text-emerald-500" />
                                    <span><span className="text-zinc-300 font-mono text-sm ml-1">{leaderboard.length}</span> clans competing</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Tournament State */}
                {!tournament && (
                    <div className="text-center py-20 animate-fade-in-up bg-zinc-900/30 rounded-3xl border border-white/5">
                        <Trophy size={48} className="mx-auto text-zinc-700 mb-4" />
                        <h2 className="text-2xl font-bold text-zinc-400 mb-2">No Active Tournament</h2>
                        <p className="text-zinc-600">The next weekly tournament hasn't been created yet. Stay tuned in the War Room.</p>
                    </div>
                )}

                {/* Podium - Top 3 */}
                {top3.length > 0 && (
                    <div className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black mb-2">
                                <span className="text-white">Weekly</span> <span className="text-emerald-500">Podium</span>
                            </h2>
                            <p className="text-zinc-500">Top 3 clans by ROI this week</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-end">
                            {/* We manually map 0, 1, 2 to ensure we always have 3 slots */}
                            {Array.from({ length: 3 }).map((_, i) => {
                                const clan = leaderboard[i]; // Top 3 are indices 0, 1, 2
                                const medal = MEDAL_COLORS[i];
                                const isFirst = i === 0;
                                // Order: 2nd (left), 1st (center), 3rd (right)
                                const orderClass = isFirst ? 'md:order-2 md:-mb-12 z-10' : i === 1 ? 'md:order-1' : 'md:order-3';

                                if (!clan) {
                                    // Empty Slot Placeholder
                                    return (
                                        <div key={`empty-${i}`} className={`relative ${orderClass}`}>
                                            <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-dashed border-white/5 rounded-2xl p-6 flex flex-col items-center text-center opacity-50 grayscale">
                                                <div className={`w-20 h-20 rounded-2xl border-2 border-white/5 bg-black/50 flex items-center justify-center mb-4`}>
                                                    <Shield className="w-8 h-8 text-zinc-800" />
                                                </div>
                                                <div className="px-3 py-1 rounded border border-white/5 bg-white/5 text-xs font-bold mb-3 text-zinc-600">
                                                    {medal.label}
                                                </div>
                                                <h3 className="text-lg font-bold text-zinc-700 mb-6">Empty Slot</h3>
                                                <div className="w-full h-20 bg-white/5 rounded-xl border border-white/5" />
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={clan.clan_id} className={`relative group ${orderClass}`}>
                                        <div className={`
                                            relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center
                                            transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10
                                            ${isFirst ? 'bg-gradient-to-b from-zinc-800 to-black border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-105' : 'hover:border-white/20'}
                                        `}>
                                            {/* Crown & Shine for 1st */}
                                            {isFirst && (
                                                <>
                                                    <div className="absolute -top-20 inset-x-0 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                                                    <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce-slow" />
                                                </>
                                            )}

                                            {/* Avatar */}
                                            <div className={`relative w-24 h-24 rounded-2xl border-2 ${medal.border} bg-zinc-900 flex items-center justify-center overflow-hidden mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500`}>
                                                {clan.avatar_url ? (
                                                    <img src={clan.avatar_url} alt={clan.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Shield className="w-10 h-10 text-zinc-700" />
                                                )}
                                                {/* Shine effect on avatar */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            </div>

                                            {/* Rank badge */}
                                            <div className={`${medal.bg} ${medal.text} px-4 py-1.5 rounded-full border ${medal.border} text-xs font-black mb-4 tracking-widest shadow-sm`}>
                                                {medal.label}
                                            </div>

                                            <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{clan.name}</h3>
                                            <div className="text-sm font-mono text-zinc-500 mb-8 flex items-center gap-1">
                                                <span className="text-zinc-600">$</span>
                                                {clan.tag}
                                            </div>

                                            {/* Stats */}
                                            <div className="w-full space-y-3 p-4 bg-black/40 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">ROI</span>
                                                    <span className={`font-mono font-bold text-xl ${clan.roi_pct >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-red-400'}`}>
                                                        {formatROI(clan.roi_pct)}
                                                    </span>
                                                </div>
                                                <div className="w-full h-[1px] bg-white/5" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Volume</span>
                                                    <span className="text-cyan-400 font-mono font-bold text-sm tracking-tight">{formatVolume(clan.total_volume)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rest of the rankings */}
                {rest.length > 0 && (
                    <div className="mb-20 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-lg font-bold text-zinc-400 flex items-center gap-2">
                                <BarChart3 size={18} /> Full Rankings
                            </h3>
                            <div className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Live Updates</div>
                        </div>

                        <div className="space-y-2">
                            {rest.map((clan) => (
                                <div
                                    key={clan.clan_id}
                                    className="group flex items-center gap-4 p-4 bg-zinc-900/20 border border-white/5 rounded-xl hover:bg-zinc-900/50 hover:border-emerald-500/20 transition-all duration-200"
                                >
                                    <span className="text-lg font-black text-zinc-600 font-mono w-8 text-center group-hover:text-zinc-400">
                                        {clan.rank?.toString().padStart(2, '0')}
                                    </span>
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden">
                                        {clan.avatar_url ? (
                                            <img src={clan.avatar_url} alt={clan.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Shield size={16} className="text-zinc-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{clan.name}</h4>
                                        <span className="text-xs text-zinc-500 font-mono group-hover:text-emerald-500/50 transition-colors">${clan.tag}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold font-mono ${clan.roi_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatROI(clan.roi_pct)}
                                        </div>
                                        <div className="text-[10px] text-zinc-600 font-bold uppercase">ROI</div>
                                    </div>
                                    <div className="text-right hidden md:block w-32">
                                        <div className="text-sm font-bold text-cyan-400 font-mono">{formatVolume(clan.total_volume)}</div>
                                        <div className="text-[10px] text-zinc-600 font-bold uppercase">Volume</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state if no clans */}
                {leaderboard.length === 0 && tournament && (
                    <div className="text-center py-16 mb-20 border border-dashed border-zinc-800 rounded-3xl">
                        <Swords size={40} className="mx-auto text-zinc-700 mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400 mb-2">The arena is empty</h3>
                        <p className="text-zinc-600 text-sm">Be the first to draw blood this week.</p>
                        <Button
                            variant="primary"
                            className="mt-6"
                            onClick={() => navigate('/war-room')}
                        >
                            Enter War Room
                        </Button>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {[
                        {
                            icon: <Calendar className="text-emerald-500" />,
                            title: "Monday Reset",
                            desc: "Tournaments automatically reset every Monday at 00:00 UTC."
                        },
                        {
                            icon: <TrendingUp className="text-emerald-500" />,
                            title: "ROI Based",
                            desc: "Performance is measured by percentage gain, not just volume. Small wallets can win."
                        },
                        {
                            icon: <Coins className="text-emerald-500" />,
                            title: "Automated Payouts",
                            desc: "Prizes are distributed to the clan treasury instantly upon conclusion."
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-zinc-900/20 border border-white/5 p-6 rounded-2xl hover:border-emerald-500/20 transition-all">
                            <div className="bg-black border border-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-emerald-500">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Past Tournaments */}
                {pastTournaments.length > 0 && (
                    <div className="mb-12 border-t border-white/5 pt-12">
                        <h3 className="text-lg font-bold text-zinc-400 mb-6 flex items-center gap-2">
                            <Trophy size={18} /> Archive
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {pastTournaments.map((t) => (
                                <div
                                    key={t.id}
                                    className="group bg-zinc-900/20 border border-white/5 rounded-lg p-4 flex items-center gap-4 hover:border-white/10 transition-colors"
                                >
                                    <div className="bg-zinc-900 w-10 h-10 rounded flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                                        <Medal size={18} className="text-emerald-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-zinc-300 group-hover:text-white">Season {t.season} — Week {t.week}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                            Ended {new Date(t.ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-emerald-500 font-mono">${t.prize_pool}</div>
                                        <div className="text-[10px] text-zinc-600">POOL</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TournamentsPage;
