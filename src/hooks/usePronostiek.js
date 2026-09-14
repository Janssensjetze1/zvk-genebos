import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { isGespeeld } from '../lib/wedstrijd'

// ─── Pronostiek ──────────────────────────────────────────────────────────────
// Iedereen voorspelt de score van élke wedstrijd van het seizoen, ook die van
// tegenstanders onderling. Punten:
//   5  exacte score      3  juist doelsaldo      1  juiste afloop      0  fout
//   +1 durfbonus als je de énige bent met de exacte score
// Het hoogste dat van toepassing is telt; ze stapelen niet.
//
// Venster: open vanaf een week voor de aftrap, dicht vanaf een uur ervoor.
// Zelfde regel als de trigger in supabase/migrations/pronostiek.sql — pas
// altijd beide aan. De database is de echte bewaker, dit is de UI-kant.

export const OPENT_DAGEN_VOORAF = 7
export const SLUIT_UREN_VOORAF = 1
const STANDAARD_AFTRAP = '20:00'

export const PUNTEN_UITLEG = [
  { punten: '5', tekst: 'Exacte score juist' },
  { punten: '3', tekst: 'Juist doelsaldo (4-2 voorspeld, 5-3 geworden)' },
  { punten: '1', tekst: 'Juiste afloop: winst, gelijk of verlies' },
  { punten: '+1', tekst: 'Durfbonus: als enige de exacte score juist' },
]

export function aftrapMoment(wedstrijd) {
  if (!wedstrijd?.date) return null
  const tijd = (wedstrijd.time ?? STANDAARD_AFTRAP).slice(0, 5)
  return new Date(`${wedstrijd.date}T${tijd}:00`)
}

export function pronostiekOpent(wedstrijd) {
  const a = aftrapMoment(wedstrijd)
  return a ? new Date(a.getTime() - OPENT_DAGEN_VOORAF * 86400000) : null
}

export function pronostiekSluit(wedstrijd) {
  const a = aftrapMoment(wedstrijd)
  return a ? new Date(a.getTime() - SLUIT_UREN_VOORAF * 3600000) : null
}

// 'geen' | 'nog-niet' | 'open' | 'gesloten'
export function pronostiekStatus(wedstrijd) {
  const opent = pronostiekOpent(wedstrijd)
  const sluit = pronostiekSluit(wedstrijd)
  if (!opent || !sluit) return 'geen'
  const nu = new Date()
  if (nu < opent) return 'nog-niet'
  if (nu < sluit) return 'open'
  return 'gesloten'
}

export function pronostiekIsOpen(wedstrijd) {
  return pronostiekStatus(wedstrijd) === 'open'
}

// "nog 3 dagen" / "nog 5u12" / "nog 24 min"
export function tijdTotLabel(moment) {
  if (!moment) return ''
  const ms = moment - new Date()
  if (ms <= 0) return 'gesloten'
  const minuten = Math.floor(ms / 60000)
  if (minuten < 60) return `nog ${minuten} min`
  const uren = Math.floor(minuten / 60)
  if (uren < 24) return `nog ${uren}u${String(minuten % 60).padStart(2, '0')}`
  const dagen = Math.floor(uren / 24)
  return dagen === 1 ? 'nog 1 dag' : `nog ${dagen} dagen`
}

// Punten van één voorspelling, zonder durfbonus (die kent enkel de database,
// want daarvoor moet je alle voorspellingen van die wedstrijd zien).
export function basisPunten({ voorspeldThuis, voorspeldUit, echtThuis, echtUit }) {
  if ([voorspeldThuis, voorspeldUit, echtThuis, echtUit].some(v => v == null)) return 0
  if (voorspeldThuis === echtThuis && voorspeldUit === echtUit) return 5
  if (voorspeldThuis - voorspeldUit === echtThuis - echtUit) return 3
  if (Math.sign(voorspeldThuis - voorspeldUit) === Math.sign(echtThuis - echtUit)) return 1
  return 0
}

// ─── Hook: de pronostiek van één wedstrijd ───────────────────────────────────
export function usePronostiek(wedstrijd) {
  const { user } = useAuth()
  const matchId = wedstrijd?.id
  const [alle, setAlle]       = useState([])  // wat ik mag zien (voor de deadline: enkel mijn eigen)
  const [scores, setScores]   = useState([])  // met punten, pas na de wedstrijd
  const [aantal, setAantal]   = useState(0)   // hoeveel leden al voorspelden
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig]     = useState(false)
  const [fout, setFout]       = useState('')

  // Haal enkel op wat deze toestand nodig heeft — deze hook hangt aan élke
  // wedstrijdkaart, dus drie queries per kaart zou zonde zijn.
  const laad = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
    const gespeeld = isGespeeld(wedstrijd)
    const status = pronostiekStatus(wedstrijd)

    if (gespeeld) {
      const { data } = await supabase
        .from('pronostiek_scores')
        .select('user_id, naam, voorspeld_thuis, voorspeld_uit, punten, is_exact, durfbonus')
        .eq('match_id', matchId)
      setScores(data ?? [])
      setAlle([])
    } else if (status === 'open') {
      const [voorspellingen, teller] = await Promise.all([
        supabase.from('predictions').select('id, user_id, naam, home_score, away_score').eq('match_id', matchId),
        supabase.from('pronostiek_tellers').select('aantal').eq('match_id', matchId).maybeSingle(),
      ])
      setAlle(voorspellingen.data ?? [])
      setAantal(teller.data?.aantal ?? 0)
      setScores([])
    } else if (status === 'gesloten') {
      const { data } = await supabase
        .from('predictions').select('id, user_id, naam, home_score, away_score').eq('match_id', matchId)
      setAlle(data ?? [])
      setScores([])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, wedstrijd?.date, wedstrijd?.time, wedstrijd?.home_score, wedstrijd?.away_score])

  useEffect(() => {
    function start() { laad() }
    start()
  }, [laad])

  async function opslaan(homeScore, awayScore) {
    if (!user) return false
    setBezig(true)
    setFout('')
    const { error } = await supabase.from('predictions').upsert({
      match_id:   matchId,
      user_id:    user.id,
      home_score: homeScore,
      away_score: awayScore,
    }, { onConflict: 'match_id,user_id' })
    setBezig(false)
    if (error) {
      setFout(error.message?.replace(/^.*?:\s*/, '') || 'Opslaan mislukt')
      return false
    }
    await laad()
    return true
  }

  const mijn = alle.find(v => v.user_id === user?.id) ?? null

  return { mijn, alle, scores, aantal, loading, bezig, fout, opslaan, herlaad: laad,
           status: pronostiekStatus(wedstrijd), gebruikerId: user?.id ?? null }
}

// ─── Hook: klassement van één seizoen ────────────────────────────────────────
export function usePronostiekKlassement(seizoenId) {
  const [rijen, setRijen]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let actief = true

    async function haalKlassement(id) {
      setLoading(true)
      const { data } = await supabase
        .from('pronostiek_klassement')
        .select('user_id, naam, punten, voorspellingen, exacte, durfbonussen')
        .eq('season_id', id)
      if (!actief) return
      setRijen((data ?? []).sort((a, b) =>
        b.punten - a.punten ||
        b.exacte - a.exacte ||
        a.voorspellingen - b.voorspellingen ||
        (a.naam ?? '').localeCompare(b.naam ?? '')
      ))
      setLoading(false)
    }

    if (seizoenId) haalKlassement(seizoenId)
    return () => { actief = false }
  }, [seizoenId])

  return { rijen, loading }
}
