-- ─── Pronostiek op élke wedstrijd ────────────────────────────────────────────
--
-- Eerst kon je enkel voorspellen op wedstrijden waarin ZVK zelf speelt. Sinds
-- 2026-09-14 mag het op alle wedstrijden van het seizoen, dus ook op die van
-- tegenstanders onderling. De bewaker houdt enkel nog het tijdsvenster tegen.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.check_pronostiek()
returns trigger language plpgsql as $$
declare
  v_aftrap timestamptz;
begin
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
