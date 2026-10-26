-- ─── MVP aanduiden ───────────────────────────────────────────────────────────
--
-- Een admin kan per wedstrijd zelf de MVP aanduiden (matches.mvp_player_id),
-- bijvoorbeeld als er niet gestemd werd. Die keuze gaat voor op de stemming
-- (Jetze, 2026-10-26). mvp_uitslag krijgt daarvoor de kolom gekozen.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.matches
  add column if not exists mvp_player_id uuid references public.players(id) on delete set null;

create or replace view public.mvp_uitslag as
with telling as (
  select s.match_id, s.player_id, count(*)::int as stemmen
  from public.mvp_stemmen s
  where now() >= public.mvp_sluit_op(s.match_id)
  group by s.match_id, s.player_id
),
keuze as (
  select id as match_id, mvp_player_id as player_id
  from public.matches
  where mvp_player_id is not null
),
rijen as (
  select coalesce(t.match_id, k.match_id) as match_id,
         coalesce(t.player_id, k.player_id) as player_id,
         coalesce(t.stemmen, 0) as stemmen
  from telling t
  full join keuze k on k.match_id = t.match_id and k.player_id = t.player_id
)
select r.match_id, r.player_id, r.stemmen,
       case when m.mvp_player_id is not null then r.player_id = m.mvp_player_id
            else r.stemmen = max(r.stemmen) over (partition by r.match_id) end as is_mvp,
       m.mvp_player_id is not null as gekozen
from rijen r
join public.matches m on m.id = r.match_id
where public.is_approved();

revoke all on public.mvp_uitslag from anon;
grant select on public.mvp_uitslag to authenticated;

-- ZVK Genebos – Istanbul (18 oktober 2026): Teppe Spruyt
update public.matches
set mvp_player_id = 'cfdbce7e-4e82-4572-9372-f680facb8198'
where id = '3072172a-f09f-4136-bf3a-dea8fa772341';
