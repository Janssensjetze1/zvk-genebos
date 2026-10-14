-- ─── Automatische meldingen: uitslag binnen en verjaardagen ──────────────────
--
-- Zelfde aanpak als opgave_melding.sql: een cron-job om de vijf minuten kijkt
-- of er iets te melden valt en roept dan de Edge Function send-push aan. Geen
-- gereken met zomer- en wintertijd, en een melding vertrekt hoogstens vijf
-- minuten te laat.
--
--   • Uitslag binnen: zodra het wedstrijdblad van een ZVK-wedstrijd is
--     ingevuld (er staan spelers op), één melding met de score en de scorers.
--     Het blad moet al twee minuten bestaan: het wordt in stappen opgeslagen
--     (spelers, dan doelpunten) en zo kan de admin nog een typfout verbeteren.
--     Tussen 08:00 en 23:00, zodat een late zondagavond nog meetelt.
--   • Verjaardagen: één melding per dag vanaf 09:00 met wie er jarig is.
--
-- VOORAF: dezelfde voorbereiding als opgave_melding.sql (pg_cron, pg_net en de
-- secrets project_url en service_role_key in de Vault). Staat die melding al
-- aan, dan is alles klaar.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Geheugen: wat is al verstuurd? Voorkomt dubbele meldingen.
--   soort 'uitslag-gezien' → sleutel = id van de wedstrijd (blad voor het eerst gezien)
--   soort 'uitslag'        → sleutel = id van de wedstrijd (melding verstuurd)
--   soort 'verjaardag'     → sleutel = datum (YYYY-MM-DD)
create table if not exists public.push_log (
  soort        text not null,
  sleutel      text not null,
  verstuurd_at timestamptz not null default now(),
  primary key (soort, sleutel)
);

-- Enkel de functies hieronder (security definer) komen hier aan
alter table public.push_log enable row level security;

-- Bestaande uitslagen gelden als al gemeld, anders vertrekt bij de eerste run
-- een melding voor elke wedstrijd van het seizoen.
insert into public.push_log (soort, sleutel)
select 'uitslag', m.id::text
  from public.matches m
 where exists (select 1 from public.match_players mp where mp.match_id = m.id)
on conflict do nothing;

-- ─── Hulpfunctie: één push naar iedereen via send-push ───────────────────────
create or replace function public.stuur_push(p_titel text, p_bericht text, p_url text default '/app')
returns void
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_key is null then
    raise warning 'stuur_push: project_url of service_role_key ontbreekt in de vault';
    return;
  end if;

  perform http_post(
    url     := v_url || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body    := jsonb_build_object('title', p_titel, 'body', p_bericht, 'url', p_url)
  );
end;
$$;

revoke all on function public.stuur_push(text, text, text) from public, anon, authenticated;

-- ─── Uitslag binnen ──────────────────────────────────────────────────────────
create or replace function public.verstuur_uitslag_meldingen()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r          record;
  v_nu       timestamp := now() at time zone 'Europe/Brussels';
  v_wij      int;
  v_zij      int;
  v_uitkomst text;
  v_scorers  text;
  v_aantal   int := 0;
begin
  if extract(hour from v_nu) < 8 or extract(hour from v_nu) >= 23 then
    return 0;
  end if;

  -- Stap 1: nieuw ingevulde bladen onthouden
  insert into public.push_log (soort, sleutel)
  select 'uitslag-gezien', m.id::text
    from public.matches m
    join public.teams ht on ht.id = m.home_team_id
    join public.teams at on at.id = m.away_team_id
   where (ht.is_zvk or at.is_zvk)
     and m.date between v_nu::date - 7 and v_nu::date
     and exists (select 1 from public.match_players mp where mp.match_id = m.id)
     and not exists (select 1 from public.push_log l where l.soort = 'uitslag' and l.sleutel = m.id::text)
  on conflict do nothing;

  -- Stap 2: melden wat al minstens twee minuten ingevuld is
  for r in
    select m.id, m.home_score, m.away_score,
           ht.name as thuisploeg, at.name as uitploeg, ht.is_zvk as wij_thuis
      from public.matches m
      join public.teams ht on ht.id = m.home_team_id
      join public.teams at on at.id = m.away_team_id
     where (ht.is_zvk or at.is_zvk)
       -- enkel recente wedstrijden: een oud blad dat later aangevuld wordt, telt niet
       and m.date between v_nu::date - 7 and v_nu::date
       and exists (select 1 from public.match_players mp where mp.match_id = m.id)
       and exists (select 1 from public.push_log l where l.soort = 'uitslag-gezien' and l.sleutel = m.id::text
                     and l.verstuurd_at <= now() - interval '2 minutes')
       and not exists (select 1 from public.push_log l where l.soort = 'uitslag' and l.sleutel = m.id::text)
     order by m.date, m.time
  loop
    v_wij := case when r.wij_thuis then r.home_score else r.away_score end;
    v_zij := case when r.wij_thuis then r.away_score else r.home_score end;
    v_uitkomst := case
      when v_wij > v_zij then 'Gewonnen! 🎉'
      when v_wij < v_zij then 'Verloren.'
      else 'Gelijkspel.'
    end;

    -- "Lander (2), Thomas, Ruben": voornaam, met het aantal bij meer dan één
    select string_agg(case when n > 1 then naam || ' (' || n || ')' else naam end, ', ' order by n desc, naam)
      into v_scorers
      from (
        select split_part(p.name, ' ', 1) as naam, count(*) as n
          from public.goals g
          join public.players p on p.id = g.scorer_id
         where g.match_id = r.id
         group by split_part(p.name, ' ', 1)
      ) s;

    perform public.stuur_push(
      r.thuisploeg || ' ' || coalesce(r.home_score, 0) || '–' || coalesce(r.away_score, 0) || ' ' || r.uitploeg,
      v_uitkomst || coalesce(' Goals: ' || v_scorers || '.', ''),
      '/app/wedstrijd/' || r.id
    );

    insert into public.push_log (soort, sleutel) values ('uitslag', r.id::text) on conflict do nothing;
    v_aantal := v_aantal + 1;
  end loop;

  return v_aantal;
end;
$$;

revoke all on function public.verstuur_uitslag_meldingen() from public, anon, authenticated;

-- ─── Verjaardagen ────────────────────────────────────────────────────────────
create or replace function public.verstuur_verjaardag_melding()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nu       timestamp := now() at time zone 'Europe/Brussels';
  v_vandaag  date := (now() at time zone 'Europe/Brussels')::date;
  v_schrikkel boolean;
  v_namen    text;
  v_aantal   int;
  v_eerste   text;
begin
  -- Vanaf 09:00, één keer per dag (ook als de job om 9 uur even niet liep)
  if extract(hour from v_nu) < 9 or extract(hour from v_nu) >= 21 then
    return 0;
  end if;
  if exists (select 1 from public.push_log where soort = 'verjaardag' and sleutel = v_vandaag::text) then
    return 0;
  end if;

  -- Wie op 29 februari verjaart, viert in een gewoon jaar op 28 februari
  v_schrikkel := extract(day from (make_date(extract(year from v_vandaag)::int, 3, 1) - 1)) = 29;

  with personen as (
    -- Leden met een account (naam en datum uit het profiel, anders de fiche)
    select coalesce(pr.display_name, pl.name) as naam, coalesce(pr.birth_date, pl.birth_date) as geboren
      from public.profiles pr
      left join public.players pl on pl.id = pr.player_id
     where pr.approved
    union
    -- Spelers zonder account
    select pl.name, pl.birth_date
      from public.players pl
     where not exists (select 1 from public.profiles pr where pr.player_id = pl.id)
  ),
  jarig as (
    select naam, extract(year from age(v_vandaag, geboren))::int as leeftijd
      from personen
     where geboren is not null
       and (
         to_char(geboren, 'MM-DD') = to_char(v_vandaag, 'MM-DD')
         or (not v_schrikkel and to_char(geboren, 'MM-DD') = '02-29' and to_char(v_vandaag, 'MM-DD') = '02-28')
       )
  )
  select count(*),
         string_agg(naam || ' (' || leeftijd || ')', ', ' order by naam),
         min(naam || ' ' || leeftijd)
    into v_aantal, v_namen, v_eerste
    from jarig;

  if v_aantal = 1 then
    perform public.stuur_push(
      '🎂 Verjaardag bij ZVK Genebos',
      'Vandaag wordt ' || v_eerste || '. Vergeet niet te feliciteren!',
      '/app'
    );
  elsif v_aantal > 1 then
    perform public.stuur_push(
      '🎂 Feest bij ZVK Genebos',
      'Vandaag jarig: ' || v_namen || '. Vergeet niet te feliciteren!',
      '/app'
    );
  end if;

  -- Ook zonder jarigen: vandaag is afgehandeld
  insert into public.push_log (soort, sleutel) values ('verjaardag', v_vandaag::text) on conflict do nothing;
  return coalesce(v_aantal, 0);
end;
$$;

revoke all on function public.verstuur_verjaardag_melding() from public, anon, authenticated;

-- ─── Planning: om de vijf minuten ───────────────────────────────────────────
select cron.unschedule('automatische-meldingen')
where exists (select 1 from cron.job where jobname = 'automatische-meldingen');

select cron.schedule(
  'automatische-meldingen',
  '*/5 * * * *',
  $job$ select public.verstuur_uitslag_meldingen(); select public.verstuur_verjaardag_melding(); $job$
);

-- Handig om achteraf te controleren:
--   select * from cron.job where jobname = 'automatische-meldingen';
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from public.push_log order by verstuurd_at desc limit 20;
--
-- Meteen testen zonder te wachten (let op: stuurt echt naar iedereen):
--   select public.stuur_push('Test', 'Dit is een testmelding');
