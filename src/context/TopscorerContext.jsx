import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from './SeasonContext'
import { isGespeeld } from '../lib/wedstrijd'

// Wie is dit seizoen topscorer en wie assistenkoning? Eén keer berekend en
// overal beschikbaar, zodat de glansring en het kroontje op elke spelersfoto
// hetzelfde zeggen: goud = topscorer, paars = assistenkoning.
// Bij een gelijke stand bovenaan zijn er meerdere winnaars.

const LEEG = {
  topscorerIds: new Set(),
  assistkoningIds: new Set(),
  topGoals: 0,
  topAssists: 0,
}

const TopscorerContext = createContext({
  ...LEEG,
  isTopscorer: () => false,
  isAssistkoning: () => false,
  eer: () => null,
})

export function TopscorerProvider({ children }) {
  const { actief: seizoen } = useSeason()
  const [titels, setTitels] = useState(LEEG)

  useEffect(() => {
    if (!seizoen) {
      setTitels(LEEG)
      return
    }
    let levend = true
    bereken(seizoen.id).then(resultaat => {
      if (levend) setTitels(resultaat)
    })
    return () => { levend = false }
  }, [seizoen?.id])

  const isTopscorer = id => !!id && titels.topscorerIds.has(id)
  const isAssistkoning = id => !!id && titels.assistkoningIds.has(id)

  // 'topscorer' | 'assistkoning' | 'beide' | null
  const eer = id => {
    const t = isTopscorer(id)
    const a = isAssistkoning(id)
    if (t && a) return 'beide'
    if (t) return 'topscorer'
    if (a) return 'assistkoning'
    return null
  }

  return (
    <TopscorerContext.Provider value={{ ...titels, isTopscorer, isAssistkoning, eer }}>
      {children}
    </TopscorerContext.Provider>
  )
}

async function bereken(seizoenId) {
  const { data, error } = await supabase
    .from('goals')
    .select('scorer_id, assist_id, match:match_id(date, season_id)')
    .eq('match.season_id', seizoenId)
  if (error || !data) return LEEG

  const goals = {}
  const assists = {}
  for (const g of data) {
    // Enkel doelpunten uit wedstrijden die al gespeeld zijn
    if (!g.match || !isGespeeld({ ...g.match, goals: [g] })) continue
    if (g.scorer_id) goals[g.scorer_id] = (goals[g.scorer_id] ?? 0) + 1
    if (g.assist_id) assists[g.assist_id] = (assists[g.assist_id] ?? 0) + 1
  }

  const [topscorerIds, topGoals] = koplopers(goals)
  const [assistkoningIds, topAssists] = koplopers(assists)
  return { topscorerIds, topGoals, assistkoningIds, topAssists }
}

// Iedereen met het hoogste aantal; niemand als er niets gescoord is
function koplopers(perSpeler) {
  const aantallen = Object.values(perSpeler)
  if (aantallen.length === 0) return [new Set(), 0]
  const top = Math.max(...aantallen)
  if (top <= 0) return [new Set(), 0]
  return [new Set(Object.keys(perSpeler).filter(id => perSpeler[id] === top)), top]
}

export const useTopscorer = () => useContext(TopscorerContext)
