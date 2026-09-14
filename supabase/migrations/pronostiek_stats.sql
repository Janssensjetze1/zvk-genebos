-- ─── Pronostiekstatistieken per lid (voor de badges) ─────────────────────────
--
-- De badges werken op spelers (player_id), maar aan de pronostiek doet iedereen
-- mee — ook leden zonder spelersfiche. Deze view geeft per gebruiker de totalen
-- over alle seizoenen heen, met player_id erbij als het account aan een speler
-- hangt. Zo kan SpelerDetail de pronostiekbadges van een ploegmaat tonen zonder
-- dat leden elkaars profiel moeten kunnen lezen (de view draait als eigenaar).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.pronostiek_stats as
select s.user_id,
       pr.player_id,
       max(s.naam)                        as naam,
       count(*)                           as voorspellingen,
       count(*) filter (where s.is_exact) as exacte,
       count(*) filter (where s.durfbonus) as durfbonussen,
       sum(s.punten)                      as punten
from public.pronostiek_scores s
left join public.profiles pr on pr.id = s.user_id
group by s.user_id, pr.player_id;

grant select on public.pronostiek_stats to authenticated;
