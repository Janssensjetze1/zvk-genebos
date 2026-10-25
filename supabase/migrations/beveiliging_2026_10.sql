-- ─── Beveiliging, oktober 2026 ────────────────────────────────────────────────
--
-- Opgeruimd na de beveiligingsmeldingen van Supabase (2026-10-25):
--
-- 1. get_users_last_sign_in() gaf het laatste inlogtijdstip van élk account,
--    ook aan wie niet ingelogd was. Nu enkel voor admins (Ledenbeheer).
-- 2. De view standings en pronostiek_tellers filterden niet: ook wie niet
--    (of nog niet goedgekeurd) ingelogd was, kon ze lezen. standings volgt nu
--    de RLS van matches en teams; pronostiek_tellers filtert op is_approved().
--    Geen enkele view is nog leesbaar zonder in te loggen.
-- 3. teams had naast "Leden kunnen teams lezen" een regel die iedereen liet
--    lezen (true). Die valt weg.
-- 4. Triggerfuncties hoeft niemand rechtstreeks aan te roepen.
-- 5. Functies zonder vaste search_path krijgen er een.
--
-- Niet aangeraakt: is_admin, is_approved, mijn_speler_id, heeft_voorspeld en
-- mvp_open blijven aanroepbaar, want RLS-regels gebruiken ze; zonder login
-- geven ze gewoon false of null.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Inlogtijdstippen enkel voor admins
create or replace function public.get_users_last_sign_in()
returns table(id uuid, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.last_sign_in_at
  from auth.users u
  where public.is_admin();
$$;

revoke execute on function public.get_users_last_sign_in() from public, anon;
grant execute on function public.get_users_last_sign_in() to authenticated;

-- 2. Views
alter view public.standings set (security_invoker = true);

create or replace view public.pronostiek_tellers as
select match_id, count(*) as aantal
from public.predictions
where public.is_approved()
group by match_id;

revoke all on public.standings, public.pronostiek_tellers, public.pronostiek_scores,
              public.pronostiek_klassement, public.pronostiek_stats from anon;
grant select on public.standings, public.pronostiek_tellers to authenticated;

-- 3. Teams enkel voor leden
drop policy if exists "Leden mogen teams lezen" on public.teams;

-- 4. Triggerfuncties
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.vul_opgave_naam() from public, anon, authenticated;
revoke execute on function public.vul_pronostiek_naam() from public, anon, authenticated;

-- 5. Vaste search_path
alter function public.handle_new_user() set search_path = public;
alter function public.is_approved() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.touch_match_availability() set search_path = public;
alter function public.mijn_speler_id() set search_path = public;
alter function public.check_opgave_limiet() set search_path = public;
alter function public.check_opgave_open() set search_path = public;
alter function public.vul_opgave_naam() set search_path = public;
alter function public.check_pronostiek() set search_path = public;
alter function public.vul_pronostiek_naam() set search_path = public;
alter function public.pronostiek_aftrap(uuid) set search_path = public;
alter function public.pronostiek_open(uuid) set search_path = public;
alter function public.opgave_opent_op(uuid) set search_path = public;
