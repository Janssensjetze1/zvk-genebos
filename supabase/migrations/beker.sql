-- ─── Beker: poules en knock-out ───────────────────────────────────────────────
--
-- De beker wordt gespeeld in poules, daarna een knock-outfase (beslist door
-- Jetze, 2026-10-25):
--
-- beker_poules         per seizoen de poules (A, B, ...), met hoeveel ploegen
--                      er doorgaan naar de knock-out
-- beker_poule_ploegen  welke ploeg in welke poule zit; een ploeg zit per
--                      seizoen in hoogstens één poule
-- matches.beker_ronde  voor bekerwedstrijden: 'poule' of een knock-outronde
--                      ('achtste', 'kwart', 'halve', 'finale'). Leeg bij een
--                      bekerwedstrijd = poule.
-- matches.home_pen /   strafschoppen bij een gelijkspel in de knock-out
--         away_pen
--
-- De admin deelt de poules in en kiest per knock-outwedstrijd de ronde en de
-- ploegen; de app stelt de koppels voor (A1 – B2, B1 – A2, ...). De poulestand
-- wordt net als het klassement berekend uit de uitslagen.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.matches
  add column if not exists beker_ronde text
    check (beker_ronde is null or beker_ronde in ('poule', 'achtste', 'kwart', 'halve', 'finale')),
  add column if not exists home_pen smallint check (home_pen is null or home_pen between 0 and 50),
  add column if not exists away_pen smallint check (away_pen is null or away_pen between 0 and 50);

create table if not exists public.beker_poules (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.seasons(id) on delete cascade,
  naam       text not null check (char_length(btrim(naam)) between 1 and 20),
  doorgaan   int not null default 2 check (doorgaan between 0 and 16),
  volgorde   int not null default 0,
  created_at timestamptz not null default now(),

  unique (season_id, naam)
);

create table if not exists public.beker_poule_ploegen (
  poule_id  uuid not null references public.beker_poules(id) on delete cascade,
  team_id   uuid not null references public.teams(id) on delete cascade,
  -- ingevuld door de trigger, zodat één ploeg per seizoen in één poule zit
  season_id uuid not null,

  primary key (poule_id, team_id),
  unique (season_id, team_id)
);

create or replace function public.vul_poule_seizoen()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select season_id into new.season_id from beker_poules where id = new.poule_id;
  return new;
end;
$$;

drop trigger if exists trg_vul_poule_seizoen on public.beker_poule_ploegen;
create trigger trg_vul_poule_seizoen
  before insert or update on public.beker_poule_ploegen
  for each row execute function public.vul_poule_seizoen();

revoke execute on function public.vul_poule_seizoen() from public, anon, authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.beker_poules enable row level security;
alter table public.beker_poule_ploegen enable row level security;

drop policy if exists "Leden lezen poules" on public.beker_poules;
create policy "Leden lezen poules" on public.beker_poules for select using (is_approved());
drop policy if exists "Admins beheren poules" on public.beker_poules;
create policy "Admins beheren poules" on public.beker_poules for all using (is_admin()) with check (is_admin());

drop policy if exists "Leden lezen pouleploegen" on public.beker_poule_ploegen;
create policy "Leden lezen pouleploegen" on public.beker_poule_ploegen for select using (is_approved());
drop policy if exists "Admins beheren pouleploegen" on public.beker_poule_ploegen;
create policy "Admins beheren pouleploegen" on public.beker_poule_ploegen for all using (is_admin()) with check (is_admin());
