-- ─── player_badges ────────────────────────────────────────────────────────────
--
-- Slaat handmatig toegekende of event-gedreven badges op.
-- Stats-badges worden on-the-fly berekend uit goals/match_players.
-- Deze tabel is voor badges die NIET puur uit stats volgen, zoals:
--   • Speciale beloningen (admin kent toe)
--   • Event-badges ("aanwezig op clubfeest")
--   • Milestone-badges met een precieze datum
--   • Toekomstige webhook/trigger-gebaseerde badges
--
-- badge_id verwijst naar het 'id' veld in src/data/badges.js.
-- Een badge wordt als "verdiend" beschouwd als:
--   (1) de stats-conditie true retourneert, OF
--   (2) er een rij bestaat in deze tabel voor de speler + badge_id.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.player_badges (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,
  badge_id    text not null,
  earned_at   timestamptz not null default now(),
  notes       text,                        -- optionele admin-notitie
  awarded_by  uuid references auth.users(id) on delete set null,  -- wie kende toe

  constraint player_badges_unique unique (player_id, badge_id)
);

-- Index voor snelle lookup per speler
create index if not exists idx_player_badges_player_id on public.player_badges(player_id);

-- RLS: iedereen mag zijn eigen badges lezen; alleen admins mogen schrijven
alter table public.player_badges enable row level security;

create policy "Spelers kunnen eigen badges zien"
  on public.player_badges for select
  using (
    player_id in (
      select player_id from public.profiles where id = auth.uid()
    )
  );

create policy "Admins kunnen badges toekennen"
  on public.player_badges for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins kunnen badges verwijderen"
  on public.player_badges for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
