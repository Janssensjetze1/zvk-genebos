import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// MVP per wedstrijd. De regels zelf (wie, wanneer, op wie) bewaakt de
// database, zie supabase/migrations/mvp.sql. Hier enkel wat de app nodig heeft
// om te tonen.

export const MVP_UREN = 48

// Aftrap in lokale tijd: datum + uur, of 20:00 als er geen uur is (zoals
// pronostiek_aftrap in de database)
export function aftrap(w) {
  return new Date(`${w.date}T${(w.time ?? '20:00').slice(0, 5)}:00`)
}

export function mvpSluitOp(w) {
  return new Date(aftrap(w).getTime() + MVP_UREN * 3600000)
}

// Kan er (nog) gestemd worden? Enkel voor onze wedstrijden met een wedstrijdblad.
export function mvpStatus(w) {
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  if (!onze || !(w.match_players?.length > 0)) return 'geen'
  return Date.now() < mvpSluitOp(w).getTime() ? 'open' : 'gesloten'
}

// Alle MVP's per wedstrijd ({ match_id: [{ id, name, photo_url }] }), één keer
// opgehaald en gedeeld door alle lijsten op het scherm
let winnaarsCache = null

function haalWinnaars() {
  winnaarsCache ??= supabase
    .from('mvp_uitslag')
    .select('match_id, stemmen, player:player_id(id, name, photo_url)')
    .eq('is_mvp', true)
    .then(({ data }) => {
      const perMatch = {}
      for (const r of data ?? []) (perMatch[r.match_id] ??= []).push({ ...r.player, stemmen: r.stemmen })
      return perMatch
    })
  return winnaarsCache
}

export function useMvpWinnaars() {
  const [winnaars, setWinnaars] = useState({})
  useEffect(() => {
    let actief = true
    haalWinnaars().then(w => { if (actief) setWinnaars(w) })
    return () => { actief = false }
  }, [])
  return winnaars
}
