import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { supabase } from '../lib/supabase'
import { isGespeeld, vandaagISO, weekendBereik, weekendWedstrijden } from '../lib/wedstrijd'
import WedstrijdenPerDag from '../components/WedstrijdenPerDag'
import Ranglijst from '../components/Ranglijst'
import VolgendeWedstrijdKaart from '../components/VolgendeWedstrijdKaart'
import { useNavigate } from 'react-router-dom'
import { hoofdletter, Kaart, LegeStaat, PaginaKop, Rij, Sectie, Stat, TypeChip, UitslagLetter } from '../ui'

export default function Dashboard() {
  const { profile } = useAuth()
  const { actief: seizoen } = useSeason()
  const [volgende, setVolgende] = useState(null)
  const [vorige, setVorige] = useState(null)
  const [weekend, setWeekend] = useState({ titel: '', lijst: [] })
  const [stats, setStats] = useState(null)
  const [topscorers, setTopscorers] = useState([])
  const [topassists, setTopassists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (seizoen) fetchData()
  }, [seizoen, profile?.player_id])

  async function fetchData() {
    setLoading(true)
    const vandaag = vandaagISO()
    const { van, tot } = weekendBereik()

    // Haal seizoen match-ids op
    const { data: matchIds } = await supabase
      .from('matches')
      .select('id')
      .eq('season_id', seizoen.id)
    const ids = matchIds?.map(m => m.id) ?? []

    const queries = [
      // Aankomende wedstrijden: haal meerdere op en filter client-side op ZVK
      supabase.from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoen.id)
        .gte('date', vandaag)
        .order('date', { ascending: true })
        .limit(20),

      // Meest recente gespeelde wedstrijden, filter client-side op ZVK
      // (datum van vandaag zit erbij: die telt mee zodra het blad is ingevuld)
      supabase.from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoen.id)
        .lte('date', vandaag)
        .order('date', { ascending: false })
        .limit(10),

      // Goals met spelers
      ids.length > 0
        ? supabase.from('goals')
            .select('scorer_id, assist_id, scorer:scorer_id(id, name, photo_url), assist:assist_id(id, name, photo_url)')
            .in('match_id', ids)
        : Promise.resolve({ data: [] }),

      // Alle wedstrijden van het weekend, ook die van de andere ploegen
      supabase.from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoen.id)
        .gte('date', van)
        .lte('date', tot),
    ]

    const [{ data: volgendeData }, { data: vorigeData }, { data: goalsData }, { data: weekendData }] = await Promise.all(queries)
    setWeekend(weekendWedstrijden(weekendData))

    // Bepaal volgende en vorige ZVK-wedstrijd
    const aankomendZVK = (volgendeData ?? []).filter(w => (w.home_team?.is_zvk || w.away_team?.is_zvk) && !isGespeeld(w))
    const gespeeldZVK = (vorigeData ?? []).filter(w => (w.home_team?.is_zvk || w.away_team?.is_zvk) && isGespeeld(w))
    setVolgende(aankomendZVK[0] ?? null)
    setVorige(gespeeldZVK[0] ?? null)

    // Bereken topscorers
    const scorerMap = {}
    const assistMap = {}
    for (const g of goalsData ?? []) {
      if (g.scorer) {
        const id = g.scorer_id
        scorerMap[id] = scorerMap[id] ?? { ...g.scorer, goals: 0 }
        scorerMap[id].goals++
      }
      if (g.assist_id && g.assist) {
        const id = g.assist_id
        assistMap[id] = assistMap[id] ?? { ...g.assist, assists: 0 }
        assistMap[id].assists++
      }
    }
    setTopscorers(Object.values(scorerMap).sort((a, b) => b.goals - a.goals).slice(0, 5))
    setTopassists(Object.values(assistMap).sort((a, b) => b.assists - a.assists).slice(0, 5))

    // Persoonlijke stats
    if (profile?.player_id && ids.length > 0) {
      const [{ count: gespeeld }, { count: goals }, { count: assists }] = await Promise.all([
        supabase.from('match_players').select('*', { count: 'exact', head: true })
          .eq('player_id', profile.player_id).in('match_id', ids),
        supabase.from('goals').select('*', { count: 'exact', head: true })
          .eq('scorer_id', profile.player_id).in('match_id', ids),
        supabase.from('goals').select('*', { count: 'exact', head: true })
          .eq('assist_id', profile.player_id).in('match_id', ids),
      ])
      setStats({ gespeeld: gespeeld ?? 0, goals: goals ?? 0, assists: assists ?? 0 })
    }

    setLoading(false)
  }

  const voornaam = profile?.display_name?.split(' ')[0]
  const vandaagTekst = hoofdletter(new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))

  if (!seizoen) {
    return (
      <>
        <PaginaKop titel={`Goeiedag${voornaam ? `, ${voornaam}` : ''}`} ondertitel={vandaagTekst} />
        <LegeStaat titel="Geen seizoen" tekst="Er is nog geen seizoen aangemaakt." icoon="kalender" />
      </>
    )
  }

  return (
    <>
      <PaginaKop
        bovenlabel={`Seizoen ${seizoen.name}`}
        titel={`Goeiedag${voornaam ? `, ${voornaam}` : ''}`}
        ondertitel={vandaagTekst}
      />

      <div className="z-raster z-raster-hoofd" style={{ alignItems: 'start' }}>

        {/* Links: onze wedstrijden */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
          <Sectie titel="Volgende wedstrijd">
            {loading ? <HeroSkelet /> :
              volgende ? <VolgendeWedstrijdKaart wedstrijd={volgende} /> :
              <LegeStaat titel="Geen geplande wedstrijden" tekst="De kalender is leeg." icoon="kalender" />}
          </Sectie>

          {!loading && vorige && (
            <Sectie titel="Laatste uitslag">
              <VorigeKaart wedstrijd={vorige} />
            </Sectie>
          )}

          {weekend.lijst.length > 0 && (
            <Sectie titel={weekend.titel} meta="Alle ploegen">
              <WedstrijdenPerDag wedstrijden={weekend.lijst} variant="desktop" />
            </Sectie>
          )}
        </div>

        {/* Rechts: persoonlijk en de ranglijsten */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
          {profile?.player_id && (
            <Sectie titel="Jouw seizoen">
              <div className="z-raster" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                <Stat label="Matchen" waarde={stats?.gespeeld ?? 0} laden={loading} />
                <Stat label="Goals" waarde={stats?.goals ?? 0} laden={loading} />
                <Stat label="Assists" waarde={stats?.assists ?? 0} laden={loading} />
              </div>
            </Sectie>
          )}

          <Sectie titel="De Gouden Stier" meta="Topschutters">
            <Ranglijst spelers={topscorers} sleutel="goals" eenheid={['goal', 'goals']} loading={loading} />
          </Sectie>

          <Sectie titel="Assistenkoning" meta="Meeste assists">
            <Ranglijst spelers={topassists} sleutel="assists" eenheid={['assist', 'assists']} loading={loading} />
          </Sectie>
        </div>
      </div>
    </>
  )
}

function HeroSkelet() {
  return (
    <div style={{ height: '196px', borderRadius: 'var(--z-r-l)', background: 'var(--z-navy)', opacity: 0.12 }} />
  )
}

// ── Vorige wedstrijd ─────────────────────────────────────────────────────────

function VorigeKaart({ wedstrijd: w }) {
  const navigate = useNavigate()
  const isThuis = w.home_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const uitslag = zvkScore > tegScore ? 'W' : zvkScore < tegScore ? 'V' : 'G'
  const datum = new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })

  return (
    <Kaart>
      <Rij onClick={() => navigate(`/wedstrijd/${w.id}`)} style={{ padding: '16px 20px' }}>
        <UitslagLetter uitslag={uitslag} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {w.home_team?.name} – {w.away_team?.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13px', color: 'var(--z-tekst-3)' }}>
            {datum}
            <TypeChip type={w.type} />
          </div>
        </div>
        <div className="z-tab-nums" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--z-tekst)', letterSpacing: '0.02em' }}>
          {w.home_score}<span style={{ color: 'var(--z-tekst-4)', margin: '0 6px' }}>–</span>{w.away_score}
        </div>
      </Rij>
    </Kaart>
  )
}
