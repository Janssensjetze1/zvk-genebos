-- ─── Voorspellingen van anderen zien vóór de wedstrijd ───────────────────────
--
-- Eerst zag je de gok van je ploegmaats pas een uur voor de aftrap. Sinds
-- 2026-09-14 mag je ze eerder zien, maar pas nadat je zelf iets ingevuld hebt:
-- zo blijft afkijken zonder risico onmogelijk, en is het meteen een reden om
-- zelf snel te gokken.
--
-- Wil je het toch volledig open (iedereen ziet alles, altijd), vervang dan de
-- using-voorwaarde hieronder door gewoon `is_approved()`.
-- ─────────────────────────────────────────────────────────────────────────────

-- Security definer, anders roept de policy zichzelf op via RLS op predictions.
create or replace function public.heeft_voorspeld(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.predictions p
    where p.match_id = p_match_id
      and p.user_id = auth.uid()
  );
$$;

revoke all on function public.heeft_voorspeld(uuid) from public;
grant execute on function public.heeft_voorspeld(uuid) to authenticated;

drop policy if exists "Leden zien voorspellingen na de deadline" on public.predictions;
create policy "Leden zien voorspellingen na de deadline"
  on public.predictions for select
  using (
    is_approved()
    and (
      user_id = auth.uid()                                              -- je eigen gok
      or public.heeft_voorspeld(match_id)                               -- je gokte zelf al
      or now() >= public.pronostiek_aftrap(match_id) - interval '1 hour' -- pronostiek is dicht
    )
  );
