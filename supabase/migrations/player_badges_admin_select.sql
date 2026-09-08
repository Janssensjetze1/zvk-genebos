-- ─── Admins moeten alle toegekende badges kunnen zien ─────────────────────────
--
-- player_badges.sql gaf admins wel insert- en delete-rechten, maar geen select.
-- Zonder deze policy ziet het beheerscherm niet welke badges al toegekend zijn.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins kunnen badges lezen" on public.player_badges;
create policy "Admins kunnen badges lezen"
  on public.player_badges for select
  using (is_admin());
