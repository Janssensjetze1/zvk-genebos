-- ─── Leden mogen alle toegekende badges zien ──────────────────────────────────
--
-- De spelersfiche (SpelerDetail) toont de badges van élke speler, net zoals de
-- rest van de stats. Met enkel de "eigen badges"-policy zag een lid de handmatig
-- toegekende badges van anderen niet staan.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Leden kunnen badges lezen" on public.player_badges;
create policy "Leden kunnen badges lezen"
  on public.player_badges for select
  using (is_approved());
