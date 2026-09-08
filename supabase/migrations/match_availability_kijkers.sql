-- ─── Opgave zonder spelersfiche ───────────────────────────────────────────────
--
-- Wie nog geen spelersfiche gekoppeld heeft, kon zich helemaal niet opgeven.
-- Voortaan kan zo iemand wél "Ik kom zien" aanduiden, maar niet meespelen.
--
-- Daarvoor verhuist de identiteit van de rij van player_id naar user_id:
--   • user_id   — altijd ingevuld, verwijst naar het profiel
--   • player_id — enkel ingevuld als het account aan een speler hangt
--   • naam      — automatisch ingevuld door een trigger, zodat de lijst geen
--                 join op profiles nodig heeft (leden mogen elkaars profiel niet lezen)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.match_availability
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists naam text;

-- Bestaande rijen koppelen aan het juiste profiel
update public.match_availability ma
set user_id = p.id
from public.profiles p
where ma.user_id is null and p.player_id = ma.player_id;

-- Rijen zonder profiel kunnen niet blijven bestaan
delete from public.match_availability where user_id is null;

alter table public.match_availability alter column user_id set not null;
alter table public.match_availability alter column player_id drop not null;

-- Eén opgave per persoon per wedstrijd
alter table public.match_availability drop constraint if exists match_availability_unique;
alter table public.match_availability drop constraint if exists match_availability_uniek_per_gebruiker;
alter table public.match_availability
  add constraint match_availability_uniek_per_gebruiker unique (match_id, user_id);

-- Zonder spelersfiche kan je enkel komen kijken
alter table public.match_availability drop constraint if exists match_availability_kijker_check;
alter table public.match_availability
  add constraint match_availability_kijker_check
  check (player_id is not null or status = 'kijken');

-- ─── Naam automatisch invullen ───────────────────────────────────────────────
create or replace function public.vul_opgave_naam()
returns trigger language plpgsql security definer as $$
begin
  if new.player_id is not null then
    select name into new.naam from public.players where id = new.player_id;
  else
    select coalesce(nullif(btrim(display_name), ''), email)
      into new.naam from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vul_opgave_naam on public.match_availability;
create trigger trg_vul_opgave_naam
  before insert or update on public.match_availability
  for each row execute function public.vul_opgave_naam();

-- Bestaande rijen een naam geven
update public.match_availability ma
set naam = pl.name
from public.players pl
where ma.player_id = pl.id and ma.naam is null;

-- ─── Limiet: vergelijk op user_id, niet op player_id ─────────────────────────
create or replace function public.check_opgave_limiet()
returns trigger language plpgsql as $$
declare
  aantal int;
  maximum constant int := 10;
begin
  if new.status is distinct from 'mee' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.match_id::text, 0));

  select count(*) into aantal
  from public.match_availability
  where match_id = new.match_id
    and status = 'mee'
    and user_id <> new.user_id;

  if aantal >= maximum then
    raise exception 'Volzet: er kunnen maximaal % spelers meedoen aan deze wedstrijd', maximum
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- ─── RLS: je beheert je eigen rij, herkend aan user_id ───────────────────────
drop policy if exists "Speler beheert eigen opgave" on public.match_availability;
drop policy if exists "Lid beheert eigen opgave" on public.match_availability;
create policy "Lid beheert eigen opgave"
  on public.match_availability for all
  using (is_approved() and user_id = auth.uid())
  with check (
    is_approved()
    and user_id = auth.uid()
    -- je mag enkel je eigen spelersfiche invullen, of geen enkele
    and (player_id is null or player_id = public.mijn_speler_id())
  );
