import React from 'react';
import {
    MessageSquare, Bell, Trophy, Coins, Zap, Activity,
    ArrowRight, Users, TrendingUp
} from 'lucide-react';
import Button from './ui/Button';

const FeaturesPage: React.FC = () => {
    return (
        <div className="pt-32 pb-24 min-h-screen bg-black text-white px-6">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-20 text-center">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8">
                    Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Capabilities</span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">
                    A tactical suite designed for coordinated warfare. Every tool you need to dominate the market.
                </p>
            </div>

            {/* Bento Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 auto-rows-[300px]">

                {/* Feature A1: The War Room (Large, Col-span-2) */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 p-8 flex flex-col justify-between">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="p-3 bg-black/50 border border-white/10 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 z-${10 - i}`}>
                                    <Users size={14} />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold z-0">
                                +12
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8">
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">The War Room</h3>
                        <p className="text-zinc-400 max-w-md">
                            Shared command center. Discuss, analyze, and launch raids on the latest launches in perfect sync with your clan.
                        </p>
                    </div>
                </div>

                {/* Feature A2: Smart Alerts (Standard) */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 p-8 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Bell className="w-24 h-24 text-emerald-500 rotate-12" />
                    </div>

                    <div className="relative z-10 p-3 w-fit bg-black/50 border border-white/10 rounded-xl mb-auto">
                        <Bell className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Smart Alerts</h3>
                        <p className="text-zinc-400 text-sm">
                            Never miss an entry. Receive instant notifications when a team member detects a high-potential opportunity.
                        </p>
                    </div>
                </div>

                {/* Feature B1: Seasonal Leaderboards (Tall, Row-span-2) */}
                <div className="md:row-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-amber-500/30 transition-all duration-500 p-8 flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 p-3 w-fit bg-black/50 border border-white/10 rounded-xl mb-8">
                        <Trophy className="w-6 h-6 text-amber-400" />
                    </div>

                    <div className="flex-1 flex items-center justify-center py-6">
                        <div className="relative w-full aspect-[3/4] max-w-[160px] bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-end p-4 gap-2">
                            {/* Ranking Bars */}
                            <div className="flex items-end gap-2 w-full h-32 px-2">
                                <div className="w-1/3 bg-zinc-800 h-[40%] rounded-t-sm animate-pulse delay-700" />
                                <div className="w-1/3 bg-amber-500 h-[80%] rounded-t-sm shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                <div className="w-1/3 bg-zinc-700 h-[60%] rounded-t-sm animate-pulse delay-300" />
                            </div>
                            <div className="w-full h-px bg-white/10" />
                            <div className="text-xs text-amber-400 font-mono">RANK #1</div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Seasonal Leaderboards</h3>
                        <p className="text-zinc-400 text-sm">
                            Climb the ranks. Measure your clan's ROI against top global teams and unlock prestige badges.
                        </p>
                    </div>
                </div>

                {/* Feature B2: Automated Spoils (Standard) */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 p-8 flex flex-col justify-between">
                    <div className="relative z-10 p-3 w-fit bg-black/50 border border-white/10 rounded-xl mb-auto">
                        <Coins className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 blur-sm group-hover:blur-0">
                            $$$
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Automated Spoils</h3>
                        <p className="text-zinc-400 text-sm">
                            Transparency first. Cash prizes distributed automatically via smart contracts at the end of each season.
                        </p>
                    </div>
                </div>

                {/* Feature C1: Sniper Integration (Standard) */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-cyan-500/30 transition-all duration-500 p-8 flex flex-col justify-between">
                    <div className="relative z-10 p-3 w-fit bg-black/50 border border-white/10 rounded-xl mb-auto">
                        <Zap className="w-6 h-6 text-cyan-400" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Sniper Integration</h3>
                        <p className="text-zinc-400 text-sm">
                            Ultra-fast execution. Connect your favorite trading tools and trade directly from your clan interface.
                        </p>
                    </div>
                </div>

                {/* Feature C2: On-Chain Analytics (Wide, Col-span-2) */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 p-8 flex flex-row items-center gap-8">
                    <div className="flex-1">
                        <div className="relative z-10 p-3 w-fit bg-black/50 border border-white/10 rounded-xl mb-6">
                            <Activity className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">On-Chain Analytics</h3>
                        <p className="text-zinc-400 max-w-sm">
                            Visualize real performance. Track global clan PnL and identify top performers with verified on-chain data.
                        </p>
                    </div>

                    {/* Abstract Sparkline Visual */}
                    <div className="hidden md:flex flex-1 h-32 items-end justify-between px-4 pb-4 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-500/10 to-transparent" />
                        <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none">
                            <path
                                d="M0 120 C 50 120, 100 80, 150 90 S 250 40, 300 20 L 300 150 L 0 150 Z"
                                fill="url(#gradient)"
                                className="opacity-20"
                            />
                            <path
                                d="M0 120 C 50 120, 100 80, 150 90 S 250 40, 300 20"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Floating Data Points */}
                        <div className="absolute top-4 right-8 bg-zinc-900 border border-emerald-500/30 px-2 py-1 rounded text-xs text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            +2,402%
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer CTA */}
            <div className="mt-32 max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8 leading-tight">
                    Built for the frontlines. <br />
                    <span className="text-zinc-500">Scaled for the elite.</span>
                </h2>

                <div className="flex flex-col items-center gap-6">
                    <Button variant="primary" withIcon className="h-16 px-10 text-xl w-full md:w-auto">
                        Join Season 1 Now
                    </Button>
                    <p className="text-sm text-zinc-500 uppercase tracking-widest">
                        Limited Spots Available
                    </p>
                </div>
            </div>

        </div>
    );
};

export default FeaturesPage;
