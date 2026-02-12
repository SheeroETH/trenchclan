import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-brand-accent mb-8 animate-fade-in-up">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
        </span>
        Season 1 is Live. Prize Pool: $1,000
      </div>

      <h1 className="relative z-10 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-6 leading-[1.1]">
        Trade with a Clan.<br />
        <span className="text-white">Win as a legend.</span>
      </h1>

      <p className="relative z-10 text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 font-light leading-relaxed">
        The first competitive social trading arena for memecoins. Join a clan, dominate the trenches, and share the spoils of war.
      </p>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <Button
          variant="primary"
          withIcon
          className="w-full sm:w-auto h-12 text-base"
          onClick={() => navigate('/create-clan')}
        >
          Start a Clan
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto h-12 text-base"
          onClick={() => navigate('/leaderboard')}
        >
          View Leaderboard
        </Button>
      </div>
    </section>
  );
};

export default Hero;