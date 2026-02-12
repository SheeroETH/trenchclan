-- ═══════════════════════════════════════════
-- TrenchAlliance — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. CLANS TABLE
create table if not exists public.clans (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  tag text not null unique,
  description text default '',
  avatar_url text default '',
  entry_fee numeric default 0.1,
  max_members integer default 6,
  is_private boolean default false,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 2. CLAN MEMBERS TABLE
-- ★ left_at: soft-delete. NULL = active member, set = left the clan.
--   We keep the record so trades made during membership still count for PnL.
create table if not exists public.clan_members (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid references public.clans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'commander', 'vanguard', 'member')),
  joined_at timestamptz default now(),
  left_at timestamptz default null
);

-- Partial unique index: a user can only have ONE active membership per clan
-- (but can have historical records with left_at set)
-- alter table public.clan_members drop constraint if exists clan_members_clan_id_user_id_key;
create unique index if not exists idx_clan_members_active_unique
  on public.clan_members(clan_id, user_id) where left_at is null;

-- A user can only be in ONE clan at a time
create unique index if not exists idx_clan_members_one_active_clan
  on public.clan_members(user_id) where left_at is null;

-- 3. PROFILES TABLE (extended user info)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  avatar_url text,
  wallet_address text unique,
  xp integer default 0,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- ENFORCE MAX 6 MEMBERS PER CLAN (trigger)
-- ★ Only counts ACTIVE members (left_at IS NULL)
-- ═══════════════════════════════════════════
create or replace function public.enforce_max_clan_members()
returns trigger as $$
declare
  current_count integer;
  max_allowed integer;
begin
  -- Get the max_members for this clan
  select max_members into max_allowed
  from public.clans
  where id = new.clan_id;

  -- Count only ACTIVE members (left_at IS NULL)
  select count(*) into current_count
  from public.clan_members
  where clan_id = new.clan_id
    and left_at is null;

  -- Hard cap at 6 regardless of what max_members says
  if max_allowed is null or max_allowed > 6 then
    max_allowed := 6;
  end if;

  if current_count >= max_allowed then
    raise exception 'Clan is full. Maximum % members allowed.', max_allowed;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger (drop first to avoid duplication)
drop trigger if exists check_clan_capacity on public.clan_members;
create trigger check_clan_capacity
  before insert on public.clan_members
  for each row execute procedure public.enforce_max_clan_members();

-- ═══ ROW LEVEL SECURITY ═══

-- Enable RLS
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.profiles enable row level security;

-- CLANS: anyone can read, only authenticated can create
create policy "Anyone can view clans" on public.clans
  for select using (true);

create policy "Authenticated users can create clans" on public.clans
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update their clan" on public.clans
  for update using (auth.uid() = owner_id);

-- CLAN MEMBERS: anyone can read, authenticated can join, users can update (for soft-delete)
create policy "Anyone can view clan members" on public.clan_members
  for select using (true);

create policy "Authenticated users can join clans" on public.clan_members
  for insert with check (auth.uid() = user_id);

create policy "Users can update own membership" on public.clan_members
  for update using (auth.uid() = user_id);

create policy "Users can leave clans" on public.clan_members
  for delete using (auth.uid() = user_id);

-- PROFILES: users can read all, update own
create policy "Anyone can view profiles" on public.profiles
  for select using (true);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ═══ AUTO-CREATE PROFILE ON SIGNUP ═══
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════
-- 4. MESSAGES TABLE (War Room Chat)
-- ═══════════════════════════════════════════
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid references public.clans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  avatar_url text,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Anyone in the clan can read messages (only active members)
create policy "Clan members can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.clan_members
      where clan_members.clan_id = messages.clan_id
      and clan_members.user_id = auth.uid()
      and clan_members.left_at is null
    )
  );

-- Authenticated users can send messages to their clan (only active members)
create policy "Clan members can send messages" on public.messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.clan_members
      where clan_members.clan_id = messages.clan_id
      and clan_members.user_id = auth.uid()
      and clan_members.left_at is null
    )
  );

-- Enable Realtime for messages
alter publication supabase_realtime add table public.messages;

-- ═══════════════════════════════════════════
-- 5. TRADES TABLE (Track ROI & Volume)
-- ═══════════════════════════════════════════
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid references public.clans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  token_symbol text not null,
  token_name text default '',
  token_mint text default '',
  trade_type text not null check (trade_type in ('buy', 'sell')),
  amount_usd numeric not null default 0,
  token_amount numeric not null default 0,
  price_per_token numeric not null default 0,
  pnl_usd numeric default 0,
  signature text unique,
  created_at timestamptz default now()
);

-- Indexes for fast aggregation
create index if not exists idx_trades_clan_id on public.trades(clan_id);
create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_created_at on public.trades(created_at);

-- Enable RLS
alter table public.trades enable row level security;

-- Anyone can read trades (leaderboard is public)
create policy "Anyone can view trades" on public.trades
  for select using (true);

-- Clan members can insert trades for their clan
create policy "Clan members can log trades" on public.trades
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.clan_members
      where clan_members.clan_id = trades.clan_id
      and clan_members.user_id = auth.uid()
      and clan_members.left_at is null
    )
  );

-- ═══════════════════════════════════════════
-- 6. FUNCTION: get_clan_stats (single clan)
--
-- ★ PnL = trades made by members DURING their membership period
--   - trade.created_at >= member.joined_at  (no pre-join trades)
--   - trade.created_at <= member.left_at    (no post-leave trades)
--   - If member is still active (left_at NULL), all trades since join count
-- ═══════════════════════════════════════════
create or replace function public.get_clan_stats(p_clan_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_volume', coalesce(sum(t.amount_usd), 0),
    'volume_24h', coalesce(sum(case when t.created_at > now() - interval '24 hours' then t.amount_usd else 0 end), 0),
    'total_pnl', coalesce(sum(t.pnl_usd), 0),
    'total_cost_basis', coalesce(sum(case when t.trade_type = 'buy' then t.amount_usd else 0 end), 0),
    'total_sells', coalesce(sum(case when t.trade_type = 'sell' then t.amount_usd else 0 end), 0),
    'trade_count', count(*)::int,
    'roi_pct', case
      when coalesce(sum(case when t.trade_type = 'buy' then t.amount_usd else 0 end), 0) > 0
      then round((coalesce(sum(t.pnl_usd), 0) / sum(case when t.trade_type = 'buy' then t.amount_usd else 0 end)) * 100, 2)
      else 0
    end,
    'member_count', (select count(*)::int from public.clan_members where clan_id = p_clan_id and left_at is null)
  ) into result
  from public.trades t
  -- ★ Join through ALL membership records (active + historical)
  inner join public.clan_members cm
    on cm.clan_id = p_clan_id
    and cm.user_id = t.user_id
    -- ★ Only trades made DURING the membership period
    and t.created_at >= cm.joined_at
    and (cm.left_at is null or t.created_at <= cm.left_at);

  return result;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- 7. FUNCTION: get_leaderboard
--
-- ★ PnL = trades during membership periods (same logic as get_clan_stats)
-- ═══════════════════════════════════════════
create or replace function public.get_leaderboard()
returns json as $$
declare
  result json;
begin
  select json_agg(row_data order by roi_pct desc) into result
  from (
    select
      c.id,
      c.name,
      c.tag,
      c.avatar_url,
      c.max_members,
      c.created_at,
      coalesce(mc.member_count, 0)::int as member_count,
      coalesce(t.total_volume, 0) as total_volume,
      coalesce(t.volume_24h, 0) as volume_24h,
      coalesce(t.total_pnl, 0) as total_pnl,
      coalesce(t.trade_count, 0)::int as trade_count,
      case
        when coalesce(t.total_buys, 0) > 0
        then round((coalesce(t.total_pnl, 0) / t.total_buys) * 100, 2)
        else 0
      end as roi_pct
    from public.clans c
    -- Active member count only
    left join (
      select clan_id, count(*)::int as member_count
      from public.clan_members
      where left_at is null
      group by clan_id
    ) mc on mc.clan_id = c.id
    -- ★ Aggregate trades scoped to each member's active period
    left join (
      select
        cm2.clan_id,
        sum(tr.amount_usd) as total_volume,
        sum(case when tr.created_at > now() - interval '24 hours' then tr.amount_usd else 0 end) as volume_24h,
        sum(tr.pnl_usd) as total_pnl,
        sum(case when tr.trade_type = 'buy' then tr.amount_usd else 0 end) as total_buys,
        count(*) as trade_count
      from public.trades tr
      inner join public.clan_members cm2
        on cm2.user_id = tr.user_id
        -- ★ Only trades made DURING the membership period
        and tr.created_at >= cm2.joined_at
        and (cm2.left_at is null or tr.created_at <= cm2.left_at)
      group by cm2.clan_id
    ) t on t.clan_id = c.id
  ) row_data;

  return coalesce(result, '[]'::json);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- 8. FUNCTION: get_user_stats (single user)
-- Returns personal stats for the profile page
-- ═══════════════════════════════════════════
create or replace function public.get_user_stats(p_user_id uuid)
returns json as $$
declare
  result json;
  best_token text;
begin
  -- Get the token symbol of the best trade (highest PnL)
  select token_symbol into best_token
  from public.trades
  where user_id = p_user_id and pnl_usd > 0
  order by pnl_usd desc
  limit 1;

  select json_build_object(
    'total_trades', count(*)::int,
    'total_buys', count(*) filter (where trade_type = 'buy')::int,
    'total_sells', count(*) filter (where trade_type = 'sell')::int,
    'total_volume', coalesce(sum(amount_usd), 0),
    'total_pnl', coalesce(sum(pnl_usd), 0),
    'win_rate', case
      when count(*) filter (where trade_type = 'sell') > 0
      then round(
        (count(*) filter (where trade_type = 'sell' and pnl_usd > 0)::numeric
         / count(*) filter (where trade_type = 'sell')::numeric) * 100, 1
      )
      else 0.0
    end,
    'best_trade_pnl', coalesce(max(pnl_usd), 0),
    'best_trade_token', coalesce(best_token, '-'),
    'pnl_daily', coalesce(sum(case when created_at > now() - interval '24 hours' then pnl_usd else 0 end), 0),
    'pnl_weekly', coalesce(sum(case when created_at > now() - interval '7 days' then pnl_usd else 0 end), 0),
    'pnl_monthly', coalesce(sum(case when created_at > now() - interval '30 days' then pnl_usd else 0 end), 0),
    'volume_daily', coalesce(sum(case when created_at > now() - interval '24 hours' and trade_type = 'buy' then amount_usd else 0 end), 0),
    'volume_weekly', coalesce(sum(case when created_at > now() - interval '7 days' and trade_type = 'buy' then amount_usd else 0 end), 0),
    'volume_monthly', coalesce(sum(case when created_at > now() - interval '30 days' and trade_type = 'buy' then amount_usd else 0 end), 0),
    'volume_alltime', coalesce(sum(case when trade_type = 'buy' then amount_usd else 0 end), 0),
    'last_active', max(created_at),
    'active_days', (select count(distinct date_trunc('day', created_at))::int
                    from public.trades where user_id = p_user_id)
  )
  into result
  from public.trades
  where user_id = p_user_id;

  return coalesce(result, '{}'::json);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- 9. FUNCTION: get_platform_stats
-- Returns aggregate stats across the whole platform
-- ═══════════════════════════════════════════
create or replace function public.get_platform_stats()
returns json as $$
declare
  result json;
  best_roi numeric;
begin
  -- Get top ROI from all clans (scoped to membership periods)
  select coalesce(max(
    case
      when total_buys > 0 then round((total_pnl / total_buys) * 100, 2)
      else 0
    end
  ), 0) into best_roi
  from (
    select
      cm.clan_id,
      sum(t.pnl_usd) as total_pnl,
      sum(case when t.trade_type = 'buy' then t.amount_usd else 0 end) as total_buys
    from public.trades t
    inner join public.clan_members cm
      on cm.user_id = t.user_id
      and t.created_at >= cm.joined_at
      and (cm.left_at is null or t.created_at <= cm.left_at)
    group by cm.clan_id
  ) clan_trades;

  select json_build_object(
    'total_volume', coalesce((select sum(amount_usd) from public.trades), 0),
    'volume_24h', coalesce((select sum(amount_usd) from public.trades where created_at > now() - interval '24 hours'), 0),
    'total_trades', coalesce((select count(*)::int from public.trades), 0),
    'top_roi', best_roi,
    'total_clans', coalesce((select count(*)::int from public.clans), 0),
    'total_users', coalesce((select count(*)::int from public.profiles), 0)
  ) into result;

  return result;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- 10. TOURNAMENTS TABLE (Weekly competitions)
-- ═══════════════════════════════════════════
create table if not exists public.tournaments (
  id uuid default gen_random_uuid() primary key,
  season integer not null default 1,
  week integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  prize_pool numeric not null default 0,
  prize_1st numeric not null default 0,
  prize_2nd numeric not null default 0,
  prize_3rd numeric not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz default now(),
  unique(season, week)
);

alter table public.tournaments enable row level security;

create policy "Anyone can view tournaments" on public.tournaments
  for select using (true);

-- ═══════════════════════════════════════════
-- 11. FUNCTION: get_tournament_leaderboard
-- ═══════════════════════════════════════════
create or replace function public.get_tournament_leaderboard(p_tournament_id uuid)
returns json as $$
declare
  result json;
  t_start timestamptz;
  t_end timestamptz;
begin
  select starts_at, ends_at into t_start, t_end
  from public.tournaments where id = p_tournament_id;

  if t_start is null then return '[]'::json; end if;

  select json_agg(row_data order by roi_pct desc) into result
  from (
    select
      c.id as clan_id, c.name, c.tag, c.avatar_url,
      coalesce(mc.member_count, 0)::int as member_count,
      coalesce(s.total_volume, 0) as total_volume,
      coalesce(s.total_pnl, 0) as total_pnl,
      coalesce(s.trade_count, 0)::int as trade_count,
      case
        when coalesce(s.total_buys, 0) > 0
        then round((coalesce(s.total_pnl, 0) / s.total_buys) * 100, 2)
        else 0
      end as roi_pct
    from public.clans c
    left join (
      select clan_id, count(*)::int as member_count
      from public.clan_members where left_at is null group by clan_id
    ) mc on mc.clan_id = c.id
    left join (
      select cm.clan_id,
        sum(tr.amount_usd) as total_volume,
        sum(tr.pnl_usd) as total_pnl,
        sum(case when tr.trade_type = 'buy' then tr.amount_usd else 0 end) as total_buys,
        count(*) as trade_count
      from public.trades tr
      inner join public.clan_members cm
        on cm.user_id = tr.user_id
        and tr.created_at >= cm.joined_at
        and (cm.left_at is null or tr.created_at <= cm.left_at)
      where tr.created_at >= t_start and tr.created_at <= t_end
      group by cm.clan_id
    ) s on s.clan_id = c.id
  ) row_data;

  return coalesce(result, '[]'::json);
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- 12. FUNCTION: get_active_tournament
-- ═══════════════════════════════════════════
create or replace function public.get_active_tournament()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'id', id, 'season', season, 'week', week,
    'starts_at', starts_at, 'ends_at', ends_at,
    'prize_pool', prize_pool, 'prize_1st', prize_1st,
    'prize_2nd', prize_2nd, 'prize_3rd', prize_3rd,
    'status', status, 'created_at', created_at
  ) into result
  from public.tournaments
  where status = 'active'
  order by starts_at desc limit 1;

  if result is null then
    select json_build_object(
      'id', id, 'season', season, 'week', week,
      'starts_at', starts_at, 'ends_at', ends_at,
      'prize_pool', prize_pool, 'prize_1st', prize_1st,
      'prize_2nd', prize_2nd, 'prize_3rd', prize_3rd,
      'status', status, 'created_at', created_at
    ) into result
    from public.tournaments
    where status = 'upcoming'
    order by starts_at asc limit 1;
  end if;

  if result is null then
    select json_build_object(
      'id', id, 'season', season, 'week', week,
      'starts_at', starts_at, 'ends_at', ends_at,
      'prize_pool', prize_pool, 'prize_1st', prize_1st,
      'prize_2nd', prize_2nd, 'prize_3rd', prize_3rd,
      'status', status, 'created_at', created_at
    ) into result
    from public.tournaments
    where status = 'completed'
    order by ends_at desc limit 1;
  end if;

  return result;
end;
$$ language plpgsql security definer;
