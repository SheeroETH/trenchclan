import React, { useState } from 'react';
import { Shield, Crosshair, Coins, Crown, ArrowRight, UserPlus, TrendingUp } from 'lucide-react';

const BentoFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const features = [
    {
      id: 0,
      title: "FORM YOUR ALLIANCE",
      subtitle: "Social Layer",
      description: "Solo traders are liquidity. Clans are predators. Create a gated community where only verifiable winners can join.",
      icon: Shield,
      ui: (
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <UserPlus size={14} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="h-2 w-20 bg-white/20 rounded-full mb-1" />
              <div className="h-1.5 w-12 bg-white/10 rounded-full" />
            </div>
            <div className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">NVITE</div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 opacity-60">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-16 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 opacity-30">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-24 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "COORDINATED RAIDS",
      subtitle: "Warfare",
      description: "Don't just buy. Attack. Sync entry and exit points with your clan to move markets and crush resistance levels.",
      icon: Crosshair,
      ui: (
        <div className="relative w-full max-w-[300px] h-[160px] bg-black/40 rounded-xl border border-white/10 p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,rgba(255,255,255,0.05)_1px)] bg-[size:20px_20px]" />
          <div className="flex items-end justify-between h-full gap-1 relative z-10 pt-4">
            {[20, 35, 30, 50, 45, 70, 60, 90].map((h, i) => (
              <div key={i} className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 transition-colors rounded-t-sm relative group">
                <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-emerald-500" />
              </div>
            ))}
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 backdrop-blur-md">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">+420%</span>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "CLAN TREASURY",
      subtitle: "Economics",
      description: "Automate profit sharing. Tax winning trades to build a war chest, or distribute dividends to token holders.",
      icon: Coins,
      ui: (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative w-32 h-32 rounded-full border-[6px] border-zinc-800 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[6px] border-amber-500 border-t-transparent animate-spin-slow" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">$84k</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Balance</span>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-zinc-400">Payouts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <span className="text-xs text-zinc-400">Reserve</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "GLOBAL DOMINATION",
      subtitle: "Meta-Game",
      description: "Clans are ranked by aggregate PnL. Top clans seize territory and earn platform fees.",
      icon: Crown,
      ui: (
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className={`flex items-center justify-between p-3 rounded-lg border ${rank === 1 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'
              }`}>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold ${rank === 1 ? 'text-yellow-500' : 'text-zinc-500'
                  }`}>0{rank}</span>
                <div className="h-2 w-16 bg-white/10 rounded-full" />
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {rank === 1 ? '9,999 XP' : '--- XP'}
              </span>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Column: List */}
        <div className="space-y-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
              New Order <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Mechanics</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              The old way is dead. Welcome to social financial warfare.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {features.map((feature, idx) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                onMouseEnter={() => setActiveTab(feature.id)}
                className={`group flex items-start gap-4 p-6 rounded-2xl text-left transition-all duration-300 border ${activeTab === idx
                    ? 'bg-white/5 border-emerald-500/30'
                    : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
              >
                <div className={`mt-1 p-2 rounded-lg transition-colors ${activeTab === idx ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 transition-colors uppercase tracking-tight ${activeTab === idx ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed transition-all duration-500 ${activeTab === idx
                      ? 'text-zinc-400 max-h-20 opacity-100 mt-2'
                      : 'text-zinc-600 max-h-0 opacity-0 overflow-hidden'
                    }`}>
                    {feature.description}
                  </p>
                </div>

                <ArrowRight className={`ml-auto self-center transition-all duration-300 ${activeTab === idx ? 'opacity-100 translate-x-0 text-emerald-500' : 'opacity-0 -translate-x-4'
                  }`} size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Visual Preview */}
        <div className="hidden lg:block relative h-[600px] bg-gradient-to-b from-zinc-900/50 to-black rounded-[40px] border border-white/5 p-2 overflow-hidden shadow-2xl shadow-black/50">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_50%)]" />

          <div className="relative h-full w-full bg-black/60 backdrop-blur-3xl rounded-[32px] border border-white/5 flex items-center justify-center overflow-hidden">
            {features.map((feature, idx) => (
              <div
                key={feature.id}
                className={`absolute inset-0 flex flex-col items-center justify-center p-12 transition-all duration-700 ${activeTab === idx
                    ? 'opacity-100 scale-100 translate-y-0 blur-0'
                    : 'opacity-0 scale-95 translate-y-8 blur-sm pointer-events-none'
                  }`}
              >
                {/* Glowing Orb Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />

                {/* Feature UI Component */}
                <div className="relative z-10 scale-125 transform transition-transform">
                  {feature.ui}
                </div>

                {/* Bottom Caption */}
                <div className="absolute bottom-12 text-center">
                  <span className="text-emerald-500 font-mono text-xs tracking-[0.2em] uppercase mb-2 block">
                    Module 0{idx + 1}
                  </span>
                  <h4 className="text-white text-2xl font-bold uppercase tracking-widest">
                    {feature.subtitle}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default BentoFeatures;