-- ─── Opgave opent woensdag om 10:00 (was 00:00) ──────────────────────────────
--
-- Zelfde regel als voorheen — de laatste woensdag op of vóór de matchdag — maar
-- nu om 10 uur 's ochtends Brusselse tijd. Zo valt het openen op een normaal
-- uur en kan de automatische melding meteen mee vertrekken.
--
-- De JS-kant van deze regel staat in src/hooks/useOpgave.js (opgaveOpentOp).
-- Pas altijd beide aan.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.opgave_opent_op(p_match_id uuid)
returns timestamptz language sql stable as $$
  select coalesce(
    m.availability_opens_at,
    -- isodow: ma=1 ... wo=3 ... zo=7 → aantal dagen terug tot de laatste woensdag
    ((m.date - ((extract(isodow from m.date)::int - 3 + 7) % 7))::timestamp + interval '10 hours')
      at time zone 'Europe/Brussels'
  )
  from public.matches m
  where m.id = p_match_id;
$$;

comment on column public.matches.availability_opens_at is
  'Override: opgave gaat vanaf dit moment open. Null = standaardregel (woensdag 10:00 van de matchweek).';
