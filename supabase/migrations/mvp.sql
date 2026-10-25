-- ─── MVP per wedstrijd ────────────────────────────────────────────────────────
--
-- Na elke ZVK-wedstrijd stemmen de leden wie de MVP was (beslist door Jetze,
-- 2026-10-25).
--
-- Wie stemt: elk goedgekeurd lid, één stem per wedstrijd, aan te passen zolang
--            de stemming open staat.
-- Op wie:    een speler die op het wedstrijdblad staat (match_players), niet
--            op jezelf.
-- Wanneer:   zodra het wedstrijdblad ingevuld is, tot 24 uur na de aftrap
--            (pronostiek_aftrap: datum + uur, of 20:00 als er geen uur is).
-- Uitslag:   pas na het sluiten zichtbaar, in mvp_uitslag. Tijdens de stemming
--            enkel het aantal stemmen (mvp_tellers). Staan er spelers gelijk
--            met de meeste stemmen, dan zijn ze allemaal MVP.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.mvp_stemmen (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mvp_stemmen_uniek_per_lid unique (match_id, user_id)
);

create index if not exists idx_mvp_stemmen_match on public.mvp_stemmen(match_id);

-- ─── Wanneer kan je stemmen? ─────────────────────────────────────────────────
create or replace function public.mvp_sluit_op(p_match_id uuid)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select public.pronostiek_aftrap(p_match_id) + interval '24 hours';
$$;

-- Security definer: match_players en teams lezen, los van de RLS van de vrager
create or replace function public.mvp_open(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
           select 1 from matches m
           join teams th on th.id = m.home_team_id
           join teams tu on tu.id = m.away_team_id
           where m.id = p_match_id and (th.is_zvk or tu.is_zvk)
         )
     and exists (select 1 from match_players mp where mp.match_id = p_match_id)
     and now() < public.mvp_sluit_op(p_match_id);
$$;

-- ─── Bewaker ─────────────────────────────────────────────────────────────────
create or replace function public.check_mvp_stem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();

  -- Admins (en het dashboard) mogen corrigeren, ook na het sluiten
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  if not mvp_open(new.match_id) then
    raise exception 'De MVP-stemming voor deze wedstrijd is niet open'
      using errcode = 'check_violation';
  end if;

  if not exists (
    select 1 from match_players mp where mp.match_id = new.match_id and mp.player_id = new.player_id
  ) then
    raise exception 'Je kan enkel stemmen op iemand die meespeelde'
      using errcode = 'check_violation';
  end if;

  if exists (select 1 from profiles p where p.id = new.user_id and p.player_id = new.player_id) then
    raise exception 'Op jezelf stemmen kan niet'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_mvp_stem on public.mvp_stemmen;
create trigger trg_check_mvp_stem
  before insert or update on public.mvp_stemmen
  for each row execute function public.check_mvp_stem();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.mvp_stemmen enable row level security;

-- Je ziet enkel je eigen stem; de uitslag komt uit mvp_uitslag
drop policy if exists "Eigen MVP-stem lezen" on public.mvp_stemmen;
create policy "Eigen MVP-stem lezen"
  on public.mvp_stemmen for select
  using (user_id = auth.uid());

drop policy if exists "Lid stemt zelf" on public.mvp_stemmen;
create policy "Lid stemt zelf"
  on public.mvp_stemmen for all
  using (is_approved() and user_id = auth.uid())
  with check (is_approved() and user_id = auth.uid());

-- Wijzigen of intrekken enkel zolang de stemming open is (de trigger bewaakt
-- insert en update, dit bewaakt delete)
drop policy if exists "Stem intrekken zolang open" on public.mvp_stemmen;
create policy "Stem intrekken zolang open"
  on public.mvp_stemmen as restrictive for delete
  using (is_admin() or mvp_open(match_id));

drop policy if exists "Admins beheren MVP-stemmen" on public.mvp_stemmen;
create policy "Admins beheren MVP-stemmen"
  on public.mvp_stemmen for all
  using (is_admin())
  with check (is_admin());

-- ─── Views ───────────────────────────────────────────────────────────────────
-- Als eigenaar lezen ze alle stemmen; daarom filteren ze zelf op is_approved()
-- en tonen ze nooit wie op wie stemde.

-- Hoeveel leden stemden al? Ook tijdens de stemming, zonder de inhoud.
create or replace view public.mvp_tellers as
select match_id, count(*)::int as stemmen
from public.mvp_stemmen
where public.is_approved()
group by match_id;

-- Stemmen per speler, pas na het sluiten
create or replace view public.mvp_uitslag as
with telling as (
  select s.match_id, s.player_id, count(*)::int as stemmen
  from public.mvp_stemmen s
  where now() >= public.mvp_sluit_op(s.match_id)
  group by s.match_id, s.player_id
)
select t.match_id, t.player_id, t.stemmen,
       t.stemmen = max(t.stemmen) over (partition by t.match_id) as is_mvp
from telling t
where public.is_approved();

-- Aantal MVP-titels per speler per seizoen
create or replace view public.mvp_klassement as
select m.season_id, u.player_id, count(*)::int as mvps
from public.mvp_uitslag u
join public.matches m on m.id = u.match_id
where u.is_mvp
group by m.season_id, u.player_id;

revoke all on public.mvp_tellers, public.mvp_uitslag, public.mvp_klassement from anon;
grant select on public.mvp_tellers, public.mvp_uitslag, public.mvp_klassement to authenticated;

revoke execute on function public.check_mvp_stem() from public, anon, authenticated;
