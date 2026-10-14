// De onderdelen van het beheer, gedeeld door desktop (Admin.jsx) en de app
// (PWABeheer.jsx). Een nieuw onderdeel voeg je enkel hier toe.
//   teller: sleutel uit useBeheerTellers, getoond als badge naast het label

export const ONDERDELEN = [
  { id: 'leden',       label: 'Ledenbeheer', icon: 'leden',      groep: 'Ploeg',        uitleg: 'Goedkeuren, rollen en koppelen aan een fiche', teller: 'wachtendeLeden', tellerKleur: 'var(--z-blauw)' },
  { id: 'spelers',     label: 'Spelers',     icon: 'shirt',      groep: 'Ploeg',        uitleg: 'Spelersfiches en badges' },
  { id: 'teams',       label: 'Teams',       icon: 'schild',     groep: 'Ploeg',        uitleg: 'Ploegen in de competitie' },
  { id: 'wedstrijden', label: 'Wedstrijden', icon: 'bal',        groep: 'Competitie',   uitleg: 'Programma, uitslagen en wedstrijdbladen', teller: 'bladOntbreekt', tellerKleur: 'var(--z-goud)' },
  { id: 'seizoen',     label: 'Seizoenen',   icon: 'kalender',   groep: 'Competitie',   uitleg: 'Seizoenen aanmaken en archiveren' },
  { id: 'meldingen',   label: 'Meldingen',   icon: 'bel',        groep: 'Communicatie', uitleg: 'Popups en pushmeldingen' },
  { id: 'quotes',      label: 'Quotes',      icon: 'citaat',     groep: 'Communicatie', uitleg: 'Quotes op het startscherm' },
  { id: 'feedback',    label: 'Feedback',    icon: 'inbox',      groep: 'Communicatie', uitleg: 'Berichten van de leden', teller: 'ongelezenFeedback', tellerKleur: 'var(--z-paars)' },
  { id: 'gebruik',     label: 'Gebruik',     icon: 'klassement', groep: 'Inzicht',      uitleg: 'Wie gebruikt de app en hoe' },
  { id: 'database',    label: 'Database',    icon: 'archief',    groep: 'Inzicht',      uitleg: 'Schema van alle tabellen' },
]

export const GROEPEN = ['Ploeg', 'Competitie', 'Communicatie', 'Inzicht']
