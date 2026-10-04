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
  return datumISO(new Date())
}

function datumISO(d) {
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

const isZvk = w => !!(w?.home_team?.is_zvk || w?.away_team?.is_zvk)

// Het weekend dat eraan komt: vrijdag tot en met zondag. Van maandag tot
// donderdag is dat het eerstvolgende weekend, vanaf vrijdag het lopende.
export function weekendBereik(nu = new Date()) {
  const dag = nu.getDay() // 0 = zondag
  const totVrijdag = dag === 0 ? -2 : dag === 6 ? -1 : 5 - dag
  const vrijdag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + totVrijdag)
  const zondag = new Date(vrijdag.getFullYear(), vrijdag.getMonth(), vrijdag.getDate() + 2)
  return { van: datumISO(vrijdag), tot: datumISO(zondag), bezig: totVrijdag <= 0 }
}

// Alle wedstrijden van dat weekend, ook die van de andere ploegen.
// Chronologisch, met onze match eerst als er meerdere op hetzelfde uur vallen.
export function weekendWedstrijden(wedstrijden) {
  const { van, tot, bezig } = weekendBereik()
  const lijst = (wedstrijden ?? [])
    .filter(w => w.date >= van && w.date <= tot)
    .sort((a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? '99').localeCompare(b.time ?? '99') ||
      Number(isZvk(b)) - Number(isZvk(a))
    )
  return { titel: bezig ? 'Dit weekend' : 'Komend weekend', lijst }
}

// Uitslagen van wedstrijden waar ZVK niet in meespeelt, meest recente eerst.
export function andereUitslagen(wedstrijden) {
  return (wedstrijden ?? [])
    .filter(w => !isZvk(w) && isGespeeld(w))
    .sort((a, b) => b.date.localeCompare(a.date) || (a.time ?? '99').localeCompare(b.time ?? '99'))
}

// Wat de andere ploegen nog moeten spelen, chronologisch.
export function andereProgramma(wedstrijden) {
  return (wedstrijden ?? [])
    .filter(w => !isZvk(w) && !isGespeeld(w))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99'))
}
