-- ─── Een lid mag zijn eigen rol niet zetten ─────────────────────────────────
--
-- In schema.sql staat enkel "eigen profiel lezen" en "admins beheren alles".
-- Toch werken de account- en onboardingpagina, dus er staat in de database een
-- update-policy die niet in de repo zit. Zo'n policy is meestal
-- `for update using (auth.uid() = id)`, en die geldt voor de héle rij: een lid
-- kan dan via de API ook `role` op 'admin' zetten of zichzelf goedkeuren.
--
-- Deze trigger sluit dat af, los van welke policy er staat. Hij laat door wat
-- iemand over zichzelf mag wijzigen (naam, foto) en blokkeert de rest.
-- Admins en aanroepen met de service-role sleutel (auth.uid() is null, zoals
-- de edge functions) blijven alles kunnen.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.beveilig_profiel_velden()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.approved is distinct from old.approved
     or new.player_id is distinct from old.player_id then
    raise exception 'Je kan je rol, goedkeuring of spelersfiche niet zelf aanpassen'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_beveilig_profiel on public.profiles;
create trigger trg_beveilig_profiel
  before update on public.profiles
  for each row execute function public.beveilig_profiel_velden();
