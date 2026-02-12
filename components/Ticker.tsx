import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  Users,
  Shield
} from 'lucide-react';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { formatVolume, formatROI } from '../hooks/useLeaderboard';

const Ticker: React.FC = () => {
  const { stats, loading } = usePlatformStats();

  const items = [
    {
      label: "TOTAL VOLUME",
      value: loading ? '...' : formatVolume(stats.total_volume),
      icon: <DollarSign className="w-6 h-6 text-blue-400" />,
      color: "text-white"
    },
    {
      label: "TOP ROI (24H)",
      value: loading ? '...' : formatROI(stats.top_roi),
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      color: "text-emerald-400",
      glow: true
    },
    {
      label: "LIVE TRADES",
      value: loading ? '...' : stats.total_trades.toLocaleString(),
      icon: <Activity className="w-6 h-6 text-purple-400" />,
      color: "text-white"
    },
    {
      label: "ACTIVE CLANS",
      value: loading ? '...' : stats.total_clans.toLocaleString(),
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      color: "text-white"
    },
    {
      label: "SOLDIERS",
      value: loading ? '...' : stats.total_users.toLocaleString(),
      icon: <Users className="w-6 h-6 text-amber-400" />,
      color: "text-white"
    },
    {
      label: "24H VOLUME",
      value: loading ? '...' : formatVolume(stats.volume_24h),
      icon: <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />,
      color: "text-white"
    },
  ];

  return (
    <div className="w-full border-y border-white/10 bg-black/80 backdrop-blur-xl relative overflow-hidden py-6">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
        {[...items, ...items, ...items, ...items, ...items].map((stat, idx) => (
          <div key={idx} className="flex items-center gap-5 px-16 border-r border-white/5 last:border-r-0 group">
            <div className="p-2 rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase">
                {stat.label}
              </span>
              <span className={`text-2xl font-black font-mono tracking-tight ${stat.color} ${stat.glow ? 'drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : ''
                }`}>
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ticker;