// Eén bron van waarheid voor "is deze wedstrijd al gespeeld?".
//
// De datum alleen volstaat niet: een wedstrijd van vandaag werd vroeger als
// "aankomend" beschouwd, waardoor een net ingevuld wedstrijdblad nergens
// meetelde (klassement, uitslagen, stats). Omgekeerd mag een wedstrijd van
// vandaag die nog moet beginnen niet als 0-0 gelijkspel in het klassement
// belanden. Daarom: datum in het verleden = gespeeld, datum vandaag = enkel
// gespeeld zodra het wedstrijdblad is ingevuld.

// Datum van vandaag als 'YYYY-MM-DD' in de lokale tijdzone.
// (new Date().toISOString() geeft UTC en zit er 's nachts een dag naast.)
export function vandaagISO() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// Is het wedstrijdblad ingevuld? Een score anders dan 0-0, geregistreerde
// spelers of doelpunten wijzen daar allemaal op.
export function heeftResultaat(w) {
  if (!w) return false
  if ((w.home_score ?? 0) > 0 || (w.away_score ?? 0) > 0) return true
  if (w.match_players?.length > 0) return true
  if (w.goals?.length > 0) return true
  return false
}

export function isGespeeld(w) {
  if (!w?.date) return false
  const vandaag = vandaagISO()
  if (w.date < vandaag) return true
  if (w.date > vandaag) return false
  return heeftResultaat(w)
}

// Handig als tegenhanger: staat nog op de kalender.
export function isAankomend(w) {
  return !!w?.date && !isGespeeld(w)
}
