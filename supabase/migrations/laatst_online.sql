-- ─── Wanneer was een lid voor het laatst online? ─────────────────────────────
--
-- auth.users.last_sign_in_at zegt weinig: een sessie blijft maanden geldig, dus
-- dat is de datum waarop iemand zijn wachtwoord voor het laatst intikte, niet
-- wanneer hij de app nog gebruikte. Daarom houdt profiles.last_seen bij wanneer
-- de app voor het laatst geopend werd. De frontend werkt die kolom bij bij het
-- starten van de app, hoogstens een keer per kwartier (zie AuthContext.jsx).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists last_seen timestamptz;

comment on column public.profiles.last_seen is
  'Laatste keer dat dit lid de app opende. Wordt door de app zelf bijgewerkt, hoogstens een keer per kwartier.';

create index if not exists idx_profiles_last_seen
  on public.profiles (last_seen desc nulls last);
