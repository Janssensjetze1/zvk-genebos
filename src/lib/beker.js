import { berekenKlassement } from './klassement'
import { isGespeeld } from './wedstrijd'

// De beker: poules met een stand, daarna een knock-outfase. Gedeeld door de
// bekerpagina (BekerOverzicht) en het beheer (TabBeker).
// Database: beker_poules, beker_poule_ploegen, matches.beker_ronde/home_pen/
// away_pen, zie supabase/migrations/beker.sql.

// Knock-outrondes van vroeg naar laat. 'poule' (of leeg) is de poulefase.
export const RONDES = [
  { id: 'achtste', label: 'Achtste finales', kort: '1/8' },
  { id: 'kwart', label: 'Kwartfinales', kort: '1/4' },
  { id: 'halve', label: 'Halve finales', kort: '1/2' },
  { id: 'finale', label: 'Finale', kort: 'Finale' },
]
export const RONDE_LABEL = Object.fromEntries(RONDES.map(r => [r.id, r.label]))

// Welke ronde hoort bij zoveel ploegen in de knock-out
const RONDE_VOOR = { 2: 'finale', 4: 'halve', 8: 'kwart', 16: 'achtste' }

export const isPouleMatch = w => w.type === 'beker' && (!w.beker_ronde || w.beker_ronde === 'poule')
export const isKnockout = w => w.type === 'beker' && !!w.beker_ronde && w.beker_ronde !== 'poule'

// Winnaar van een gespeelde knock-outwedstrijd: de score, en bij een
// gelijkspel de strafschoppen. null zolang dat niet vaststaat.
export function winnaar(w) {
  if (!isGespeeld(w) || w.home_score == null || w.away_score == null) return null
  if (w.home_score !== w.away_score) return w.home_score > w.away_score ? w.home_team_id : w.away_team_id
  if (w.home_pen == null || w.away_pen == null || w.home_pen === w.away_pen) return null
  return w.home_pen > w.away_pen ? w.home_team_id : w.away_team_id
}

export const naPenaltys = w =>
  isGespeeld(w) && w.home_score === w.away_score && w.home_pen != null && w.away_pen != null

// Stand per poule, met dezelfde regels als het klassement (punten, saldo,
// gemaakte goals). Enkel wedstrijden tussen twee ploegen van de poule tellen.
export function pouleStanden(poules, indeling, teams, wedstrijden) {
  return [...poules]
    .sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam))
    .map(p => {
      const ids = new Set(indeling.filter(i => i.poule_id === p.id).map(i => i.team_id))
      const ploegen = teams.filter(t => ids.has(t.id))
      const matchen = wedstrijden.filter(w =>
        isPouleMatch(w) && ids.has(w.home_team_id) && ids.has(w.away_team_id))
      const stand = berekenKlassement(ploegen, matchen, 'beker')
      const klaar = matchen.length > 0 && matchen.every(w => isGespeeld(w))
      return { ...p, stand, matchen, klaar }
    })
}

// Knock-outwedstrijden per ronde, in volgorde van de rondes
export function knockoutRondes(wedstrijden) {
  return RONDES
    .map(r => ({
      ...r,
      matchen: wedstrijden
        .filter(w => w.beker_ronde === r.id)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')),
    }))
    .filter(r => r.matchen.length > 0)
}

// Voorgestelde koppels voor de eerste knock-outronde bij twee poules: de
// eersten tegen de laatst doorgaanden van de andere poule (A1 – B2, B1 – A2;
// bij vier: A1 – B4, A2 – B3, B1 – A4, B2 – A3).
export function voorstelEersteRonde(standen) {
  if (standen.length !== 2) return null
  const [a, b] = standen
  const k = Math.min(a.doorgaan, b.doorgaan)
  const ronde = RONDE_VOOR[k * 2]
  if (!ronde) return null
  const plek = (p, i) => ({ team: p.stand[i], label: `${p.naam}${i + 1}` })
  const koppels = []
  if (k === 1) {
    koppels.push([plek(a, 0), plek(b, 0)])
  } else {
    for (let i = 0; i < k / 2; i++) koppels.push([plek(a, i), plek(b, k - 1 - i)])
    for (let i = 0; i < k / 2; i++) koppels.push([plek(b, i), plek(a, k - 1 - i)])
  }
  return { ronde, koppels }
}

// Volgende ronde: de winnaars van de vorige ronde, twee aan twee
export function voorstelVolgendeRonde(rondes) {
  const laatste = rondes.at(-1)
  if (!laatste || laatste.id === 'finale') return null
  const winnaars = laatste.matchen.map(winnaar)
  if (winnaars.some(w => !w) || winnaars.length < 2) return null
  const volgende = RONDES[RONDES.findIndex(r => r.id === laatste.id) + 1]
  const koppels = []
  for (let i = 0; i + 1 < winnaars.length; i += 2) koppels.push([winnaars[i], winnaars[i + 1]])
  return { ronde: volgende.id, koppels }
}

// Hoe staat ZVK ervoor? { tekst, toon: 'winst' | 'verlies' | 'blauw' }
export function zvkStatus(standen, rondes, zvkId) {
  if (!zvkId) return null
  for (const r of [...rondes].reverse()) {
    const m = r.matchen.find(w => w.home_team_id === zvkId || w.away_team_id === zvkId)
    if (!m) continue
    const w = winnaar(m)
    if (r.id === 'finale' && w === zvkId) return { tekst: 'Bekerwinnaar', toon: 'winst' }
    if (w && w !== zvkId) return { tekst: `Uitgeschakeld in de ${r.id === 'finale' ? 'finale' : r.label.toLowerCase().replace(/s$/, '')}`, toon: 'verlies' }
    if (r.id === 'finale') return { tekst: 'In de finale', toon: 'winst' }
    return { tekst: 'Nog in de race', toon: 'blauw' }
  }
  const poule = standen.find(p => p.stand.some(t => t.id === zvkId))
  if (!poule) return null
  const plaats = poule.stand.findIndex(t => t.id === zvkId)
  if (poule.klaar && plaats >= poule.doorgaan) return { tekst: 'Uitgeschakeld in de poules', toon: 'verlies' }
  if (poule.klaar) return { tekst: 'Door naar de knock-out', toon: 'winst' }
  return { tekst: `${plaats + 1}e in poule ${poule.naam}`, toon: 'blauw' }
}
