-- ─── Automatische melding wanneer de opgave opengaat ─────────────────────────
--
-- De opgave "opent" niet door een gebeurtenis: ze is gewoon open zodra de klok
-- voorbij het moment uit opgave_opent_op() staat. Er is dus niets dat afgaat.
-- Daarom draait er om de vijf minuten een cron-job die kijkt welke wedstrijden
-- sindsdien opengegaan zijn en daarvoor één push verstuurt.
--
-- Om de vijf minuten pollen in plaats van één keer op het juiste uur is bewust:
-- zo is er geen gereken met zomer- en wintertijd, en valt de melding hoogstens
-- vijf minuten na de opening. De query is klein genoeg om dat te dragen.
-- De job stuurt alleen tussen 08:00 en 21:00 (Brussel), zodat een wedstrijd die
-- een admin 's nachts vervroegd openzet niemand uit bed belt.
--
-- VOORAF, eenmalig in Supabase:
--   1. Extensies pg_cron en pg_net aanzetten (Dashboard → Database → Extensions)
--   2. Twee secrets in de Vault (Dashboard → Project Settings → Vault):
--        project_url        →  https://<project-ref>.supabase.co
--        service_role_key   →  de service_role key uit de API-instellingen
--      De sleutel staat bewust NIET in dit bestand — dit bestand zit in git.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Geheugen: welke wedstrijd kreeg al een melding? Voorkomt dubbele meldingen.
alter table public.matches
  add column if not exists opgave_melding_at timestamptz;

comment on column public.matches.opgave_melding_at is
  'Moment waarop de automatische "opgave open"-melding verstuurd is. Null = nog niet verstuurd.';

-- ─── De job zelf ─────────────────────────────────────────────────────────────
create or replace function public.verstuur_opgave_meldingen()
returns integer
language plpgsql
security definer
-- net staat er bij omdat pg_net in 'net' of in 'extensions' kan zitten,
-- afhankelijk van hoe het project is aangemaakt. Daarom hieronder http_post()
-- zonder schema-prefix.
set search_path = public, extensions, net, vault
as $$
declare
  r          record;
  v_url      text;
  v_key      text;
  v_uur      int;
  v_verzonden int := 0;
begin
  -- Niet 's nachts versturen
  v_uur := extract(hour from (now() at time zone 'Europe/Brussels'))::int;
  if v_uur < 8 or v_uur >= 21 then
    return 0;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    raise warning 'verstuur_opgave_meldingen: project_url of service_role_key ontbreekt in de vault';
    return 0;
  end if;

  for r in
    select m.id,
           case when ht.is_zvk then at.name else ht.name end as tegenstander
      from public.matches m
      join public.teams ht on ht.id = m.home_team_id
      join public.teams at on at.id = m.away_team_id
     where m.opgave_melding_at is null           -- nog geen melding gehad
       and m.date >= current_date                -- niet met terugwerkende kracht
       and (ht.is_zvk or at.is_zvk)              -- enkel wedstrijden van ons
       and public.opgave_opent_op(m.id) <= now() -- opgave staat open
     order by m.date, m.time
  loop
    perform http_post(
      url     := v_url || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body    := jsonb_build_object(
        'title', 'Opgave open ⚽',
        'body',  'Je kan je nu aanmelden voor de wedstrijd tegen ' || coalesce(r.tegenstander, 'de tegenstander'),
        'url',   '/app'
      )
    );

    -- pg_net verstuurt asynchroon; we markeren meteen zodat er hoe dan ook
    -- nooit een tweede melding voor dezelfde wedstrijd vertrekt.
    update public.matches set opgave_melding_at = now() where id = r.id;
    v_verzonden := v_verzonden + 1;
  end loop;

  return v_verzonden;
end;
$$;

revoke all on function public.verstuur_opgave_meldingen() from public, anon, authenticated;

-- ─── Planning: om de vijf minuten ───────────────────────────────────────────
select cron.unschedule('opgave-melding')
where exists (select 1 from cron.job where jobname = 'opgave-melding');

select cron.schedule(
  'opgave-melding',
  '*/5 * * * *',
  $job$ select public.verstuur_opgave_meldingen(); $job$
);

-- Handig om achteraf te controleren:
--   select * from cron.job where jobname = 'opgave-melding';
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select id, date, opgave_melding_at from public.matches order by date desc limit 10;
