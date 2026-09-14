import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Maximaal aantal spelers dat kan meedoen aan één wedstrijd.
// Wordt ook afgedwongen door een trigger in de database
// (supabase/migrations/match_availability_limiet.sql) — pas beide aan.
export const MAX_MEE = 10

// ─── Wanneer gaat de opgave open? ────────────────────────────────────────────
// Standaard: woensdag 10:00 van de week van de wedstrijd — de laatste woensdag
// op of vóór de matchdag. Een admin kan dat vervroegen via
// matches.availability_opens_at. Zelfde regel als de trigger in
// supabase/migrations/match_availability_opening.sql — pas beide aan.
export function opgaveOpentOp(wedstrijd) {
  if (wedstrijd?.availability_opens_at) return new Date(wedstrijd.availability_opens_at)
  if (!wedstrijd?.date) return null

  const d = new Date(`${wedstrijd.date}T00:00:00`)
  // getDay(): zo=0, wo=3 → aantal dagen terug tot de laatste woensdag
  const dagenTerug = (d.getDay() - 3 + 7) % 7
  d.setDate(d.getDate() - dagenTerug)
  d.setHours(10, 0, 0, 0)
  return d
}

// Is de opgave al open volgens de standaardregel (dus zonder override)?
export function opgaveNatuurlijkOpen(wedstrijd) {
  const op = opgaveOpentOp({ date: wedstrijd?.date })
  return op ? new Date() >= op : false
}

export function opgaveIsOpen(wedstrijd) {
  const op = opgaveOpentOp(wedstrijd)
  return op ? new Date() >= op : false
}

// ─── Statussen ───────────────────────────────────────────────────────────────
// 'mee'    → doet mee
// 'niet'   → doet niet mee
// 'kijken' → komt kijken maar speelt niet
export const OPGAVE_STATUSSEN = [
  { id: 'mee', label: 'Ik doen mee', kort: 'Doet mee', emoji: '✅', kleur: '#16a34a', bg: '#f0fdf4', rand: '#bbf7d0' },
  { id: 'niet', label: 'Ik doen nie mee', kort: 'Doet niet mee', emoji: '❌', kleur: '#ef4444', bg: '#fef2f2', rand: '#fecaca' },
  { id: 'kijken', label: 'Ik kom zien', kort: 'Komt kijken', emoji: '👀', kleur: '#d97706', bg: '#fffbeb', rand: '#fde68a' },
]

export const OPGAVE_MAP = Object.fromEntries(OPGAVE_STATUSSEN.map(s => [s.id, s]))

async function haalOpgaves(matchId) {
  const { data } = await supabase
    .from('match_availability')
    .select('user_id, player_id, status, naam')
    .eq('match_id', matchId)
  return data ?? []
}

// ─── Hook: opgave van één wedstrijd ──────────────────────────────────────────
export function useOpgave(matchId) {
  const { user, profile } = useAuth()
  const gebruikerId = user?.id ?? null
  const spelerId = profile?.player_id ?? null
  // Zonder gekoppelde spelersfiche kan je enkel komen kijken
  const magMeedoen = !!spelerId

  const [opgaves, setOpgaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    let levend = true
    haalOpgaves(matchId).then(rijen => {
      if (!levend) return
      setOpgaves(rijen)
      setLoading(false)
    })
    return () => { levend = false }
  }, [matchId])

  const mijnStatus = opgaves.find(o => o.user_id === gebruikerId)?.status ?? null
  const aantalMee = opgaves.filter(o => o.status === 'mee').length

  // Volzet, en jij staat er zelf niet bij
  const vol = aantalMee >= MAX_MEE && mijnStatus !== 'mee'

  async function zetStatus(status) {
    if (!gebruikerId || bezig) return
    if (!magMeedoen && status !== 'kijken') return
    if (status === 'mee' && vol) {
      setFout(`Volzet — er kunnen maar ${MAX_MEE} spelers meedoen.`)
      return
    }

    setBezig(true)
    setFout('')

    // Nogmaals op dezelfde knop duwen wist je antwoord
    const nieuw = mijnStatus === status ? null : status
    const vorige = opgaves
    const eigenNaam = opgaves.find(o => o.user_id === gebruikerId)?.naam ?? null

    // Optimistisch bijwerken zodat de knop meteen reageert
    setOpgaves(prev => {
      const zonder = prev.filter(o => o.user_id !== gebruikerId)
      if (!nieuw) return zonder
      return [...zonder, { user_id: gebruikerId, player_id: spelerId, status: nieuw, naam: eigenNaam }]
    })

    const { error } = !nieuw
      ? await supabase.from('match_availability').delete()
          .eq('match_id', matchId).eq('user_id', gebruikerId)
      : await supabase.from('match_availability').upsert(
          { match_id: matchId, user_id: gebruikerId, player_id: spelerId, status: nieuw },
          { onConflict: 'match_id,user_id' }
        )

    if (error) {
      // Meestal: iemand anders was net sneller en de plek is weg
      setOpgaves(vorige)
      setFout(
        error.message?.includes('Volzet')
          ? `Net te laat — de ${MAX_MEE} plekken zijn ingenomen.`
          : 'Opslaan mislukt, probeer het opnieuw.'
      )
      // Verse stand ophalen zodat je meteen ziet wie er wél staat
      setOpgaves(await haalOpgaves(matchId))
    } else {
      setOpgaves(await haalOpgaves(matchId))
    }

    setBezig(false)
  }

  const perStatus = Object.fromEntries(
    OPGAVE_STATUSSEN.map(s => [s.id, opgaves.filter(o => o.status === s.id)])
  )

  return { opgaves, perStatus, mijnStatus, zetStatus, loading, bezig, spelerId, gebruikerId, magMeedoen, aantalMee, vol, fout }
}
