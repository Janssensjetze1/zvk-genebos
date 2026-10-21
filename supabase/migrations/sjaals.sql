-- VERVANGEN door fanshop.sql (2026-10-21): die zet de sjaal om naar een product
-- in de fanshop en verwijdert deze tabellen. Enkel bewaard als geschiedenis.

-- ─── sjaals ───────────────────────────────────────────────────────────────────
--
-- Leden bestellen een ZVK-sjaal via de app. Betalen gebeurt buiten de app
-- (cash of overschrijving); een admin vinkt aan wie betaald heeft en wie zijn
-- sjaal al kreeg.
--
-- sjaal_instellingen heeft precies één rij: prijs, foto, of het bestellen open
-- staat en eventueel een maximum per lid. Enkel een admin past die aan.
--
-- sjaal_bestellingen: één bestelling per lid (unieke user_id), met een aantal.
-- Zolang het bestellen open staat en er nog niet betaald is, mag het lid zijn
-- bestelling wijzigen of annuleren. betaald_at en afgegeven_at zijn van de admin.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.sjaal_instellingen (
  id          boolean primary key default true check (id),
  prijs       numeric(6,2) not null default 0 check (prijs >= 0),
  open        boolean not null default false,
  max_per_lid int check (max_per_lid is null or max_per_lid between 1 and 20),
  foto_url    text,
  uitleg      text check (uitleg is null or char_length(uitleg) <= 1000),
  updated_at  timestamptz not null default now()
);

insert into public.sjaal_instellingen (id) values (true) on conflict (id) do nothing;

create table if not exists public.sjaal_bestellingen (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.profiles(id) on delete cascade,
  aantal       int not null check (aantal between 1 and 20),
  opmerking    text check (opmerking is null or char_length(opmerking) <= 500),
  betaald_at   timestamptz,
  afgegeven_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_sjaal_bestellingen_onbetaald on public.sjaal_bestellingen(betaald_at) where betaald_at is null;

-- Staat het bestellen open? Security definer, zodat de policies het kunnen lezen.
create or replace function public.sjaal_bestellen_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select open from sjaal_instellingen where id), false);
$$;

-- Een lid mag betaald_at en afgegeven_at niet zelf zetten, en niet meer
-- bestellen dan het maximum per lid. Admins (en het dashboard) mogen alles.
create or replace function public.check_sjaal_bestelling()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  maximum int;
begin
  new.updated_at := now();

  -- auth.uid() is leeg bij werk vanuit het dashboard of de service role
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.betaald_at is not null or new.afgegeven_at is not null then
      raise exception 'Enkel een admin duidt betaald of afgegeven aan';
    end if;
  else
    if new.betaald_at is distinct from old.betaald_at
       or new.afgegeven_at is distinct from old.afgegeven_at
       or new.user_id is distinct from old.user_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Enkel een admin duidt betaald of afgegeven aan';
    end if;
  end if;

  select max_per_lid into maximum from sjaal_instellingen where id;
  if maximum is not null and new.aantal > maximum then
    raise exception 'Je kan maximaal % sjaals bestellen', maximum;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_sjaal_bestelling on public.sjaal_bestellingen;
create trigger trg_check_sjaal_bestelling
  before insert or update on public.sjaal_bestellingen
  for each row execute function public.check_sjaal_bestelling();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.sjaal_instellingen enable row level security;
alter table public.sjaal_bestellingen enable row level security;

-- Elk goedgekeurd lid leest prijs, foto en of het bestellen open staat
drop policy if exists "Leden lezen sjaalinstellingen" on public.sjaal_instellingen;
create policy "Leden lezen sjaalinstellingen"
  on public.sjaal_instellingen for select
  using (is_approved());

drop policy if exists "Admins beheren sjaalinstellingen" on public.sjaal_instellingen;
create policy "Admins beheren sjaalinstellingen"
  on public.sjaal_instellingen for all
  using (is_admin())
  with check (is_admin());

-- Je ziet enkel je eigen bestelling
drop policy if exists "Eigen sjaalbestelling lezen" on public.sjaal_bestellingen;
create policy "Eigen sjaalbestelling lezen"
  on public.sjaal_bestellingen for select
  using (user_id = auth.uid());

-- Bestellen, wijzigen en annuleren zolang het open staat en er niet betaald is
drop policy if exists "Leden bestellen sjaals" on public.sjaal_bestellingen;
create policy "Leden bestellen sjaals"
  on public.sjaal_bestellingen for insert
  with check (is_approved() and user_id = auth.uid() and sjaal_bestellen_open());

drop policy if exists "Leden wijzigen eigen sjaalbestelling" on public.sjaal_bestellingen;
create policy "Leden wijzigen eigen sjaalbestelling"
  on public.sjaal_bestellingen for update
  using (user_id = auth.uid() and sjaal_bestellen_open() and betaald_at is null)
  with check (user_id = auth.uid() and sjaal_bestellen_open());

drop policy if exists "Leden annuleren eigen sjaalbestelling" on public.sjaal_bestellingen;
create policy "Leden annuleren eigen sjaalbestelling"
  on public.sjaal_bestellingen for delete
  using (user_id = auth.uid() and sjaal_bestellen_open() and betaald_at is null);

-- Admins lezen en beheren alles
drop policy if exists "Admins beheren sjaalbestellingen" on public.sjaal_bestellingen;
create policy "Admins beheren sjaalbestellingen"
  on public.sjaal_bestellingen for all
  using (is_admin())
  with check (is_admin());

-- ─── Rechten ─────────────────────────────────────────────────────────────────
-- De triggerfunctie hoeft niemand rechtstreeks aan te roepen; sjaal_bestellen_open
-- is nodig voor ingelogde leden omdat de policies ze gebruiken.
revoke execute on function public.check_sjaal_bestelling() from public, anon, authenticated;
revoke execute on function public.sjaal_bestellen_open() from public, anon;
