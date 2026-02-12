import React from 'react';
import { Crown, TrendingUp, Users, Loader2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useLeaderboard, formatVolume, formatROI } from '../hooks/useLeaderboard';

const LeaderboardPreview: React.FC = () => {
  const navigate = useNavigate();
  const { clans, loading } = useLeaderboard();

  // Take & reorder for podium display: [rank 2, rank 1, rank 3]
  const top3 = clans.slice(0, 3);
  const podium = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">The Trenches Top 3</h2>
          <p className="text-zinc-500">Real-time PnL tracking. Pure meritocracy.</p>
        </div>
        <Loader2 size={28} className="animate-spin text-emerald-500 my-16" />
      </section>
    );
  }

  if (podium.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">The Trenches Top 3</h2>
          <p className="text-zinc-500">Real-time PnL tracking. Pure meritocracy.</p>
        </div>
        <div className="text-center py-12 text-zinc-600">
          <p className="mb-4">No clans yet — be the first to dominate the trenches!</p>
          <Button variant="primary" onClick={() => navigate('/create-clan')}>
            Create a Clan
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">The Trenches Top 3</h2>
        <p className="text-zinc-500">Real-time PnL tracking. Pure meritocracy.</p>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-center gap-6 h-auto md:h-[400px] w-full mb-12">
        {podium.map((clan) => {
          const isFirst = clan.rank === 1;

          return (
            <div
              key={clan.rank}
              className={`
                relative w-full md:w-1/3 p-6 rounded-2xl border transition-all duration-300 group
                flex flex-col items-center text-center
                ${isFirst
                  ? 'h-[360px] md:h-full border-brand-accent/50 bg-brand-accent/5 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] z-10'
                  : 'h-[280px] md:h-[85%] border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-white/20'
                }
              `}
            >
              {isFirst && (
                <div className="absolute -top-6">
                  <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </div>
              )}

              <div className="mt-4 mb-4 relative">
                <img
                  src={clan.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${clan.tag}&backgroundColor=10b981`}
                  alt={clan.name}
                  className={`rounded-full object-cover border-4 ${isFirst ? 'w-24 h-24 border-brand-accent' : 'w-20 h-20 border-zinc-800'}`}
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                  #{clan.rank}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{clan.name}</h3>
              <div className="text-xs font-mono text-emerald-500 mb-2">${clan.tag}</div>

              <div className="flex items-center gap-4 mt-auto w-full pt-4 border-t border-white/5">
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs">
                    <Users className="w-3 h-3" /> Members
                  </div>
                  <span className="font-mono text-sm font-medium">{clan.member_count}</span>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs">
                    <TrendingUp className="w-3 h-3" /> ROI
                  </div>
                  <span className={`font-mono text-sm font-medium ${clan.roi_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatROI(clan.roi_pct)}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs">
                    <BarChart3 className="w-3 h-3" /> Vol
                  </div>
                  <span className="font-mono text-sm font-medium text-cyan-400">
                    {formatVolume(clan.total_volume)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="outline" onClick={() => navigate('/leaderboard')}>
        View All Rankings
      </Button>
    </section>
  );
};

export default LeaderboardPreview;