-- ─── match_availability ───────────────────────────────────────────────────────
--
-- Opgave vooraf: elke speler duidt zelf aan of hij meedoet aan een aankomende
-- wedstrijd. Dit staat LOS van `match_players` — die tabel blijft de officiële
-- registratie door de admin van wie er effectief gespeeld heeft.
--
-- status:
--   'mee'    → Ik doen mee
--   'niet'   → Ik doen nie mee
--   'kijken' → Ik kom zien (aanwezig, maar speelt niet mee)
--
-- Gekoppeld op player_id (niet user_id), zodat de admin de opgave rechtstreeks
-- kan overnemen als voorzet voor match_players.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.match_availability (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  status     text not null check (status in ('mee', 'niet', 'kijken')),
  updated_at timestamptz not null default now(),

  constraint match_availability_unique unique (match_id, player_id)
);

create index if not exists idx_match_availability_match_id on public.match_availability(match_id);

-- updated_at automatisch bijwerken
create or replace function public.touch_match_availability()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_match_availability on public.match_availability;
create trigger trg_touch_match_availability
  before update on public.match_availability
  for each row execute function public.touch_match_availability();

-- Helper: het player_id dat aan de ingelogde gebruiker hangt
create or replace function public.mijn_speler_id()
returns uuid as $$
  select player_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.match_availability enable row level security;

-- Iedereen die goedgekeurd is, ziet alle opgaves (sociale druk werkt)
drop policy if exists "Leden kunnen opgave lezen" on public.match_availability;
create policy "Leden kunnen opgave lezen"
  on public.match_availability for select
  using (is_approved());

-- Een speler beheert enkel zijn eigen rij
drop policy if exists "Speler beheert eigen opgave" on public.match_availability;
create policy "Speler beheert eigen opgave"
  on public.match_availability for all
  using (
    is_approved()
    and player_id = public.mijn_speler_id()
  )
  with check (
    is_approved()
    and player_id = public.mijn_speler_id()
  );

-- Admins mogen alles (bv. iemand die het zelf niet invult)
drop policy if exists "Admins beheren alle opgaves" on public.match_availability;
create policy "Admins beheren alle opgaves"
  on public.match_availability for all
  using (is_admin())
  with check (is_admin());
