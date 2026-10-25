import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { isGespeeld } from '../lib/wedstrijd'
import Ranglijst from './Ranglijst'
import Podium from './Podium'
import { Laden, LegeStaat, Sectie } from '../ui'

// De Gouden Stier, de Assistenkoning en de MVP's: top 3 op het podium, de
// rest eronder. Gedeeld door de statspagina van de app en die van de desktop.
// naastElkaar: op desktop staan beide klasseringen naast elkaar.

export default function StatsOverzicht({ naastElkaar = false }) {
  const { actief: seizoen } = useSeason()
  const [goals, setGoals] = useState([])
  const [spelers, setSpelers] = useState([])
  const [mvpTitels, setMvpTitels] = useState({})
  const [loading, setLoading] = useState(true)

  const seizoenId = seizoen?.id
  useEffect(() => {
    if (!seizoenId) return
    let levend = true
    Promise.all([
      supabase.from('goals').select('*, match:match_id(date, season_id)').eq('match.season_id', seizoenId),
      supabase.from('players').select('*'),
      supabase.from('mvp_klassement').select('player_id, mvps').eq('season_id', seizoenId),
    ]).then(([{ data: gData }, { data: sData }, { data: mData }]) => {
      if (!levend) return
      // Een doelpunt bestaat enkel als het wedstrijdblad is ingevuld, dus telt het mee
      setGoals((gData ?? []).filter(g => isGespeeld({ ...g.match, goals: [g] })))
      setSpelers(sData ?? [])
      setMvpTitels(Object.fromEntries((mData ?? []).map(m => [m.player_id, m.mvps])))
      setLoading(false)
    })
    return () => { levend = false }
  }, [seizoenId])

  const doelpunten = {}
  const assists = {}
  for (const g of goals) {
    if (g.scorer_id) doelpunten[g.scorer_id] = (doelpunten[g.scorer_id] || 0) + 1
    if (g.assist_id) assists[g.assist_id] = (assists[g.assist_id] || 0) + 1
  }

  const topscorers = spelers
    .map(s => ({ ...s, goals: doelpunten[s.id] || 0 }))
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)

  const topassists = spelers
    .map(s => ({ ...s, assists: assists[s.id] || 0 }))
    .filter(s => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)

  const topmvps = spelers
    .map(s => ({ ...s, mvps: mvpTitels[s.id] || 0 }))
    .filter(s => s.mvps > 0)
    .sort((a, b) => b.mvps - a.mvps)

  return (
    <div
      className={naastElkaar ? 'z-raster z-raster-2' : undefined}
      style={naastElkaar ? { alignItems: 'start', gap: '28px' } : { display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <Sectie titel="De Gouden Stier" meta="Topschutters">
        <Klassering spelers={topscorers} sleutel="goals" eenheid={['goal', 'goals']} loading={loading} leeg="Nog geen doelpunten gescoord." />
      </Sectie>

      <Sectie titel="Assistenkoning" meta="Meeste assists">
        <Klassering spelers={topassists} sleutel="assists" eenheid={['assist', 'assists']} loading={loading} leeg="Nog geen assists geregistreerd." />
      </Sectie>

      <Sectie titel="MVP van de match" meta="Meeste keren verkozen">
        <Klassering spelers={topmvps} sleutel="mvps" eenheid={['keer', 'keer']} loading={loading} leeg="Nog geen MVP verkozen dit seizoen." />
      </Sectie>
    </div>
  )
}

// Top 3 op het podium, de rest in de ranglijst eronder
function Klassering({ spelers, sleutel, eenheid, loading, leeg }) {
  if (loading) return <Laden regels={3} />
  if (spelers.length === 0) return <LegeStaat tekst={leeg} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Podium spelers={spelers} sleutel={sleutel} eenheid={eenheid} />
      {spelers.length > 3 && (
        <Ranglijst spelers={spelers.slice(3)} sleutel={sleutel} eenheid={eenheid} start={4} />
      )}
    </div>
  )
}
