import React, { useState, useEffect, useRef } from 'react';
import { Upload, Shield, Coins, Users, Lock, AlertCircle, CheckCircle2, Loader2, Search, ArrowRight, Swords, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useClan, MAX_CLAN_MEMBERS } from '../hooks/useClan';
import { supabase } from '../lib/supabase';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface CreateClanPageProps {
  onOpenAuth: () => void;
}

interface ClanForm {
  name: string;
  tag: string;
  description: string;
  entryFee: string;
  isPrivate: boolean;
}

type Tab = 'browse' | 'create';

const CreateClanPage: React.FC<CreateClanPageProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const TREASURY_WALLET = "Cm9CXcgjhabyWhNu35vXbKYGFv8dSNd2KjPZrag67XAr";
  const CLAN_COST_SOL = 0.1;

  const { createClan, joinClan, myClan, allClans, loading: clanLoading, browsing, fetchAllClans, error: clanError } = useClan();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [form, setForm] = useState<ClanForm>({
    name: '',
    tag: '',
    description: '',
    entryFee: '0.1',
    isPrivate: false,
  });

  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setDeployError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setDeployError('Image must be under 2MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setDeployError(null);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fetch clans on mount
  useEffect(() => {
    fetchAllClans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleJoin = async (clanId: string) => {
    setJoiningId(clanId);
    const ok = await joinClan(clanId);
    setJoiningId(null);
    if (ok) {
      setJoinSuccess(true);
      setTimeout(() => navigate('/war-room'), 1500);
    }
  };

  const filteredClans = allClans.filter((clan) => {
    const q = searchQuery.toLowerCase();
    return (
      clan.name.toLowerCase().includes(q) ||
      clan.tag.toLowerCase().includes(q) ||
      clan.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 max-w-3xl">
        <div className="flex items-center gap-2 text-brand-accent mb-2">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wider uppercase">Clans</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Find Your Alliance
        </h1>
        <p className="text-zinc-400 text-lg">
          Browse existing clans to join forces, or create your own to command the trenches.
        </p>
      </div>

      {/* Already in a clan */}
      {myClan && (
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-3 flex-1">
            <Shield size={20} className="text-emerald-400" />
            <div>
              <span className="text-emerald-300 font-bold">You're in clan </span>
              <span className="text-white font-black">{myClan.name}</span>
              <span className="text-emerald-500 font-mono text-sm ml-2">${myClan.tag}</span>
            </div>
          </div>
          <Button variant="primary" className="flex-shrink-0" onClick={() => navigate('/war-room')}>
            Enter War Room <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      {/* Tab Switcher */}
      {!myClan && (
        <div className="flex gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1 mb-10 max-w-md">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'browse'
              ? 'bg-white/10 text-white shadow-lg'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <Search size={16} /> Browse Clans
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'create'
              ? 'bg-white/10 text-white shadow-lg'
              : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <Swords size={16} /> Create Clan
          </button>
        </div>
      )}

      {/* ═══ BROWSE TAB ═══ */}
      {activeTab === 'browse' && !myClan && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clans by name, tag, or description..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-700"
            />
          </div>

          {/* Join success */}
          {joinSuccess && (
            <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 animate-fade-in-up">
              <CheckCircle2 size={18} /> Welcome aboard! Redirecting to War Room...
            </div>
          )}

          {/* Error */}
          {clanError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              <AlertCircle size={16} className="flex-shrink-0" />
              {clanError}
            </div>
          )}

          {/* Clan Grid */}
          {browsing ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
            </div>
          ) : filteredClans.length === 0 ? (
            <div className="text-center py-20">
              <Shield size={40} className="mx-auto mb-4 text-zinc-700" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">
                {searchQuery ? 'No clans match your search' : 'No clans yet'}
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                {searchQuery ? 'Try a different search term' : 'Be the first to create one!'}
              </p>
              {!searchQuery && (
                <Button variant="primary" onClick={() => setActiveTab('create')}>
                  Create the First Clan
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClans.map((clan) => (
                <div
                  key={clan.id}
                  className="group bg-zinc-900/40 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center text-2xl font-black text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                      {clan.avatar_url ? (
                        <img src={clan.avatar_url} alt={clan.name} className="w-full h-full object-cover" />
                      ) : (
                        clan.name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {clan.name}
                      </h3>
                      <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ${clan.tag}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {clan.description && (
                    <p className="text-sm text-zinc-500 mb-4 line-clamp-2 flex-1">
                      {clan.description}
                    </p>
                  )}
                  {!clan.description && <div className="flex-1" />}

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-5">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {clan.member_count}/{MAX_CLAN_MEMBERS}
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins size={12} /> {clan.entry_fee} SOL
                    </span>
                  </div>

                  {/* Join Button */}
                  {!user ? (
                    <button
                      onClick={onOpenAuth}
                      className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Sign In to Join
                    </button>
                  ) : clan.member_count >= MAX_CLAN_MEMBERS ? (
                    <div className="w-full py-2.5 bg-zinc-800/50 border border-white/5 rounded-xl text-sm font-bold text-zinc-600 text-center">
                      Full
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(clan.id)}
                      disabled={joiningId === clan.id}
                      className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {joiningId === clan.id ? (
                        <><Loader2 size={14} className="animate-spin" /> Joining...</>
                      ) : (
                        <>Join Clan <ArrowRight size={14} /></>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATE TAB ═══ */}
      {activeTab === 'create' && !myClan && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: The Form */}
          <div className="lg:col-span-7 space-y-8">

            {/* Section 1: Identity */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/50" />
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs text-zinc-400 border border-zinc-700">1</span>
                Clan Identity
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Clan Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Based Ghouls"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Ticker Tag</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input
                        type="text"
                        name="tag"
                        maxLength={6}
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })}
                        placeholder="GHOUL"
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-zinc-700 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Manifesto</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="What is your clan's mission? What tokens do you hunt?"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-zinc-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Emblem</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  {avatarPreview ? (
                    <div className="relative border-2 border-brand-accent/30 rounded-xl p-4 flex items-center gap-4 bg-brand-accent/5">
                      <img
                        src={avatarPreview}
                        alt="Clan emblem preview"
                        className="w-20 h-20 rounded-xl object-cover border border-white/10"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium truncate">{avatarFile?.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{avatarFile ? `${(avatarFile.size / 1024).toFixed(0)}KB` : ''}</p>
                      </div>
                      <button
                        onClick={removeAvatar}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all border border-white/5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all cursor-pointer group"
                    >
                      <Upload className="w-8 h-8 mb-3 text-zinc-600 group-hover:text-brand-accent transition-colors" />
                      <span className="text-sm">Click to upload emblem</span>
                      <span className="text-xs text-zinc-600 mt-1">Max 2MB — JPG/PNG 400×400px</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Gatekeeping */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700" />
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs text-zinc-400 border border-zinc-700">2</span>
                Gatekeeping
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    Entry Fee (SOL)
                    <div className="group relative">
                      <AlertCircle className="w-3 h-3 text-zinc-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-white/10 text-xs text-zinc-300 rounded hidden group-hover:block">
                        Amount transferred to clan treasury upon joining.
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number"
                      name="entryFee"
                      value={form.entryFee}
                      onChange={handleChange}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Squad Size</label>
                  <div className="relative flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-white font-bold">{MAX_CLAN_MEMBERS} Soldiers</span>
                    <span className="text-xs text-zinc-600 ml-auto">MAX — Elite squads only</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-zinc-900/50 rounded-lg border border-white/5 cursor-pointer" onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${form.isPrivate ? 'bg-brand-accent' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isPrivate ? 'left-5' : 'left-1'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Private Clan <Lock className="w-3 h-3 text-zinc-500" />
                  </div>
                  <div className="text-xs text-zinc-500">Requires invite code to join</div>
                </div>
              </div>
            </div>

            {/* Error */}
            {deployError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-4">
                <AlertCircle size={16} className="flex-shrink-0" />
                {deployError}
              </div>
            )}

            {/* Success */}
            {deploySuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 mb-4">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                Clan deployed! Redirecting to War Room...
              </div>
            )}

            <div className="pt-4">
              {!user ? (
                <Button variant="primary" withIcon className="w-full md:w-auto text-lg h-14 px-8" onClick={onOpenAuth}>
                  Sign In to Deploy
                </Button>
              ) : (
                <Button
                  variant="primary"
                  withIcon
                  className="w-full md:w-auto text-lg h-14 px-8"
                  disabled={deploying || !form.name || !form.tag}
                  onClick={async () => {
                    setDeploying(true);
                    setDeployError(null);
                    try {
                      if (!publicKey) {
                        throw new Error('Please connect your Solana wallet (top right) to pay the fee.');
                      }

                      // 1. Payment Transaction
                      const transaction = new Transaction().add(
                        SystemProgram.transfer({
                          fromPubkey: publicKey,
                          toPubkey: new PublicKey(TREASURY_WALLET),
                          lamports: CLAN_COST_SOL * LAMPORTS_PER_SOL
                        })
                      );

                      const signature = await sendTransaction(transaction, connection);

                      // Wait for confirmation
                      const latestBlockhash = await connection.getLatestBlockhash();
                      await connection.confirmTransaction({
                        signature,
                        blockhash: latestBlockhash.blockhash,
                        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                      });

                      // 2. Upload avatar if provided
                      let avatarUrl = '';
                      if (avatarFile && user) {
                        const ext = avatarFile.name.split('.').pop() || 'png';
                        const filePath = `${user.id}/${Date.now()}.${ext}`;
                        const { error: uploadError } = await supabase.storage
                          .from('clan-avatars')
                          .upload(filePath, avatarFile, { upsert: true });
                        if (uploadError) throw uploadError;
                        const { data: urlData } = supabase.storage
                          .from('clan-avatars')
                          .getPublicUrl(filePath);
                        avatarUrl = urlData.publicUrl;
                      }

                      // 3. Create Clan in DB
                      const clan = await createClan({
                        name: form.name,
                        tag: form.tag,
                        description: form.description,
                        entry_fee: parseFloat(form.entryFee) || 0.1,
                        max_members: MAX_CLAN_MEMBERS,
                        is_private: form.isPrivate,
                        avatar_url: avatarUrl,
                      });

                      if (clan) {
                        setDeploySuccess(true);
                        setTimeout(() => navigate('/war-room'), 2000);
                      }
                    } catch (err: any) {
                      console.error("Deploy error:", err);
                      setDeployError(err.message || 'Failed to deploy clan');
                    } finally {
                      setDeploying(false);
                    }
                  }}
                >
                  {deploying ? (
                    <><Loader2 size={18} className="animate-spin mr-2" /> Processing Tx...</>
                  ) : (
                    `Pay ${CLAN_COST_SOL} SOL & Deploy`
                  )}
                </Button>
              )}
              <p className="text-xs text-zinc-600 mt-4 text-center md:text-left">
                *Creates a multisig treasury and deploys a DAO governance token. Est. cost: 0.02 SOL.
              </p>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 space-y-6">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest text-center">Live Preview</h3>

              {/* The Card */}
              <div className="relative w-full max-w-sm mx-auto h-[480px] rounded-3xl border border-brand-accent/50 bg-gradient-to-b from-brand-accent/10 to-zinc-900/80 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] flex flex-col items-center text-center p-8 overflow-hidden transition-all duration-500">
                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent" />

                <div className="mt-4 mb-6 relative group cursor-pointer">
                  <div className="w-32 h-32 rounded-full border-4 border-brand-accent/80 bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-zinc-700 select-none">
                        {form.name ? form.name[0].toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black text-brand-accent text-xs font-bold px-3 py-1 rounded-full border border-brand-accent/30 shadow-lg">
                    FOUNDER
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1 truncate w-full">
                  {form.name || "Clan Name"}
                </h2>
                <div className="text-xs font-mono text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20 mb-6">
                  ${form.tag || "TICKER"}
                </div>

                <div className="w-full space-y-4 mb-auto">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-zinc-400">Entry Fee</span>
                    <span className="font-mono text-white">{form.entryFee} SOL</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-zinc-400">Squad Size</span>
                    <span className="font-mono text-white">{MAX_CLAN_MEMBERS} Soldiers</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-zinc-400">Visibility</span>
                    <span className="font-mono text-white flex items-center gap-1">
                      {form.isPrivate ? <Lock className="w-3 h-3" /> : null}
                      {form.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-6">
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-2">
                    <CheckCircle2 className="w-3 h-3 text-brand-accent" /> Verified Contract
                  </div>
                </div>
              </div>

              {/* Helper Text */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-xs text-zinc-400 leading-relaxed">
                <span className="text-white font-semibold">Tip:</span> Creative names and clear manifestos attract higher quality traders. Your clan tag will be used for your governance token symbol.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateClanPage;