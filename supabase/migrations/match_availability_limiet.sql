-- ─── Limiet op de opgave ──────────────────────────────────────────────────────
--
-- Er kunnen maximaal 10 spelers meedoen aan een wedstrijd. De frontend blokkeert
-- de knop al, maar dat is niet waterdicht: twee spelers kunnen tegelijk duwen.
-- Deze trigger is de echte bewaker.
--
-- 'niet' en 'kijken' zijn onbeperkt — enkel 'mee' telt mee voor de limiet.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.check_opgave_limiet()
returns trigger language plpgsql as $$
declare
  aantal int;
  maximum constant int := 10;
begin
  -- Enkel 'mee' telt
  if new.status is distinct from 'mee' then
    return new;
  end if;

  -- Serialiseer per wedstrijd, zodat twee gelijktijdige inschrijvingen
  -- niet allebei dezelfde laatste plek zien.
  perform pg_advisory_xact_lock(hashtextextended(new.match_id::text, 0));

  select count(*) into aantal
  from public.match_availability
  where match_id = new.match_id
    and status = 'mee'
    and player_id <> new.player_id;

  if aantal >= maximum then
    raise exception 'Volzet: er kunnen maximaal % spelers meedoen aan deze wedstrijd', maximum
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_opgave_limiet on public.match_availability;
create trigger trg_opgave_limiet
  before insert or update on public.match_availability
  for each row execute function public.check_opgave_limiet();
