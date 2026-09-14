-- ─── Pronostiek ───────────────────────────────────────────────────────────────
--
-- Elk goedgekeurd lid mag de score van onze eigen wedstrijden voorspellen.
-- Ook wie geen spelersfiche heeft doet mee: de identiteit is user_id, net als
-- bij de opgave.
--
-- Venster: open vanaf een week voor de aftrap, dicht vanaf een uur ervoor.
-- Is er geen uur ingevuld bij de wedstrijd, dan rekenen we met 20:00.
--
-- Punten (beslist door Jetze):
--   5  exacte score juist
--   3  juist doelsaldo (bv. je zei 4-2, het werd 5-3)
--   1  juiste afloop (winst, gelijk of verlies)
--   0  fout
--   +1 durfbonus: je bent de énige die de exacte score juist had
-- Het hoogste dat van toepassing is telt; ze stapelen niet.
--
-- De punten worden nergens opgeslagen maar live berekend in de view
-- pronostiek_scores. Verbetert de admin achteraf een uitslag, dan klopt het
-- klassement vanzelf weer.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.predictions (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  naam        text,
  home_score  smallint not null check (home_score between 0 and 50),
  away_score  smallint not null check (away_score between 0 and 50),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint predictions_uniek_per_gebruiker unique (match_id, user_id)
);

create index if not exists idx_predictions_match_id on public.predictions(match_id);

-- ─── Wanneer staat de pronostiek open? ───────────────────────────────────────
create or replace function public.pronostiek_aftrap(p_match_id uuid)
returns timestamptz language sql stable as $$
  select (m.date + coalesce(m.time, '20:00'::time)) at time zone 'Europe/Brussels'
  from public.matches m
  where m.id = p_match_id;
$$;

create or replace function public.pronostiek_open(p_match_id uuid)
returns boolean language sql stable as $$
  select now() >= public.pronostiek_aftrap(p_match_id) - interval '7 days'
     and now() <  public.pronostiek_aftrap(p_match_id) - interval '1 hour';
$$;

-- ─── Bewaker: enkel onze wedstrijden, enkel binnen het venster ───────────────
create or replace function public.check_pronostiek()
returns trigger language plpgsql as $$
declare
  v_onze boolean;
  v_aftrap timestamptz;
begin
  select (ht.is_zvk or at.is_zvk) into v_onze
    from public.matches m
    join public.teams ht on ht.id = m.home_team_id
    join public.teams at on at.id = m.away_team_id
   where m.id = new.match_id;

  if not coalesce(v_onze, false) then
    raise exception 'Je kan enkel op wedstrijden van ZVK Genebos pronostikeren'
      using errcode = 'check_violation';
  end if;

  if not public.pronostiek_open(new.match_id) then
    v_aftrap := public.pronostiek_aftrap(new.match_id);
    if now() < v_aftrap - interval '7 days' then
      raise exception 'De pronostiek opent pas een week voor de wedstrijd (%)',
        to_char((v_aftrap - interval '7 days') at time zone 'Europe/Brussels', 'DD/MM om HH24:MI')
        using errcode = 'check_violation';
    else
      raise exception 'De pronostiek sloot een uur voor de aftrap'
        using errcode = 'check_violation';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_check_pronostiek on public.predictions;
create trigger trg_check_pronostiek
  before insert or update on public.predictions
  for each row execute function public.check_pronostiek();

-- ─── Naam meeschrijven (leden mogen elkaars profiel niet lezen) ──────────────
create or replace function public.vul_pronostiek_naam()
returns trigger language plpgsql security definer as $$
begin
  select coalesce(
           (select pl.name from public.players pl where pl.id = pr.player_id),
           nullif(btrim(pr.display_name), ''),
           pr.email
         )
    into new.naam
    from public.profiles pr
   where pr.id = new.user_id;
  return new;
end;
$$;

drop trigger if exists trg_vul_pronostiek_naam on public.predictions;
create trigger trg_vul_pronostiek_naam
  before insert or update on public.predictions
  for each row execute function public.vul_pronostiek_naam();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.predictions enable row level security;

-- Je eigen voorspelling zie je altijd; die van de anderen pas zodra de
-- pronostiek dicht is. Anders kan je gewoon afkijken.
drop policy if exists "Leden zien voorspellingen na de deadline" on public.predictions;
create policy "Leden zien voorspellingen na de deadline"
  on public.predictions for select
  using (
    is_approved()
    and (
      user_id = auth.uid()
      or now() >= public.pronostiek_aftrap(match_id) - interval '1 hour'
    )
  );

drop policy if exists "Lid beheert eigen voorspelling" on public.predictions;
create policy "Lid beheert eigen voorspelling"
  on public.predictions for all
  using (is_approved() and user_id = auth.uid())
  with check (is_approved() and user_id = auth.uid());

drop policy if exists "Admins beheren alle voorspellingen" on public.predictions;
create policy "Admins beheren alle voorspellingen"
  on public.predictions for all
  using (is_admin())
  with check (is_admin());

-- ─── Punten per voorspelling ─────────────────────────────────────────────────
-- Enkel gespeelde wedstrijden tellen mee. "Gespeeld" volgt dezelfde regel als
-- src/lib/wedstrijd.js: datum voorbij, of datum vandaag mét ingevuld blad.
create or replace view public.pronostiek_scores as
with gespeeld as (
  select m.*
  from public.matches m
  where m.date < current_date
     or (m.date = current_date and (
           coalesce(m.home_score, 0) > 0 or coalesce(m.away_score, 0) > 0
           or exists (select 1 from public.match_players mp where mp.match_id = m.id)
           or exists (select 1 from public.goals g where g.match_id = m.id)
        ))
),
basis as (
  select p.id, p.match_id, p.user_id, p.naam,
         p.home_score as voorspeld_thuis,
         p.away_score as voorspeld_uit,
         m.season_id, m.date,
         m.home_score as echt_thuis,
         m.away_score as echt_uit,
         (p.home_score = m.home_score and p.away_score = m.away_score)            as is_exact,
         ((p.home_score - p.away_score) = (m.home_score - m.away_score))          as is_saldo,
         (sign(p.home_score - p.away_score) = sign(m.home_score - m.away_score))  as is_winnaar
  from public.predictions p
  join gespeeld m on m.id = p.match_id
),
exact_per_match as (
  select match_id, count(*) filter (where is_exact) as aantal_exact
  from basis group by match_id
)
select b.*,
       (b.is_exact and e.aantal_exact = 1) as durfbonus,
       case when b.is_exact then 5 when b.is_saldo then 3 when b.is_winnaar then 1 else 0 end
       + case when b.is_exact and e.aantal_exact = 1 then 1 else 0 end as punten
from basis b
join exact_per_match e on e.match_id = b.match_id
where public.is_approved();

-- ─── Klassement per seizoen ──────────────────────────────────────────────────
create or replace view public.pronostiek_klassement as
select season_id,
       user_id,
       max(naam)                              as naam,
       sum(punten)                            as punten,
       count(*)                               as voorspellingen,
       count(*) filter (where is_exact)       as exacte,
       count(*) filter (where durfbonus)      as durfbonussen
from public.pronostiek_scores
group by season_id, user_id;

-- ─── Teller: hoeveel voorspellingen zijn er al? ──────────────────────────────
-- Enkel het aantal, niet de inhoud — zo kan de app "7 leden gaven al een
-- voorspelling" tonen zonder dat iemand kan afkijken.
create or replace view public.pronostiek_tellers as
select match_id, count(*) as aantal
from public.predictions
group by match_id;

grant select on public.pronostiek_tellers   to authenticated;
grant select on public.pronostiek_scores    to authenticated;
grant select on public.pronostiek_klassement to authenticated;
