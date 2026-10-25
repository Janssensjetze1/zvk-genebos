-- ─── Meldingen: wie las wat ───────────────────────────────────────────────────
--
-- announcement_reads had enkel "Eigen reads lezen", waardoor ook een admin
-- alleen zijn eigen rij zag: Beheer → Gebruik → Meldingen toonde daardoor
-- altijd "1 lid las dit". Admins lezen nu alles.
--
-- De meldingen zelf waren voor iedereen leesbaar (ook zonder login); nu enkel
-- voor goedgekeurde leden, zoals de rest van de app.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Admins lezen alle reads" on public.announcement_reads;
create policy "Admins lezen alle reads"
  on public.announcement_reads for select
  using (is_admin());

drop policy if exists "Iedereen leest announcements" on public.announcements;
drop policy if exists "Leden lezen announcements" on public.announcements;
create policy "Leden lezen announcements"
  on public.announcements for select
  using (is_approved());
