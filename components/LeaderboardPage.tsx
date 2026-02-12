import React, { useState } from 'react';
import {
  Search, Trophy, Users, ArrowRight,
  Crown, Loader2, TrendingUp, BarChart3, Swords, Shield
} from 'lucide-react';
import { useLeaderboard, formatVolume, formatROI } from '../hooks/useLeaderboard';
import { useClan } from '../hooks/useClan';
import { useDuels } from '../hooks/useDuels';
import { useToast } from '../contexts/ToastContext';

type SortField = 'roi' | 'volume' | 'members';

const LeaderboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('roi');
  const [challengingId, setChallengingId] = useState<string | null>(null);

  const { clans, loading } = useLeaderboard();
  const { myClan } = useClan();
  const { activeDuels, pendingDuels, outgoingDuels, challengeClan } = useDuels();
  const { success, error } = useToast();

  const handleChallenge = async (e: React.MouseEvent, clanId: string, clanName: string) => {
    e.stopPropagation();
    if (!myClan) return;

    if (activeDuels.length > 0 || pendingDuels.length > 0 || outgoingDuels.length > 0) {
      error("Command Busy", "Your clan is already involved in active operations. Finish them first!");
      return;
    }

    if (confirm(`Challenge ${clanName} to a 24h ROI duel?`)) {
      setChallengingId(clanId);
      try {
        await challengeClan(clanId);
        success("Challenge Deployed", `Target package sent to ${clanName}. Awaiting response.`);
      } catch (err: any) {
        error("Mission Aborted", err.message);
      } finally {
        setChallengingId(null);
      }
    }
  };

  const sorted = [...clans].sort((a, b) => {
    if (sortBy === 'roi') return b.roi_pct - a.roi_pct;
    if (sortBy === 'volume') return b.total_volume - a.total_volume;
    return b.member_count - a.member_count;
  }).map((clan, i) => ({ ...clan, rank: i + 1 }));

  const filteredData = sorted.filter(clan =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top3 = filteredData.slice(0, 3); // Take first 3 for podium logic
  const rest = filteredData.slice(3);

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center bg-black">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="pt-40 pb-20 min-h-screen bg-black text-white relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-400">

      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-900/10 via-black to-transparent pointer-events-none" />
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-24 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-8 mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Trophy className="w-3 h-3" />
            <span>SEASON 1 : CYCLE 4</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-2xl">
            Hall of <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-500">Legends</span>
          </h1>
          <p className="text-zinc-400 font-light text-xl tracking-wide uppercase max-w-2xl mx-auto">
            The elite trench warriors of this cycle
          </p>
        </div>

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-end mb-24">
          {Array.from({ length: 3 }).map((_, i) => {
            const clan = sorted[i]; // Top 3 from sorted list
            const isFirst = i === 0;
            const medalColors = [
              { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: '1ST' },
              { border: 'border-zinc-400/50', bg: 'bg-zinc-400/10', text: 'text-zinc-400', label: '2ND' },
              { border: 'border-orange-600/50', bg: 'bg-orange-600/10', text: 'text-orange-600', label: '3RD' },
            ];
            const medal = medalColors[i];
            // Order: 2nd (left), 1st (center), 3rd (right)
            const orderClass = isFirst ? 'md:order-2 md:-mb-12 z-10' : i === 1 ? 'md:order-1' : 'md:order-3';

            if (!clan) {
              return (
                <div key={`empty-${i}`} className={`relative ${orderClass}`}>
                  <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center text-center opacity-50">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 bg-black/50 flex items-center justify-center mb-6">
                      <Shield className="w-8 h-8 text-zinc-700" />
                    </div>
                    <div className="text-sm font-bold text-zinc-600 mb-2">EMPTY SLOT</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={clan.id} className={`relative group ${orderClass}`}>
                <div className={`
                        relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center
                        transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10
                        ${isFirst ? 'bg-gradient-to-b from-zinc-800 to-black border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] scale-105' : 'hover:border-white/20'}
                      `}>
                  {isFirst && (
                    <>
                      <div className="absolute -top-20 inset-x-0 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                      <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 text-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-bounce-slow" />
                    </>
                  )}

                  <div className={`relative w-24 h-24 rounded-2xl border-2 ${medal.border} bg-zinc-900 flex items-center justify-center overflow-hidden mb-6 shadow-xl group-hover:scale-105 transition-transform duration-500`}>
                    <img
                      src={clan.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${clan.tag}&backgroundColor=10b981`}
                      alt={clan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className={`${medal.bg} ${medal.text} px-4 py-1.5 rounded-full border ${medal.border} text-xs font-black mb-4 tracking-widest`}>
                    {medal.label}
                  </div>

                  <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{clan.name}</h3>
                  <div className="text-sm font-mono text-zinc-500 mb-8">${clan.tag}</div>

                  <div className="w-full space-y-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">ROI</span>
                      <span className={`font-mono font-bold text-xl ${clan.roi_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatROI(clan.roi_pct)}
                      </span>
                    </div>
                    <div className="w-full h-[1px] bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Volume</span>
                      <span className="text-cyan-400 font-mono font-bold text-sm">{formatVolume(clan.total_volume)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Filter Bar & Search */}
        <div className="max-w-4xl mx-auto mb-8 bg-zinc-900/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-24 z-20 shadow-xl shadow-black/50">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search protocol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-white pl-12 placeholder:text-zinc-600 h-10"
              />
            </div>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="flex gap-1 w-full md:w-auto p-1 overflow-x-auto">
              {([
                { key: 'roi' as SortField, label: 'ROI', icon: TrendingUp },
                { key: 'volume' as SortField, label: 'Volume', icon: BarChart3 },
                { key: 'members' as SortField, label: 'Members', icon: Users },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setSortBy(f.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === f.key
                    ? 'text-black bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <f.icon size={14} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="max-w-4xl mx-auto space-y-3 mb-24">
          {filteredData.slice(3).map((clan) => (
            <div
              key={clan.id}
              className="group relative flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/60 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />

              <div className="w-12 text-center relative z-10">
                <span className="text-xl font-black text-zinc-600 group-hover:text-emerald-500/50 transition-colors font-mono">
                  #{clan.rank.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-5 flex-1 relative z-10 w-full">
                <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-lg group-hover:scale-110 transition-transform bg-black">
                  <img
                    src={clan.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${clan.tag}&backgroundColor=10b981`}
                    alt={clan.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {clan.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                    <span className="text-emerald-500/70">${clan.tag}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="flex items-center gap-1 group-hover:text-zinc-300 transition-colors"><Users size={12} /> {clan.member_count} Members</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 relative z-10 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <div className={`text-lg font-bold font-mono ${clan.roi_pct >= 0 ? 'text-emerald-400 group-hover:drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-red-400'}`}>
                    {formatROI(clan.roi_pct)}
                  </div>
                  <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">ROI</div>
                </div>

                <div className="text-right hidden md:block w-24">
                  <div className="text-lg font-bold text-cyan-400 font-mono group-hover:text-cyan-300 transition-colors">
                    {formatVolume(clan.total_volume)}
                  </div>
                  <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Volume</div>
                </div>

                {myClan && clan.id !== myClan.id ? (
                  <button
                    onClick={(e) => handleChallenge(e, clan.id, clan.name)}
                    disabled={challengingId === clan.id}
                    className="ml-4 w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-zinc-500 flex items-center justify-center transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Challenge Clan"
                  >
                    {challengingId === clan.id ? <Loader2 size={18} className="animate-spin" /> : <Swords size={18} />}
                  </button>
                ) : (
                  <div className="ml-4 w-10 h-10" />
                )}
              </div>
            </div>
          ))}

          {filteredData.length === 0 && !loading && (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
              <Shield size={48} className="mx-auto text-zinc-800 mb-4" />
              <h3 className="text-zinc-500 font-medium">No clans found</h3>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;