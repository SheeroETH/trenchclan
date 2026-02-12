# 🔍 Audit & Roadmap — TrenchAlliance

> **Last updated:** 2026-02-12
> **Status:** Active Development — MVP Phase

---

## État Actuel du Site

Le site est passé d'une **maquette interactive** à une **app fonctionnelle** avec backend Supabase, auth, chat temps réel, et données live. Voici l'état de chaque page :

| Page | Composant | État |
|---|---|---|
| Home | Hero, Ticker, LeaderboardPreview, BentoFeatures, FooterCTA | ✅ UI complète + données réelles (leaderboard preview) |
| Leaderboard | LeaderboardPage | ✅ **Données réelles** — ROI, Volume, Members via `get_leaderboard` RPC |
| Tournaments | TournamentsPage | ⚠️ UI complète (données **mock**) |
| War Room | WarRoomPage | ✅ **Chat temps réel** + **Live Trades réels** + **Clan Vitals réels** + **Holdings réels** (wallet live via Helius DAS) |
| Features | FeaturesPage | ✅ UI complète |
| Profile | ProfilePage | ✅ UI complète + **données réelles** (stats, PnL, trades depuis Supabase) + **Wallet Connect UI** |
| Create Clan | CreateClanPage | ✅ **Fonctionnel** — Création et join de clans via Supabase |

### Système de types
- `types/gamification.ts` : Ranks (Bronze → Mythic), Badges, système XP — **utilisé dans ProfilePage** (XP bar, rank badge, badges earned).

---

## ✅ Ce qui a été COMPLÉTÉ (depuis le dernier audit)

### 1. ~~Zéro Backend~~ → ✅ Supabase intégré
- **5 tables** en production : `profiles`, `clans`, `clan_members`, `messages`, `trades`
- **2 fonctions RPC** : `get_clan_stats(clan_id)`, `get_leaderboard()`
- **Row Level Security** (RLS) sur toutes les tables
- **Supabase Realtime** pour le chat + le feed de trades

### 2. ~~Pas d'Authentification~~ → ✅ Auth complète
- `AuthContext` avec `onAuthStateChange`
- `AuthModal` — Email/password sign up + sign in
- OAuth providers : Google, Discord
- Auto-création de profil via trigger SQL

### 3. ~~Pas de Routing réel~~ → ✅ React Router
- `react-router-dom` v7 avec `BrowserRouter`
- Routes propres : `/`, `/leaderboard`, `/war-room`, `/profile`, `/create-clan`, `/tournaments`, `/features`
- `useNavigate` partout (plus de prop drilling `onNavigate`)
- Back/Forward fonctionne

### 4. ~~Chat War Room est local~~ → ✅ Chat temps réel
- Messages stockés dans Supabase (`messages` table)
- Supabase Realtime subscription pour les nouveaux messages
- Scoped par clan avec RLS

### 5. ~~Create Clan ne fait rien~~ → ✅ Fonctionnel
- Création de clan → insert dans `clans` + `clan_members` (role: owner)
- Browse + Join → recherche parmi tous les clans publics
- Redirection automatique vers le War Room après join/create

### 6. ~~Gamification non intégrée~~ → ✅ Intégrée dans ProfilePage
- XP bar avec progression vers le prochain rank
- Badge display avec système de rareté (Common → Legendary)
- Rank badge affiché sur l'avatar

### 7. ~~Pas de SEO~~ → ✅ SEO implémenté
- Meta tags complets dans `index.html`
- OG tags pour le partage social
- Structured data

### 8. Données réelles (nouveau)
- **Leaderboard** : données réelles via `get_leaderboard()` RPC — ROI%, Volume, Members
- **Clan Vitals** (War Room) : ROI réel + Volume 24h réel via `get_clan_stats()` RPC
- **Live Trades** (War Room) : feed temps réel depuis la table `trades` avec Supabase Realtime
- **LeaderboardPreview** (Homepage) : Top 3 avec ROI + Volume réels

---

## ⚠️ Ce qui reste à faire

### Données encore en MOCK

| Élément | Fichier | Ce qui est mock |
|---|---|---|
| Holdings panel | ~~`WarRoomPage.tsx` → `HOLDINGS` array~~ | ✅ **Données réelles** via `useHoldings` hook (Helius DAS API) |
| Profile PnL | ~~`ProfilePage.tsx` → `MOCK_PNL`~~ | ✅ **Données réelles** via `useUserStats` hook |
| Profile Stats | ~~`ProfilePage.tsx` → `MOCK_STATS`~~ | ✅ **Données réelles** via `get_user_stats` RPC |
| Recent Operations | ~~`ProfilePage.tsx` → `MOCK_TRADES`~~ | ✅ **Données réelles** depuis la table `trades` |
| Tournaments | `TournamentsPage.tsx` | Tout le contenu (nécessite table `tournaments`) |
| Ticker | ~~`Ticker.tsx`~~ | ✅ **Données réelles** via `usePlatformStats` hook + `get_platform_stats` RPC |

### Fonctionnalités manquantes

| # | Feature | Impact |
|---|---|---|
| 1 | ~~**Trade Logging UI**~~ | ~~Pas de moyen pour les users de logger des trades~~ → ✅ Import auto via wallet |
| 2 | ~~**Wallet Connect**~~ | ✅ **Intégré** — Phantom dans `SolanaProvider` + `useWalletAuth` + UI dans ProfilePage |
| 3 | ~~**Holdings réels**~~ | ✅ **Intégré** — `useHoldings` hook + Helius DAS `getAssetsByOwner` + SOL balance |
| 4 | **Page 404** | Routes inconnues → page blanche |
| 5 | ~~**Clan avatar upload**~~ | ✅ **Fonctionnel** — Upload vers Supabase Storage (`clan-avatars` bucket) + fallback DiceBear |
| 6 | **Responsive War Room** | Layout mobile limité pour la sidebar |

---

## 🚀 Features à Ajouter (par priorité)

### Phase 1 : Compléter les données (Priorité immédiate)

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 1 | **Trade Logging UI** | Modal/form dans le War Room pour log manuellement buy/sell/token/montant | Medium |
| 2 | **Profile ↔ Trades** | Wirer les stats ProfilePage aux vrais trades du user | Medium |
| 3 | **User-level stats RPC** | Fonction SQL `get_user_stats(user_id)` pour stats perso | Small |
| 4 | **Page 404** | Composant NotFound + route wildcard | Small |

### Phase 2 : Wallet & On-chain

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 5 | **Wallet Connect** | `@solana/wallet-adapter` pour Phantom/Solflare | Large |
| 6 | **On-chain trades** | Auto-detect trades depuis le wallet connecté (Helius webhooks) | Large |
| 7 | **Holdings réels** | Remplacer le mock par les vrais tokens du wallet | Large |

### Phase 3 : Social & Compétitif

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 8 | ~~**Trench Duels**~~ | ✅ **Code Ready** — `useDuels` hook + `WarRoom` integration + `Leaderboard` challenge button. (⚠️ Needs `migration_duels.sql`) | Large |
| 9 | **Tournament brackets** | Système réel avec entries et prizes | Large |
| 10 | **Notifications** | Alertes trades, invites clans, défis | Medium |
| 11 | **@ Mentions chat** | Tagger des clan members dans le War Room | Small |

### Phase 4 : Scale & Polish

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 12 | **Admin dashboard** | Outils owner : kick, promote, settings | Medium |
| 13 | **Clan settings** | Edit name, description, avatar, rules | Medium |
| 14 | **Search & discovery** | Recherche globale users + clans | Small |
| 15 | **PWA support** | App installable + push notifications | Medium |
| 16 | **Analytics** | Graphs d'activité, heatmaps, engagement | Large |
| 17 | **Seasonal System** | Resets, archives, récompenses auto | Large |
| 18 | **Referral System** | Invite links trackés, bonus XP | Medium |

---

## 📋 Checklist de Launch

### Phase 1 : Fondations Techniques ✅ DONE
- [x] Ajouter `react-router-dom` pour le routing
- [x] Créer un backend Supabase avec tables : `clans`, `profiles`, `clan_members`, `messages`, `trades`
- [x] Connecter le form "Create Clan" au backend
- [x] Implémenter l'authentification (email + OAuth)
- [x] Chat temps réel dans le War Room via Supabase Realtime
- [x] Leaderboard dynamique basé sur les PnL réels
- [x] Page profil utilisateur avec Ranks et Badges
- [x] SEO : meta tags, OG images

### Phase 2 : Features Core 🔄 EN COURS
- [x] Leaderboard avec données réelles (ROI, Volume, Members)
- [x] Clan Vitals réels dans le War Room
- [x] Live Trades feed temps réel
- [x] Trade Logging UI (modal pour logger des trades)
- [x] Profil avec stats réelles (wiré à la table trades via `useUserStats`)
- [x] Intégrer `@solana/wallet-adapter` (connexion Phantom)
- [x] Trade tracking : lier le wallet et afficher les vrais trades
- [ ] Trench Duel — logique de matchmaking et scoring

### Phase 3 : Polish & Launch
- [ ] Audit responsive complet (mobile/tablet)
- [ ] Page 404
- [ ] Favicon + branding assets finaux
- [ ] Termes de service / disclaimers crypto
- [ ] Déployer sur Vercel
- [ ] Tester avec un groupe beta

### Phase 4 : Post-Launch
- [ ] Analytics (Mixpanel / PostHog)
- [ ] Système de referral
- [ ] Seasonal reset + archives
- [ ] Treasury on-chain + revenue sharing
- [ ] PWA / Mobile

---

## 🗃️ Base de Données

### Tables

| Table | Status | RLS | Realtime |
|-------|--------|-----|----------|
| `profiles` | ✅ Live | ✅ | — |
| `clans` | ✅ Live | ✅ | — |
| `clan_members` | ✅ Live | ✅ | — |
| `messages` | ✅ Live | ✅ | ✅ Subscribed |
| `trades` | ✅ Live | ✅ | ✅ Subscribed |
| `tournaments` | ❌ Not created | — | — |
| `duels` | ⚠️ À déployer (`migration_duels.sql`) | — | — |

### Storage Buckets

| Bucket | Status | Public | Policies |
|--------|--------|--------|----------|
| `clan-avatars` | ⚠️ À déployer (`migration_storage_avatars.sql`) | ✅ Public | Auth upload/update/delete dans `{user_id}/` |

### RPC Functions

| Function | Status | Used By |
|----------|--------|---------|
| `get_clan_stats(clan_id)` | ✅ Live | `useClanStats` hook |
| `get_leaderboard()` | ✅ Live | `useLeaderboard` hook |
| `get_user_stats(user_id)` | ✅ Live | `useUserStats` hook (ProfilePage) |
| `get_platform_stats()` | ⚠️ À déployer | `usePlatformStats` hook (Ticker) |

---

## 🧭 Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | react-router-dom v7 |
| Auth | Supabase Auth (Email + Google + Discord) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Styling | Vanilla CSS (design system dans index.css) |
| Icons | Lucide React |
| Fonts | Inter (Google Fonts) |
| Hosting | (à déployer — Vercel recommandé) |

---

> **En résumé** : Le projet est passé de **maquette interactive** à **MVP fonctionnel**. Auth, clans, chat temps réel, leaderboard avec données réelles, holdings live, ticker live, avatar upload, et routing propre sont en place. Il ne reste plus que les **Tournaments** en mock (nécessite la table SQL). Les prochaines étapes critiques sont : **Lancer les migrations SQL → Responsive audit → Trench Duels → Deploy Vercel**.
