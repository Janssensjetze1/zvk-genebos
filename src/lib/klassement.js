import { isGespeeld } from './wedstrijd'

// Stand berekenen uit de wedstrijden: 3 punten voor winst, 1 voor gelijk.
// Bij gelijke punten telt het doelsaldo, dan het aantal gemaakte doelpunten.
// vorm: de laatste vijf uitslagen, oudste eerst ('W' | 'G' | 'V').
export function berekenKlassement(teams, wedstrijden, type = 'competitie') {
  const stand = {}
  for (const t of teams ?? []) {
    stand[t.id] = {
      id: t.id, name: t.name, is_zvk: t.is_zvk,
      gespeeld: 0, gewonnen: 0, gelijk: 0, verloren: 0, voor: 0, tegen: 0, punten: 0, uitslagen: [],
    }
  }

  const gespeeld = (wedstrijden ?? [])
    .filter(w => w.type === type && w.home_team && w.away_team && isGespeeld(w))
    .filter(w => w.home_score != null && w.away_score != null)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))

  for (const w of gespeeld) {
    const thuis = stand[w.home_team.id]
    const uit = stand[w.away_team.id]
    if (!thuis || !uit) continue
    thuis.gespeeld++; uit.gespeeld++
    thuis.voor += w.home_score; thuis.tegen += w.away_score
    uit.voor += w.away_score; uit.tegen += w.home_score
    if (w.home_score > w.away_score) {
      thuis.gewonnen++; thuis.punten += 3; uit.verloren++
      thuis.uitslagen.push('W'); uit.uitslagen.push('V')
    } else if (w.home_score < w.away_score) {
      uit.gewonnen++; uit.punten += 3; thuis.verloren++
      thuis.uitslagen.push('V'); uit.uitslagen.push('W')
    } else {
      thuis.gelijk++; uit.gelijk++; thuis.punten++; uit.punten++
      thuis.uitslagen.push('G'); uit.uitslagen.push('G')
    }
  }

  return Object.values(stand)
    .map(t => ({ ...t, saldo: t.voor - t.tegen, vorm: t.uitslagen.slice(-5) }))
    .sort((a, b) => b.punten - a.punten || b.saldo - a.saldo || b.voor - a.voor || a.name.localeCompare(b.name))
}
