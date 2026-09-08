-- ─── Wanneer gaat de opgave open? ─────────────────────────────────────────────
--
-- Standaardregel: woensdag 00:00 (Brussel) van de week van de wedstrijd, dus de
-- laatste woensdag op of vóór de matchdag. Match op vrijdag → open vanaf de
-- woensdag ervoor. Match op dinsdag → open vanaf de woensdag zes dagen ervoor.
-- Match op woensdag → open vanaf diezelfde ochtend.
--
-- Een admin kan dat vervroegen door `matches.availability_opens_at` te vullen.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.matches
  add column if not exists availability_opens_at timestamptz;

comment on column public.matches.availability_opens_at is
  'Override: opgave gaat vanaf dit moment open. Null = standaardregel (woensdag 00:00 van de matchweek).';

-- Berekent het openingsmoment van één wedstrijd
create or replace function public.opgave_opent_op(p_match_id uuid)
returns timestamptz language sql stable as $$
  select coalesce(
    m.availability_opens_at,
    -- isodow: ma=1 ... wo=3 ... zo=7 → aantal dagen terug tot de laatste woensdag
    (m.date - ((extract(isodow from m.date)::int - 3 + 7) % 7))::timestamp
      at time zone 'Europe/Brussels'
  )
  from public.matches m
  where m.id = p_match_id;
$$;

-- De frontend verbergt het opgaveblok al, maar dit is de echte bewaker
create or replace function public.check_opgave_open()
returns trigger language plpgsql as $$
declare
  opent timestamptz;
begin
  opent := public.opgave_opent_op(new.match_id);

  if opent is not null and now() < opent then
    raise exception 'De opgave voor deze wedstrijd opent pas op %',
      to_char(opent at time zone 'Europe/Brussels', 'DD/MM/YYYY om HH24:MI')
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_opgave_open on public.match_availability;
create trigger trg_opgave_open
  before insert or update on public.match_availability
  for each row execute function public.check_opgave_open();
