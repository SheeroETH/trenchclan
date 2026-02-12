-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Soft-delete membership + PnL par période
-- ★ CE FICHIER EST SAFE À RE-LANCER (idempotent)
-- Copie TOUT ce fichier dans le SQL Editor de Supabase → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── ÉTAPE 1 : Ajouter la colonne left_at ───
alter table public.clan_members 
  add column if not exists left_at timestamptz default null;

-- ─── ÉTAPE 2 : Supprimer l'ancien constraint unique ───
alter table public.clan_members 
  drop constraint if exists clan_members_clan_id_user_id_key;

-- ─── ÉTAPE 3 : Index partiels (1 seul membership actif par user) ───
drop index if exists idx_clan_members_active_unique;
create unique index idx_clan_members_active_unique
  on public.clan_members(clan_id, user_id) where left_at is null;

drop index if exists idx_clan_members_one_active_clan;
create unique index idx_clan_members_one_active_clan
  on public.clan_members(user_id) where left_at is null;

-- ─── ÉTAPE 4 : Policy UPDATE pour le soft-delete ───
drop policy if exists "Users can update own membership" on public.clan_members;
create policy "Users can update own membership" on public.clan_members
  for update using (auth.uid() = user_id);

-- ─── ÉTAPE 5 : Trigger max 6 (ne compte que les actifs) ───
create or replace function public.enforce_max_clan_members()
returns trigger as $$
declare
  current_count integer;
  max_allowed integer;
begin
  select max_members into max_allowed
  from public.clans
  where id = new.clan_id;

  select count(*) into current_count
  from public.clan_members
  where clan_id = new.clan_id
    and left_at is null;

  if max_allowed is null or max_allowed > 6 then
    max_allowed := 6;
  end if;

  if current_count >= max_allowed then
    raise exception 'Clan is full. Maximum % members allowed.', max_allowed;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_clan_capacity on public.clan_members;
create trigger check_clan_capacity
  before insert on public.clan_members
  for each row execute procedure public.enforce_max_clan_members();

-- ─── ÉTAPE 6 : get_clan_stats (PnL par période de membership) ───
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
  inner join public.clan_members cm
    on cm.clan_id = p_clan_id
    and cm.user_id = t.user_id
    and t.created_at >= cm.joined_at
    and (cm.left_at is null or t.created_at <= cm.left_at);

  return result;
end;
$$ language plpgsql security definer;

-- ─── ÉTAPE 7 : get_leaderboard (PnL par période de membership) ───
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
    left join (
      select clan_id, count(*)::int as member_count
      from public.clan_members
      where left_at is null
      group by clan_id
    ) mc on mc.clan_id = c.id
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
        and tr.created_at >= cm2.joined_at
        and (cm2.left_at is null or tr.created_at <= cm2.left_at)
      group by cm2.clan_id
    ) t on t.clan_id = c.id
  ) row_data;

  return coalesce(result, '[]'::json);
end;
$$ language plpgsql security definer;

-- ─── ÉTAPE 8 : get_platform_stats ───
create or replace function public.get_platform_stats()
returns json as $$
declare
  result json;
  best_roi numeric;
begin
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

-- ─── ÉTAPE 9 : Policies messages/trades (vérifier left_at) ───
drop policy if exists "Clan members can view messages" on public.messages;
create policy "Clan members can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.clan_members
      where clan_members.clan_id = messages.clan_id
      and clan_members.user_id = auth.uid()
      and clan_members.left_at is null
    )
  );

drop policy if exists "Clan members can send messages" on public.messages;
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

drop policy if exists "Clan members can log trades" on public.trades;
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
-- ✅ MIGRATION TERMINÉE !
-- Tu devrais voir "Success. No rows returned"
-- ═══════════════════════════════════════════
