-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Weekly Tournaments System
-- Copie TOUT ce fichier dans le SQL Editor de Supabase → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── TABLE: tournaments ───
-- Each row represents a weekly tournament cycle
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

-- Enable RLS
alter table public.tournaments enable row level security;

-- Anyone can read tournaments
drop policy if exists "Anyone can view tournaments" on public.tournaments;
create policy "Anyone can view tournaments" on public.tournaments
  for select using (true);

-- Only service role / admin can insert/update tournaments
-- (managed via Supabase dashboard or server-side)

-- ─── FUNCTION: get_tournament_leaderboard ───
-- Computes the ranking of all clans for a given tournament week.
-- Ranks by ROI (PnL / buy volume) of trades made DURING the tournament window
-- Only counts trades that fall within each member's active membership period.
create or replace function public.get_tournament_leaderboard(p_tournament_id uuid)
returns json as $$
declare
  result json;
  t_start timestamptz;
  t_end timestamptz;
begin
  -- Get the tournament window
  select starts_at, ends_at into t_start, t_end
  from public.tournaments
  where id = p_tournament_id;

  if t_start is null then
    return '[]'::json;
  end if;

  select json_agg(row_data order by roi_pct desc) into result
  from (
    select
      c.id as clan_id,
      c.name,
      c.tag,
      c.avatar_url,
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
    -- Active member count
    left join (
      select clan_id, count(*)::int as member_count
      from public.clan_members
      where left_at is null
      group by clan_id
    ) mc on mc.clan_id = c.id
    -- Aggregate trades WITHIN the tournament window AND within membership periods
    left join (
      select
        cm.clan_id,
        sum(tr.amount_usd) as total_volume,
        sum(tr.pnl_usd) as total_pnl,
        sum(case when tr.trade_type = 'buy' then tr.amount_usd else 0 end) as total_buys,
        count(*) as trade_count
      from public.trades tr
      inner join public.clan_members cm
        on cm.user_id = tr.user_id
        -- Trade must be within membership period
        and tr.created_at >= cm.joined_at
        and (cm.left_at is null or tr.created_at <= cm.left_at)
      where
        -- Trade must be within tournament window
        tr.created_at >= t_start
        and tr.created_at <= t_end
      group by cm.clan_id
    ) s on s.clan_id = c.id
  ) row_data;

  return coalesce(result, '[]'::json);
end;
$$ language plpgsql security definer;

-- ─── FUNCTION: get_active_tournament ───
-- Returns the currently active tournament (or the most recent upcoming one)
create or replace function public.get_active_tournament()
returns json as $$
declare
  result json;
begin
  -- First try to find an active tournament
  select json_build_object(
    'id', id,
    'season', season,
    'week', week,
    'starts_at', starts_at,
    'ends_at', ends_at,
    'prize_pool', prize_pool,
    'prize_1st', prize_1st,
    'prize_2nd', prize_2nd,
    'prize_3rd', prize_3rd,
    'status', status,
    'created_at', created_at
  ) into result
  from public.tournaments
  where status = 'active'
  order by starts_at desc
  limit 1;

  -- If no active, get the most recent upcoming
  if result is null then
    select json_build_object(
      'id', id,
      'season', season,
      'week', week,
      'starts_at', starts_at,
      'ends_at', ends_at,
      'prize_pool', prize_pool,
      'prize_1st', prize_1st,
      'prize_2nd', prize_2nd,
      'prize_3rd', prize_3rd,
      'status', status,
      'created_at', created_at
    ) into result
    from public.tournaments
    where status = 'upcoming'
    order by starts_at asc
    limit 1;
  end if;

  -- If still null, get the most recent completed
  if result is null then
    select json_build_object(
      'id', id,
      'season', season,
      'week', week,
      'starts_at', starts_at,
      'ends_at', ends_at,
      'prize_pool', prize_pool,
      'prize_1st', prize_1st,
      'prize_2nd', prize_2nd,
      'prize_3rd', prize_3rd,
      'status', status,
      'created_at', created_at
    ) into result
    from public.tournaments
    where status = 'completed'
    order by ends_at desc
    limit 1;
  end if;

  return result;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════
-- SEED: Create first tournament (this week)
-- Adjust dates/prizes as needed
-- ═══════════════════════════════════════════
insert into public.tournaments (season, week, starts_at, ends_at, prize_pool, prize_1st, prize_2nd, prize_3rd, status)
values (
  1,
  1,
  date_trunc('week', now()),                   -- Monday 00:00 of current week
  date_trunc('week', now()) + interval '7 days', -- Next Monday 00:00
  500,    -- $500 total prize pool
  250,    -- 1st: $250
  150,    -- 2nd: $150
  100,    -- 3rd: $100
  'active'
)
on conflict (season, week) do nothing;

-- ═══════════════════════════════════════════
-- ✅ TOURNAMENT MIGRATION TERMINÉE !
-- ═══════════════════════════════════════════
