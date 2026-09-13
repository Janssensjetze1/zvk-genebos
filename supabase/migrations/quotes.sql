-- ─── quotes ───────────────────────────────────────────────────────────────────
--
-- De "Quote of the day" op de laadpagina (PWASplashScreen en ProtectedRoute).
-- Stonden vroeger hardgecodeerd in src/pwa/PWASplashScreen.jsx; die lijst blijft
-- in de code staan als terugval zolang de tabel leeg of onbereikbaar is.
--
-- actief = false haalt een quote uit de rotatie zonder ze te verliezen.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  tekst      text not null,
  auteur     text not null,
  actief     boolean not null default true,
  created_at timestamptz not null default now(),

  constraint quotes_tekst_geldig  check (char_length(btrim(tekst))  between 1 and 1000),
  constraint quotes_auteur_geldig check (char_length(btrim(auteur)) between 1 and 100)
);

create index if not exists idx_quotes_actief on public.quotes(actief) where actief;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.quotes enable row level security;

-- Elk goedgekeurd lid leest de quotes (de laadpagina toont ze)
drop policy if exists "Leden lezen quotes" on public.quotes;
create policy "Leden lezen quotes"
  on public.quotes for select
  using (is_approved());

-- Enkel admins voegen toe, wijzigen of verwijderen
drop policy if exists "Admins beheren quotes" on public.quotes;
create policy "Admins beheren quotes"
  on public.quotes for all
  using (is_admin())
  with check (is_admin());

-- ─── Startlijst ──────────────────────────────────────────────────────────────
-- Enkel invoegen zolang de tabel nog leeg is, zodat dit script veilig opnieuw
-- kan draaien zonder dubbels te maken.
insert into public.quotes (tekst, auteur)
select * from (values
  ($q$Voetbal is simpel, maar het moeilijkste da er is, is simpel voetballen.$q$, $q$Johan Cruijff$q$),
  ($q$Kampioen , we pakken de beker ok nog!$q$, $q$Dretze$q$),
  ($q$Burgemeester de Bie,beter wordt het nie.$q$, $q$Nicole$q$),
  ($q$zoals ZVK’ers tegenwoordig doen won ik die wedstrijd $q$, $q$Lander Engelen$q$),
  ($q$Ik mut een wijf hemme om te daanse.$q$, $q$Frank Den voorzitter$q$),
  ($q$Nog een kleine fun fact: al die lichte maaltijden hebben me niet geholpen, heb quasi heel de namiddag op het kleinste kamertje gezeten$q$, $q$Lander Engelen$q$),
  ($q$Match gedaan, beker de lucht in, bubbels van de voorzitter opdrinken en een goei lange nabespreking in de Kantin. Gelukkig is het nog ni gedaan voor dit jaar, den DUBBEL is nog een optie. Den Antwaaarp deed het ons vorig seizoen voor. Zeer benieuwd of de gouden generatie zich hiervoor nog opgeladen krijgt.. Iedereen is bang van Genebos, nu ook tijdens de match$q$, $q$Dretze$q$),
  ($q$Voetbal is ne godsdienst en het stadion is onze kerk.$q$, $q$Pep Guardiola$q$),
  ($q$Mijne zondag begon zoals elke zondag bij mij, goed uitslapen zoals het hoort en een beetje bekomen van de lange nacht die ik tegenmoed was gegaan$q$, $q$Jean$q$),
  ($q$Had ik nog zoveel moeten eten veu zowe een match.. Das nie het slimste idee dak had$q$, $q$Luyte$q$),
  ($q$Ik heb wel op de deklat gesjot eh$q$, $q$Dretze$q$),
  ($q$J'ai soif.$q$, $q$Dretze$q$),
  ($q$Er werd weer verdedigd als janetten.$q$, $q$De ZVK Supporters$q$),
  ($q$Dit jaar spelen we kampioen.$q$, $q$Dretze$q$),
  ($q$Dieje he teveel deklatjuice gedronken$q$, $q$Werres$q$),
  ($q$Smakelijk Johan$q$, $q$Chris Mulkers$q$)
) as startlijst(tekst, auteur)
where not exists (select 1 from public.quotes);
