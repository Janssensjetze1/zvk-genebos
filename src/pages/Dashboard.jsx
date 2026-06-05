import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { supabase } from '../lib/supabase'

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { actief: seizoen } = useSeason()
  const [volgende, setVolgende] = useState(null)
  const [vorige, setVorige] = useState(null)
  const [stats, setStats] = useState(null)
  const [topscorers, setTopscorers] = useState([])
  const [topassists, setTopassists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (seizoen) fetchData()
  }, [seizoen, profile?.player_id])

  async function fetchData() {
    setLoading(true)
    const vandaag = new Date().toISOString().split('T')[0]

    // Haal seizoen match-ids op
    const { data: matchIds } = await supabase
      .from('matches')
      .select('id')
      .eq('season_id', seizoen.id)
    const ids = matchIds?.map(m => m.id) ?? []

    const queries = [
      // Aankomende wedstrijden — haal meerdere op en filter client-side op ZVK
      supabase.from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk)')
        .eq('season_id', seizoen.id)
        .gte('date', vandaag)
        .order('date', { ascending: true })
        .limit(20),

      // Meest recente gespeelde wedstrijden — filter client-side op ZVK
      supabase.from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk)')
        .eq('season_id', seizoen.id)
        .lt('date', vandaag)
        .order('date', { ascending: false })
        .limit(10),

      // Goals met spelers
      ids.length > 0
        ? supabase.from('goals')
            .select('scorer_id, assist_id, scorer:scorer_id(id, name, photo_url), assist:assist_id(id, name, photo_url)')
            .in('match_id', ids)
        : Promise.resolve({ data: [] }),
    ]

    const [{ data: volgendeData }, { data: vorigeData }, { data: goalsData }] = await Promise.all(queries)

    // Bepaal volgende en vorige ZVK-wedstrijd
    const aankomendZVK = (volgendeData ?? []).filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
    const gespeeldZVK = (vorigeData ?? []).filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
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
    setTopscorers(Object.values(scorerMap).sort((a, b) => b.goals - a.goals).slice(0, 3))
    setTopassists(Object.values(assistMap).sort((a, b) => b.assists - a.assists).slice(0, 3))

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

  const isAdmin = profile?.role === 'admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
          Goeiedag 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          {seizoen?.name ?? 'Geen seizoen'}{isAdmin && ' · Admin'}
        </p>
      </div>

      {/* Rij 1: Wedstrijden + persoonlijke stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

        {/* Wedstrijden kolom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <SectieLabel>Volgende wedstrijd</SectieLabel>
            {!seizoen ? <LegeKaart tekst="Geen seizoen geselecteerd." /> :
              loading ? <LegeKaart tekst="Laden..." /> :
              volgende ? <VolgendeKaart wedstrijd={volgende} /> :
              <LegeKaart tekst="Geen geplande wedstrijden." />}
          </div>
          {!loading && vorige && (
            <div>
              <SectieLabel>Vorige wedstrijd</SectieLabel>
              <VorigeKaart wedstrijd={vorige} />
            </div>
          )}
        </div>

        {/* Persoonlijke stats */}
        {profile?.player_id && (
          <div>
            <SectieLabel>Jouw seizoen</SectieLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <StatKaart icoon="🏟️" waarde={loading ? '—' : stats?.gespeeld ?? 0} label="Wedstrijden" />
              <StatKaart icoon="⚽" waarde={loading ? '—' : stats?.goals ?? 0} label="Goals" />
              <StatKaart icoon="🎯" waarde={loading ? '—' : stats?.assists ?? 0} label="Assists" />
            </div>
          </div>
        )}
      </div>

      {/* Rij 2: Podiums */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        <div>
          <SectieLabel>Topscorers ⚽</SectieLabel>
          <Podium spelers={topscorers} sleutel="goals" label="goal" loading={loading} />
        </div>

        <div>
          <SectieLabel>Meeste assists 🎯</SectieLabel>
          <Podium spelers={topassists} sleutel="assists" label="assist" loading={loading} />
        </div>
      </div>

    </div>
  )
}

// ── Podium ───────────────────────────────────────────────────────────────────

const PODIUM = [
  { pos: 1, hoogte: 88, kleur: '#f59e0b', bg: 'linear-gradient(160deg,#fef3c7,#fde68a)', label: '🥇', ring: '#f59e0b' },
  { pos: 2, hoogte: 64, kleur: '#94a3b8', bg: 'linear-gradient(160deg,#f1f5f9,#e2e8f0)', label: '🥈', ring: '#94a3b8' },
  { pos: 3, hoogte: 48, kleur: '#b45309', bg: 'linear-gradient(160deg,#fef9ee,#fde8c0)', label: '🥉', ring: '#cd7c3a' },
]

// Volgorde voor display: 2 - 1 - 3 (zilver links, goud midden, brons rechts)
const DISPLAY_ORDER = [1, 0, 2]

function Podium({ spelers, sleutel, label, loading }) {
  if (loading) return <LegeKaart tekst="Laden..." />
  if (spelers.length === 0) return <LegeKaart tekst="Nog geen data dit seizoen." />

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px 16px 0', overflow: 'hidden' }}>
      {/* Podium figuren */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', marginBottom: '0' }}>
        {DISPLAY_ORDER.map(idx => {
          const speler = spelers[idx]
          const { hoogte, kleur, bg, label: medaille, ring } = PODIUM[idx]
          const isGoud = idx === 0

          if (!speler) return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: hoogte, background: '#f8fafc', borderRadius: '8px 8px 0 0', width: '100%', border: '1px dashed #e2e8f0', borderBottom: 'none' }} />
            </div>
          )

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {/* Ring */}
                <div style={{
                  width: isGoud ? '68px' : '54px',
                  height: isGoud ? '68px' : '54px',
                  borderRadius: '50%',
                  padding: '3px',
                  background: `linear-gradient(135deg, ${ring}, white)`,
                  boxShadow: `0 4px 12px ${ring}44`,
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: speler.photo_url ? 'transparent' : '#eff6ff',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isGoud ? '22px' : '17px', fontWeight: '700', color: '#1d4ed8',
                  }}>
                    {speler.photo_url
                      ? <img src={speler.photo_url} alt={speler.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : speler.name?.charAt(0).toUpperCase()
                    }
                  </div>
                </div>
                <span style={{ fontSize: '16px' }}>{medaille}</span>
              </div>

              {/* Naam + score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: isGoud ? '13px' : '12px', fontWeight: '600', color: '#0f172a',
                  maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {speler.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <strong style={{ color: kleur }}>{speler[sleutel]}</strong> {label}{speler[sleutel] !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Podiumblok */}
              <div style={{
                width: '100%', height: `${hoogte}px`,
                background: bg,
                borderRadius: '8px 8px 0 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderTop: `3px solid ${ring}`,
              }}>
                <span style={{ fontSize: isGoud ? '24px' : '18px', fontWeight: '800', color: kleur }}>
                  {idx + 1}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Volgende wedstrijd ────────────────────────────────────────────────────────

function VolgendeKaart({ wedstrijd: w }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const datum = new Date(w.date)
  const dagNaam = datum.toLocaleDateString('nl-BE', { weekday: 'long' })
  const datumStr = datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
  const diff = Math.ceil((datum - new Date()) / 86400000)
  const overLabel = diff === 0 ? 'Vandaag!' : diff === 1 ? 'Morgen' : `Over ${diff} dagen`
  const urgent = diff <= 3

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
      padding: '20px', display: 'flex', gap: '16px', alignItems: 'center',
    }}>
      {/* Datum blok */}
      <div style={{
        flexShrink: 0, width: '52px', textAlign: 'center',
        background: '#0f172a', borderRadius: '10px', padding: '10px 0',
      }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{datum.getDate()}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '2px' }}>
          {datum.toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isThuis ? 'ZVK Genebos' : tegenstander?.name} vs {isThuis ? tegenstander?.name : 'ZVK Genebos'}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '6px', background: TYPE_COLORS[w.type]?.bg, color: TYPE_COLORS[w.type]?.color }}>
            {TYPE_LABELS[w.type]}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isThuis ? '🏠 Thuis' : '✈️ Uit'}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'capitalize' }}>
          {dagNaam} {datumStr}
        </div>
      </div>

      {/* Countdown */}
      <div style={{
        flexShrink: 0, background: urgent ? '#fff7ed' : '#f8fafc',
        border: `1px solid ${urgent ? '#fed7aa' : '#e2e8f0'}`,
        borderRadius: '10px', padding: '8px 12px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: urgent ? '#c2410c' : '#0f172a' }}>
          {overLabel}
        </div>
      </div>
    </div>
  )
}

// ── Vorige wedstrijd ─────────────────────────────────────────────────────────

function VorigeKaart({ wedstrijd: w }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const datum = new Date(w.date)
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const resultaat = zvkScore > tegScore ? 'W' : zvkScore < tegScore ? 'V' : 'G'
  const { kleur, bg, label } = {
    W: { kleur: '#16a34a', bg: '#f0fdf4', label: 'Winst' },
    V: { kleur: '#ef4444', bg: '#fef2f2', label: 'Verlies' },
    G: { kleur: '#d97706', bg: '#fffbeb', label: 'Gelijkspel' },
  }[resultaat]

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
      padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center',
    }}>
      {/* Resultaat badge */}
      <div style={{
        flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px',
        background: bg, color: kleur,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: '800',
      }}>
        {resultaat}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isThuis ? 'ZVK Genebos' : tegenstander?.name} vs {isThuis ? tegenstander?.name : 'ZVK Genebos'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
          </span>
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>·</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: kleur }}>{label}</span>
        </div>
      </div>

      {/* Score */}
      <div style={{
        flexShrink: 0,
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: '8px', padding: '6px 14px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.05em' }}>
          {w.home_score} – {w.away_score}
        </span>
      </div>
    </div>
  )
}

// ── Hulpcomponenten ───────────────────────────────────────────────────────────

function SectieLabel({ children }) {
  return (
    <h2 style={{
      fontSize: '12px', fontWeight: '600', color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px',
    }}>
      {children}
    </h2>
  )
}

function StatKaart({ icoon, waarde, label }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icoon}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{waarde}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

function LegeKaart({ tekst }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '28px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#94a3b8' }}>{tekst}</p>
    </div>
  )
}
