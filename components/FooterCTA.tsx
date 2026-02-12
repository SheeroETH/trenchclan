import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

const FooterCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="relative p-12 rounded-[2rem] border border-white/10 bg-zinc-900/30 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Don't trench alone.
          </h2>
          <p className="text-zinc-400 max-w-lg mb-8 text-lg">
            The battlefield is brutal for the solo trader. Join 10,000+ others dominating the memecoin market together.
          </p>
          <Button
            variant="primary"
            withIcon
            className="h-14 px-8 text-lg"
            onClick={() => navigate('/create-clan')}
          >
            Join the Alliance
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;