-- ─── Bezoeken per dag, voor de activiteitsgrafiek in Beheer → Gebruik ────────
--
-- profiles.last_seen onthoudt enkel het laatste bezoek. Om te zien hoeveel
-- leden de app per week gebruiken, bewaren we per lid één rij per dag waarop
-- de app geopend werd. Geen tijdstippen, geen pagina's: enkel "was er die dag".
--
-- De app roept markeer_online() al aan bij het openen (hoogstens één keer per
-- kwartier); die functie schrijft nu ook de dag weg. Aan de app zelf hoeft
-- niets te veranderen.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.app_bezoeken (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dag     date not null,
  primary key (user_id, dag)
);

create index if not exists idx_app_bezoeken_dag on public.app_bezoeken (dag);

alter table public.app_bezoeken enable row level security;

-- Enkel admins lezen mee; schrijven gebeurt uitsluitend via markeer_online()
create policy "Admins lezen bezoeken"
  on public.app_bezoeken for select
  using (is_admin());

create or replace function public.markeer_online()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen = now() where id = auth.uid();

  insert into public.app_bezoeken (user_id, dag)
  select auth.uid(), (now() at time zone 'Europe/Brussels')::date
  where auth.uid() is not null
  on conflict do nothing;
$$;

revoke all on function public.markeer_online() from public, anon;
grant execute on function public.markeer_online() to authenticated;
