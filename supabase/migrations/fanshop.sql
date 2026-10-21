-- ─── fanshop ──────────────────────────────────────────────────────────────────
--
-- De ZVK-fanshop: leden bestellen merchandise (eerst de sjaal, later meer) via
-- de app. Betalen gebeurt buiten de app (cash of overschrijving); een admin
-- vinkt aan wat betaald en afgegeven is.
--
-- Vervangt sjaals.sql (sjaal_instellingen + sjaal_bestellingen). Die tabellen
-- waren nog leeg; de prijs van de sjaal en of het bestellen open stond, gaan mee.
--
-- shop_instellingen  één rij: staat de winkel open, en een algemene uitleg
-- shop_producten     wat er te koop is, met prijs, foto, optionele maten en
--                    een optioneel maximum per lid. actief = false haalt een
--                    product uit de winkel zonder de bestellingen te verliezen.
-- shop_bestellingen  één regel per lid, product en maat. De prijs wordt bij het
--                    bestellen vastgelegd, zodat een latere prijswijziging
--                    bestaande bestellingen niet verandert.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.shop_instellingen (
  id         boolean primary key default true check (id),
  open       boolean not null default false,
  uitleg     text check (uitleg is null or char_length(uitleg) <= 1000),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_producten (
  id          uuid primary key default gen_random_uuid(),
  naam        text not null check (char_length(btrim(naam)) between 1 and 80),
  omschrijving text check (omschrijving is null or char_length(omschrijving) <= 1000),
  prijs       numeric(6,2) not null default 0 check (prijs >= 0),
  foto_url    text,
  -- leeg = geen maten (bv. een sjaal); anders bv. {S,M,L,XL}
  maten       text[] not null default '{}',
  max_per_lid int check (max_per_lid is null or max_per_lid between 1 and 50),
  actief      boolean not null default true,
  volgorde    int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.shop_bestellingen (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  -- restrict: een product met bestellingen zet je op inactief in plaats van te wissen
  product_id   uuid not null references public.shop_producten(id) on delete restrict,
  maat         text not null default '',
  aantal       int not null check (aantal between 1 and 50),
  prijs        numeric(6,2) not null default 0,
  opmerking    text check (opmerking is null or char_length(opmerking) <= 500),
  betaald_at   timestamptz,
  afgegeven_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (user_id, product_id, maat)
);

create index if not exists idx_shop_bestellingen_product on public.shop_bestellingen(product_id);
create index if not exists idx_shop_bestellingen_onbetaald on public.shop_bestellingen(betaald_at) where betaald_at is null;

-- ─── Overzetten van de sjaal ─────────────────────────────────────────────────
insert into public.shop_instellingen (id, open)
values (true, coalesce((select open from public.sjaal_instellingen where id), false))
on conflict (id) do nothing;

insert into public.shop_producten (naam, prijs, foto_url, max_per_lid, omschrijving)
select 'ZVK-sjaal',
       coalesce((select prijs from public.sjaal_instellingen where id), 0),
       (select foto_url from public.sjaal_instellingen where id),
       (select max_per_lid from public.sjaal_instellingen where id),
       (select uitleg from public.sjaal_instellingen where id)
where not exists (select 1 from public.shop_producten);

drop table if exists public.sjaal_bestellingen;
drop table if exists public.sjaal_instellingen;
drop function if exists public.check_sjaal_bestelling();
drop function if exists public.sjaal_bestellen_open();

-- ─── Functies ────────────────────────────────────────────────────────────────

-- Staat de winkel open? Security definer, zodat de policies het kunnen lezen.
create or replace function public.shop_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select open from shop_instellingen where id), false);
$$;

-- Voor leden: product moet actief zijn, maat moet bestaan, maximum per lid
-- (over alle maten samen) wordt gerespecteerd, de prijs komt uit het product,
-- en betaald/afgegeven blijven van de admin. Admins (en het dashboard) mogen alles.
create or replace function public.check_shop_bestelling()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p shop_producten;
  elders int;
begin
  new.updated_at := now();

  select * into p from shop_producten where id = new.product_id;

  if tg_op = 'INSERT' and new.prijs = 0 then
    new.prijs := p.prijs;
  end if;

  -- auth.uid() is leeg bij werk vanuit het dashboard of de service role
  if is_admin() or auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.betaald_at is not null or new.afgegeven_at is not null then
      raise exception 'Enkel een admin duidt betaald of afgegeven aan';
    end if;
    if not p.actief then
      raise exception 'Dit product is niet meer te koop';
    end if;
    new.prijs := p.prijs;
  else
    if new.betaald_at is distinct from old.betaald_at
       or new.afgegeven_at is distinct from old.afgegeven_at
       or new.user_id is distinct from old.user_id
       or new.product_id is distinct from old.product_id
       or new.maat is distinct from old.maat
       or new.prijs is distinct from old.prijs
       or new.created_at is distinct from old.created_at then
      raise exception 'Je kan enkel het aantal en de opmerking wijzigen';
    end if;
  end if;

  if cardinality(p.maten) = 0 then
    if new.maat <> '' then
      raise exception 'Dit product heeft geen maten';
    end if;
  elsif not (new.maat = any(p.maten)) then
    raise exception 'Kies een geldige maat';
  end if;

  if p.max_per_lid is not null then
    select coalesce(sum(aantal), 0) into elders
    from shop_bestellingen
    where user_id = new.user_id and product_id = new.product_id and id <> new.id;
    if elders + new.aantal > p.max_per_lid then
      raise exception 'Je kan maximaal % stuks van dit product bestellen', p.max_per_lid;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_shop_bestelling on public.shop_bestellingen;
create trigger trg_check_shop_bestelling
  before insert or update on public.shop_bestellingen
  for each row execute function public.check_shop_bestelling();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.shop_instellingen enable row level security;
alter table public.shop_producten enable row level security;
alter table public.shop_bestellingen enable row level security;

drop policy if exists "Leden lezen shopinstellingen" on public.shop_instellingen;
create policy "Leden lezen shopinstellingen"
  on public.shop_instellingen for select
  using (is_approved());

drop policy if exists "Admins beheren shopinstellingen" on public.shop_instellingen;
create policy "Admins beheren shopinstellingen"
  on public.shop_instellingen for all
  using (is_admin())
  with check (is_admin());

-- Leden zien alle producten; de app toont enkel de actieve, plus inactieve
-- waarvan je nog een bestelling hebt
drop policy if exists "Leden lezen producten" on public.shop_producten;
create policy "Leden lezen producten"
  on public.shop_producten for select
  using (is_approved());

drop policy if exists "Admins beheren producten" on public.shop_producten;
create policy "Admins beheren producten"
  on public.shop_producten for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "Eigen bestellingen lezen" on public.shop_bestellingen;
create policy "Eigen bestellingen lezen"
  on public.shop_bestellingen for select
  using (user_id = auth.uid());

drop policy if exists "Leden bestellen" on public.shop_bestellingen;
create policy "Leden bestellen"
  on public.shop_bestellingen for insert
  with check (is_approved() and user_id = auth.uid() and shop_open());

drop policy if exists "Leden wijzigen eigen bestelling" on public.shop_bestellingen;
create policy "Leden wijzigen eigen bestelling"
  on public.shop_bestellingen for update
  using (user_id = auth.uid() and shop_open() and betaald_at is null)
  with check (user_id = auth.uid() and shop_open());

drop policy if exists "Leden annuleren eigen bestelling" on public.shop_bestellingen;
create policy "Leden annuleren eigen bestelling"
  on public.shop_bestellingen for delete
  using (user_id = auth.uid() and shop_open() and betaald_at is null);

drop policy if exists "Admins beheren bestellingen" on public.shop_bestellingen;
create policy "Admins beheren bestellingen"
  on public.shop_bestellingen for all
  using (is_admin())
  with check (is_admin());

-- ─── Rechten ─────────────────────────────────────────────────────────────────
-- De triggerfunctie hoeft niemand rechtstreeks aan te roepen; shop_open is
-- nodig voor ingelogde leden omdat de policies ze gebruiken.
revoke execute on function public.check_shop_bestelling() from public, anon, authenticated;
revoke execute on function public.shop_open() from public, anon;
