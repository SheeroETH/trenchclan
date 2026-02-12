import React, { useState, useEffect, useRef } from 'react';
import {
  Send, TrendingUp, TrendingDown, Activity,
  Wallet, ArrowUpRight, ArrowDownRight, Clock,
  MessageSquare, Zap, Shield, Swords, Trophy,
  Timer, Skull, Heart, BarChart3, Lock, Users, ArrowRight, Loader2, RefreshCw, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useClan } from '../hooks/useClan';
import { useProfile } from '../hooks/useProfile';
import { useClanStats } from '../hooks/useClanStats';
import { useTradeImport } from '../hooks/useTradeImport';
import { useHoldings } from '../hooks/useHoldings';
import { formatVolume, formatROI } from '../hooks/useLeaderboard';
import { useDuels } from '../hooks/useDuels';
import { supabase } from '../lib/supabase';

interface WarRoomPageProps {
  onOpenAuth: () => void;
}

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

interface Trade {
  id: string;
  user_id: string;
  token_symbol: string;
  token_name: string;
  trade_type: 'buy' | 'sell';
  amount_usd: number;
  token_amount: number;
  price_per_token: number;
  pnl_usd: number;
  created_at: string;
}

// Holdings are now fetched live via useHoldings hook

const WarRoomPage: React.FC<WarRoomPageProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { myClan, myMembership, loading: clanLoading } = useClan();
  const { profile } = useProfile();
  const { stats, loading: statsLoading } = useClanStats(myClan?.id);
  const { activeDuels, pendingDuels, outgoingDuels, acceptDuel, declineDuel, loading: duelsLoading } = useDuels();
  const { connected } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { importing, progress, lastResult, error: importError, importTrades } = useTradeImport();
  const { holdings, totalValueUsd, solBalance, solPrice, loading: holdingsLoading, refetch: refetchHoldings } = useHoldings();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'stats' | 'trades'>('chat');

  // Fetch existing messages on mount
  useEffect(() => {
    if (!myClan) return;

    const fetchMessages = async () => {
      setChatLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('clan_id', myClan.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
      setChatLoading(false);
    };

    fetchMessages();
  }, [myClan]);

  // Fetch recent trades for live feed
  useEffect(() => {
    if (!myClan) return;

    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*, profiles:user_id(username)')
        .eq('clan_id', myClan.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setRecentTrades(data);
      }
    };

    fetchTrades();

    // Subscribe to new trades
    const channel = supabase
      .channel(`trades:${myClan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `clan_id=eq.${myClan.id}`,
        },
        (payload) => {
          setRecentTrades((prev) => [payload.new as Trade, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myClan]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!myClan) return;

    const channel = supabase
      .channel(`messages:${myClan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `clan_id=eq.${myClan.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myClan]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !myClan) return;

    const content = inputText.trim();
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      clan_id: myClan.id,
      user_id: user.id,
      username: profile?.username || user.email?.split('@')[0] || 'Anon',
      avatar_url: null,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
      setInputText(content); // Restore on error
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ═══ GATE: Not logged in ═══
  if (!loading && !user) {
    return (
      <div className="pt-24 pb-8 h-screen bg-black text-white flex items-center justify-center animate-fade-in-up">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-zinc-600" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-3">
            Classified Zone
          </h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            The War Room is restricted to registered operatives. Sign in to access your clan's command center.
          </p>

          <Button
            variant="primary"
            withIcon
            className="h-14 px-8 text-lg w-full"
            onClick={onOpenAuth}
          >
            Sign In to Enter
          </Button>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Shield size={12} /> Encrypted</span>
            <span className="flex items-center gap-1"><Users size={12} /> Members Only</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══ GATE: No clan ═══
  if (!loading && !clanLoading && user && !myClan) {
    return (
      <div className="pt-24 pb-8 h-screen bg-black text-white flex items-center justify-center animate-fade-in-up">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 rounded-3xl bg-zinc-900/80 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="w-10 h-10 text-emerald-500/50" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-3">
            No Clan Detected
          </h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            You need to join or create a clan to access the War Room. Every soldier needs a squad.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              withIcon
              className="h-14 px-8 text-lg w-full"
              onClick={() => navigate('/create-clan')}
            >
              Create a Clan
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full"
              onClick={() => navigate('/create-clan')}
            >
              Browse Clans to Join
            </Button>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            Deploying a clan takes ~30 seconds and costs ~0.02 SOL
          </p>
        </div>
      </div>
    );
  }

  // ═══ MAIN WAR ROOM (Authenticated + Has Clan) ═══
  return (
    <div className="pt-24 pb-8 h-screen bg-black text-white px-4 md:px-8 flex flex-col animate-fade-in-up">

      {/* Page Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg border border-white/10">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{myClan?.name} War Room</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {myClan?.tag && <span className="font-mono">${myClan.tag}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex lg:hidden gap-1 mb-4 bg-zinc-900/60 p-1 rounded-xl border border-white/5">
        {[
          { key: 'chat' as const, label: 'Chat', icon: MessageSquare },
          { key: 'stats' as const, label: 'Stats', icon: Activity },
          { key: 'trades' as const, label: 'Trades', icon: Zap },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${mobileTab === tab.key
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-zinc-500 hover:text-white'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT: Clan Stats & Holdings */}
        <div className={`${mobileTab === 'stats' ? 'flex' : 'hidden'} lg:flex flex-col gap-6`}>

          {/* Section 1: Clan Vitals */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 px-1">
              <Activity size={14} /> Clan Vitals
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  <TrendingUp size={12} className="text-emerald-500" /> ROI
                </div>
                <div className={`text-lg font-bold font-mono ${stats.roi_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {statsLoading ? '...' : formatROI(stats.roi_pct)}
                </div>
                <div className="text-[10px] text-zinc-600">All-time</div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                  <BarChart3 size={12} className="text-cyan-500" /> Volume
                </div>
                <div className="text-lg font-bold text-cyan-400 font-mono">
                  {statsLoading ? '...' : formatVolume(stats.volume_24h)}
                </div>
                <div className="text-[10px] text-zinc-600">Last 24h</div>
              </div>
            </div>
          </div>

          {/* Section 2: Holdings (Real wallet data) */}
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Wallet size={14} /> Holdings
              </h2>
              {connected && (
                <button
                  onClick={refetchHoldings}
                  disabled={holdingsLoading}
                  className="text-[10px] text-zinc-600 hover:text-emerald-400 transition-colors disabled:opacity-50"
                  title="Refresh holdings"
                >
                  <RefreshCw size={12} className={holdingsLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex-1 overflow-y-auto">
              {/* Not connected state */}
              {!connected ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Wallet size={24} className="text-zinc-800 mb-3" />
                  <p className="text-zinc-600 text-xs mb-3">Connect your wallet to see holdings</p>
                  <button
                    onClick={() => openWalletModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Wallet size={12} /> Connect Wallet
                  </button>
                </div>
              ) : holdingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-emerald-500" />
                </div>
              ) : holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Wallet size={24} className="text-zinc-800 mb-3" />
                  <p className="text-zinc-600 text-xs">No tokens found in this wallet</p>
                  {solBalance > 0 && (
                    <p className="text-zinc-500 text-[10px] mt-2 font-mono">
                      {solBalance.toFixed(4)} SOL available
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* SOL balance card */}
                  {solBalance > 0 && (
                    <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                            ◎
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">SOL</div>
                            <div className="text-[10px] text-zinc-500">Solana</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] text-zinc-600 font-mono">
                          Qty: {solBalance < 1 ? solBalance.toFixed(4) : solBalance.toFixed(2)}
                        </div>
                        <div className="text-sm font-mono font-medium text-zinc-300">
                          {formatVolume(solBalance * solPrice)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Token holdings */}
                  {holdings.slice(0, 10).map((token) => (
                    <div key={token.mint} className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {token.imageUrl ? (
                            <img
                              src={token.imageUrl}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 rounded-full bg-black border border-zinc-800 flex items-center justify-center text-[10px] font-bold ${token.imageUrl ? 'hidden' : ''}`}>
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{token.symbol}</div>
                            <div className="text-[10px] text-zinc-500 max-w-[100px] truncate">{token.name}</div>
                          </div>
                        </div>
                        {token.valueUsd > 0 && (
                          <div className="text-xs font-bold text-zinc-400 font-mono">
                            {formatVolume(token.valueUsd)}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] text-zinc-600 font-mono">
                          Qty: {token.amount < 1 ? token.amount.toFixed(4) : token.amount < 1000 ? token.amount.toFixed(2) : token.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-zinc-700 font-mono">
                          {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {holdings.length > 10 && (
                    <div className="text-center text-[10px] text-zinc-600 py-2">
                      +{holdings.length - 10} more tokens
                    </div>
                  )}
                </div>
              )}

              {/* Total Value Card */}
              {connected && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Wallet Value</div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {holdingsLoading ? '...' : formatVolume(totalValueUsd)}
                  </div>
                  {solPrice > 0 && (
                    <div className="text-[10px] text-zinc-600 mt-1">SOL: ${solPrice.toFixed(2)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Real-time Chat Feed */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex lg:col-span-2 flex-col bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden`}>
          {/* Chat Header */}
          <div className="h-14 border-b border-white/5 flex items-center px-6 bg-zinc-900/50 backdrop-blur-md justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
              <MessageSquare size={16} className="text-emerald-500" />
              General Comms
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs text-zinc-600 bg-black/40 px-2 py-1 rounded border border-white/5">
                Live
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {chatLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-emerald-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare size={32} className="text-zinc-800 mb-4" />
                <p className="text-zinc-600 text-sm">No messages yet.</p>
                <p className="text-zinc-700 text-xs mt-1">Be the first to speak in the trenches!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className="flex gap-3 group animate-fade-in-up">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${isMe ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                      {msg.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-bold transition-colors cursor-pointer ${isMe ? 'text-emerald-400' : 'text-zinc-200 group-hover:text-emerald-400'}`}>
                          {msg.username}
                          {isMe && <span className="text-[10px] text-zinc-600 ml-1">(you)</span>}
                        </span>
                        <span className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-zinc-900/50 border-t border-white/5">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a message..."
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Duel & Live Trade Feed */}
        <div className={`${mobileTab === 'trades' ? 'flex' : 'hidden'} lg:flex flex-col gap-6`}>

          {/* Section 1: Active Duel Widget */}
          <div>
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Swords size={14} className={activeDuels.length > 0 ? "text-red-500" : "text-zinc-500"} />
                {activeDuels.length > 0 ? "Active Combat" : "Battle Station"}
              </h2>
              {activeDuels.length > 0 && (
                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold animate-pulse">Live Duel</span>
              )}
            </div>

            {/* CASE 1: Active Duel */}
            {activeDuels.length > 0 ? (() => {
              const active = activeDuels[0];
              const isChallenger = active.duel.challenger_clan_id === myClan?.id;

              // My stats vs Opponent stats
              const myStats = isChallenger ? active.challenger_stats : active.defender_stats;
              const oppStats = isChallenger ? active.defender_stats : active.challenger_stats;
              const oppName = isChallenger ? active.defender_name : active.challenger_name;
              const oppTag = isChallenger ? active.defender_tag : active.challenger_tag;
              const oppAvatar = isChallenger ? active.defender_avatar : active.challenger_avatar;

              // Timer logic would go here (simplification: static calculation for render)
              const timeLeft = new Date(active.duel.ended_at!).getTime() - Date.now();
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

              // Progress bar calc
              const totalRoi = Math.max(0, myStats.roi) + Math.max(0, oppStats.roi);
              // Handle negative ROI by shifting base? Or simplistically just show relative win
              // Let's us 50/50 if both 0, otherwise proportional
              // If ROIs can be negative, this viz is tricky. Simple approach: Winning/Losing text.

              return (
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-red-500/20 rounded-2xl p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                      <Timer size={12} /> {hoursLeft}h {minsLeft}m Left
                    </div>
                    <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Trophy size={12} /> Glory
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    {/* Us */}
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg font-black text-emerald-500 mx-auto mb-2 overflow-hidden">
                        {myClan?.avatar_url ? <img src={myClan.avatar_url} className="w-full h-full object-cover" /> : (myClan?.name[0]?.toUpperCase() || 'U')}
                      </div>
                      <div className="text-xs font-bold text-white max-w-[80px] truncate">{myClan?.tag || 'YOU'}</div>
                      <div className={`text-[10px] font-mono ${myStats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatROI(myStats.roi)}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-zinc-600 italic">VS</span>
                      <div className="h-px w-8 bg-zinc-800" />
                    </div>

                    {/* Them */}
                    <div className="text-center group-hover:grayscale-0 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-lg font-black text-red-500 mx-auto mb-2 overflow-hidden">
                        {oppAvatar ? <img src={oppAvatar} className="w-full h-full object-cover" /> : (oppName?.[0]?.toUpperCase() || 'E')}
                      </div>
                      <div className="text-xs font-bold text-white max-w-[80px] truncate">{oppTag || 'ENEMY'}</div>
                      <div className={`text-[10px] font-mono ${oppStats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatROI(oppStats.roi)}
                      </div>
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center text-xs font-bold mb-2">
                    {myStats.roi > oppStats.roi ? (
                      <span className="text-emerald-500">WINNING</span>
                    ) : myStats.roi < oppStats.roi ? (
                      <span className="text-red-500">LOSING</span>
                    ) : (
                      <span className="text-zinc-500">DRAW</span>
                    )}
                  </div>
                </div>
              );
            })() : pendingDuels.length > 0 ? (
              // CASE 2: Pending Challenge (INCOMING)
              <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <Swords className="text-amber-500" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Incoming Challenge!</h3>
                    <p className="text-xs text-zinc-500">{(pendingDuels[0] as any).challenger?.name || 'Enemy Clan'} wants to duel.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" className="flex-1 text-xs py-2 bg-amber-500 hover:bg-amber-600 text-black border-none" onClick={() => acceptDuel(pendingDuels[0].id)}>
                    Accept Duel
                  </Button>
                  <Button variant="outline" className="flex-1 text-xs py-2" onClick={() => declineDuel(pendingDuels[0].id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ) : outgoingDuels.length > 0 ? (
              // CASE 3: Pending Challenge (OUTGOING)
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="text-zinc-400" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Monitoring Channels</h3>
                    <p className="text-xs text-zinc-500">Awaiting response from {(outgoingDuels[0] as any).defender?.name || 'Target Clan'}...</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 w-1/3 animate-loading-bar" />
                </div>
              </div>
            ) : (
              // CASE 4: Idle
              <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 text-center">
                <Swords size={24} className="mx-auto text-zinc-700 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Active Operations</h3>
                <p className="text-xs text-zinc-500 mb-4">Command is waiting for orders.</p>
                <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/leaderboard')}>
                  Find Opponent to Duel
                </Button>
              </div>
            )}
          </div>

          {/* Section 2: Live Trades */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} /> Live Trades
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-mono">{stats.trade_count} total</span>
                {connected && (
                  <button
                    onClick={importTrades}
                    disabled={importing}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-50 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                    title="Import trades from your connected Solana wallet"
                  >
                    {importing ? (
                      <><Loader2 size={10} className="animate-spin" /> Syncing...</>
                    ) : (
                      <><RefreshCw size={10} /> Sync Wallet</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Import progress/result banner */}
            {(importing || progress) && (
              <div className={`mb-2 px-3 py-2 rounded-xl text-[11px] flex items-center gap-2 animate-fade-in-up ${importError ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                lastResult && lastResult.imported > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                  'bg-zinc-800/50 border border-white/5 text-zinc-400'
                }`}>
                {importing && <Loader2 size={12} className="animate-spin flex-shrink-0" />}
                {!importing && lastResult && lastResult.imported > 0 && <Download size={12} className="flex-shrink-0" />}
                <span>{importError || progress}</span>
              </div>
            )}

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex-1 overflow-y-auto relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-zinc-900/30 to-transparent z-10 pointer-events-none" />

              {recentTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity size={24} className="text-zinc-800 mb-3" />
                  <p className="text-zinc-600 text-xs">No trades yet.</p>
                  {connected ? (
                    <button
                      onClick={importTrades}
                      disabled={importing}
                      className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      {importing ? (
                        <><Loader2 size={12} className="animate-spin" /> Importing...</>
                      ) : (
                        <><Download size={12} /> Import from Wallet</>
                      )}
                    </button>
                  ) : (
                    <p className="text-zinc-700 text-[10px] mt-1">Connect your wallet to import trades.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="relative pl-4 py-2 border-l-2 border-zinc-800 hover:border-emerald-500 transition-colors">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[5px] top-3 w-2 h-2 rounded-full ${trade.trade_type === 'buy' ? 'bg-emerald-500' : 'bg-red-500'}`} />

                      <div className="flex justify-between items-start">
                        <div className="text-xs font-bold text-zinc-300">
                          {(trade as any).profiles?.username || 'Anon'}
                        </div>
                        <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <Clock size={10} /> {formatTimeAgo(trade.created_at)}
                        </div>
                      </div>

                      <div className="text-xs mt-1">
                        <span className={trade.trade_type === 'buy' ? 'text-emerald-500' : 'text-red-500'}>
                          {trade.trade_type === 'buy' ? 'BOUGHT' : 'SOLD'}
                        </span>
                        <span className="text-zinc-400 mx-1">
                          {formatVolume(trade.amount_usd)} of
                        </span>
                        <span className="text-white font-bold cursor-pointer hover:underline">
                          ${trade.token_symbol}
                        </span>
                        {trade.trade_type === 'sell' && trade.pnl_usd !== 0 && (
                          <span className={`ml-2 font-mono ${trade.pnl_usd > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({trade.pnl_usd > 0 ? '+' : ''}{formatVolume(trade.pnl_usd)} PnL)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WarRoomPage;