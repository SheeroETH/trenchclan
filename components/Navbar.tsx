import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, LogOut, User, ChevronDown, Wallet, Link, Unlink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../contexts/AuthContext';
import { useWalletAuth } from '../hooks/useWalletAuth';

interface NavbarProps {
  onOpenAuth: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { walletAddress, isLinked, linking, linkWallet, unlinkWallet } = useWalletAuth();

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClick = () => setProfileOpen(false);
    if (profileOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [profileOpen]);

  const navItems = [
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/tournaments', label: 'Tournaments' },
    { path: '/war-room', label: 'War Room' },
    { path: '/features', label: 'Features' },
  ];

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  const displayName = user?.user_metadata?.username
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Soldier';

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <>
      <nav
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-500 ease-out ${scrolled
          ? 'py-2'
          : 'py-3'
          }`}
      >
        {/* Liquid Glass Background Layer */}
        <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" />

        <div className="relative px-6 flex items-center justify-between h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleNavigate('/')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/50 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/logo.png" alt="Logo" className="relative z-10 w-12 h-12 object-contain transition-all duration-500" />
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-emerald-100 transition-colors">
              TrenchAlliance
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 group overflow-hidden ${location.pathname === item.path
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                {/* Active/Hover Background Shine */}
                <div className={`absolute inset-0 bg-gradient-to-t from-white/10 to-transparent transition-opacity duration-300 ${location.pathname === item.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} />

                {/* Bottom Glow Line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-300 ${location.pathname === item.path ? 'w-1/2 opacity-100' : 'w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-50'
                  }`} />

                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Area */}
          <div className="flex items-center gap-4">

            {loading ? (
              /* Loading skeleton */
              <div className="w-24 h-9 rounded-full bg-zinc-800 animate-pulse" />
            ) : user ? (
              /* Logged in — Wallet + Profile */
              <div className="flex items-center gap-2">
                {/* Wallet Button */}
                {connected && walletAddress ? (
                  <button
                    onClick={() => {
                      if (!isLinked) linkWallet();
                    }}
                    className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${isLinked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 cursor-pointer'
                      }`}
                    title={isLinked ? walletAddress : 'Click to link this wallet to your account'}
                  >
                    <Wallet size={12} />
                    {linking ? '...' : shortAddress}
                    {isLinked && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ) : (
                  <button
                    onClick={() => setWalletModalVisible(true)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
                  >
                    <Wallet size={12} />
                    Connect
                  </button>
                )}

                {/* Profile Pill */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileOpen(!profileOpen);
                    }}
                    className="relative flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl rounded-full pl-1.5 pr-3 py-1.5 border border-white/10 hover:border-emerald-500/30 transition-all group"
                  >
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-black">
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-zinc-300 group-hover:text-white transition-colors max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-2 animate-fade-in-up z-[60]">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <div className="text-sm font-medium text-white truncate">{displayName}</div>
                        <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigate('/profile');
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <User size={16} />
                        My Profile
                      </button>
                      <button
                        onClick={async () => {
                          await signOut();
                          if (connected) await disconnect();
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>

                      {/* Wallet section in dropdown */}
                      <div className="border-t border-white/5 mt-1 pt-1">
                        {connected && walletAddress ? (
                          <>
                            <div className="px-3 py-2 flex items-center gap-2">
                              <Wallet size={14} className="text-emerald-400" />
                              <span className="text-xs font-mono text-zinc-400">{shortAddress}</span>
                              {isLinked && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Linked</span>}
                            </div>
                            {!isLinked && (
                              <button
                                onClick={() => { linkWallet(); }}
                                disabled={linking}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/5 rounded-xl transition-colors"
                              >
                                <Link size={14} />
                                {linking ? 'Linking...' : 'Link Wallet'}
                              </button>
                            )}
                            {isLinked && (
                              <button
                                onClick={() => { unlinkWallet(); disconnect(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded-xl transition-colors"
                              >
                                <Unlink size={14} />
                                Unlink Wallet
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => { setWalletModalVisible(true); setProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/5 rounded-xl transition-colors"
                          >
                            <Wallet size={16} />
                            Connect Wallet
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Not logged in */
              <>
                <button
                  onClick={onOpenAuth}
                  className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                >
                  Login
                </button>

                <button onClick={onOpenAuth} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500" />
                  <div className="relative flex items-center bg-black/80 backdrop-blur-xl rounded-full px-6 py-2.5 border border-white/10 hover:border-white/20 transition-colors">
                    <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-cyan-200 group-hover:from-white group-hover:to-white transition-all duration-300">
                      GET STARTED
                    </span>
                  </div>
                </button>
              </>
            )}

            {/* Mobile Toggle */}
            <button
              className="md:hidden text-zinc-400 hover:text-white pl-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl transition-all duration-300 md:hidden flex items-center justify-center ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}>
        <div className="flex flex-col items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                handleNavigate(item.path);
                setMobileOpen(false);
              }}
              className={`text-2xl font-medium tracking-tight ${location.pathname === item.path ? 'text-white' : 'text-zinc-500'
                }`}
            >
              {item.label}
            </button>
          ))}
          <div className="w-12 h-[1px] bg-zinc-800 my-2" />
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                setMobileOpen(false);
              }}
              className="text-lg text-red-400"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileOpen(false);
              }}
              className="text-lg text-emerald-400"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;