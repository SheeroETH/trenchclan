import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Radar, Home } from 'lucide-react';
import Button from './ui/Button';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-black to-black" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />

            {/* Glitch Circle */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-32 h-32 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />
                </div>

                {/* Radar Sweep Effect */}
                <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
                    <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(transparent_0deg,transparent_270deg,rgba(239,68,68,0.4)_360deg)] animate-spin-slow rounded-full" />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-md mx-auto">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter mb-2">
                    404
                </h1>
                <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                    <Radar className="w-4 h-4" /> Signal Lost
                </h2>

                <p className="text-zinc-500 mb-8 leading-relaxed">
                    The coordinates you entered do not correspond to any known sector in the alliance network. Return to base immediately.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                        className="w-full justify-center group"
                    >
                        <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Return to Base
                    </Button>

                    <button
                        onClick={() => window.history.back()}
                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider font-bold mt-4"
                    >
                        Go Back
                    </button>
                </div>
            </div>

            {/* Footer Decoration */}
            <div className="absolute bottom-8 text-[10px] font-mono text-zinc-800 uppercase tracking-[0.2em]">
                System Error // Sector_Null
            </div>
        </div>
    );
};

export default NotFoundPage;
