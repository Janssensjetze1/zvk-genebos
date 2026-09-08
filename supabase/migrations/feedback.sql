-- ─── feedback ─────────────────────────────────────────────────────────────────
--
-- Berichten die spelers via de app insturen (bug, idee of andere).
-- Altijd op naam: user_id verwijst naar het profiel van de ingelogde gebruiker,
-- de naam komt uit profiles.display_name.
--
-- read_at wordt gezet zodra een admin het feedbacktabblad opent. Het aantal
-- rijen met read_at is null is de teller op dat tabblad.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  -- verwijst naar profiles (en dus naar auth.users), zodat de naam mee opgehaald
  -- kan worden via een join
  user_id    uuid not null references public.profiles(id) on delete cascade,
  categorie  text not null check (categorie in ('bug', 'idee', 'andere')),
  bericht    text not null,
  created_at timestamptz not null default now(),
  read_at    timestamptz,

  constraint feedback_bericht_geldig check (char_length(btrim(bericht)) between 1 and 2000)
);

create index if not exists idx_feedback_created_at on public.feedback(created_at desc);
create index if not exists idx_feedback_ongelezen on public.feedback(read_at) where read_at is null;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.feedback enable row level security;

-- Een goedgekeurd lid stuurt feedback in eigen naam
drop policy if exists "Leden sturen feedback" on public.feedback;
create policy "Leden sturen feedback"
  on public.feedback for insert
  with check (is_approved() and user_id = auth.uid());

-- Je ziet je eigen berichten terug, die van anderen niet
drop policy if exists "Eigen feedback lezen" on public.feedback;
create policy "Eigen feedback lezen"
  on public.feedback for select
  using (user_id = auth.uid());

-- Admins lezen en beheren alles
drop policy if exists "Admins beheren feedback" on public.feedback;
create policy "Admins beheren feedback"
  on public.feedback for all
  using (is_admin())
  with check (is_admin());
