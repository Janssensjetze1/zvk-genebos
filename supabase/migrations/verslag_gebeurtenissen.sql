-- ─── Gebeurtenissen voor het wedstrijdverslag ────────────────────────────────
--
-- Bij het genereren van een verslag kan de admin extra gebeurtenissen meegeven
-- die in het verslag moeten komen ("Thomas miste een penalty", "na de match
-- trakteerde Lander"). Ze worden per wedstrijd bewaard, zodat opnieuw
-- genereren ze niet vergeet. Schrijven gebeurt via de functie
-- generate-match-report (service role) of door een admin (RLS van matches).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.matches
  add column if not exists report_notes text
  check (report_notes is null or char_length(report_notes) <= 1000);
