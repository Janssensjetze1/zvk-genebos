import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { ArchiefKiezer } from '../components/ArchiefKiezer'

export default function Spelers() {
  const { actief: seizoen, seizoenen, switchSeizoen } = useSeason()
  const [spelers, setSpelers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')

  useEffect(() => { fetchSpelers() }, [])
  useEffect(() => { if (spelers.length > 0 && seizoen) fetchStats() }, [spelers, seizoen])

  async function fetchSpelers() {
    const { data: sData } = await supabase.from('players').select('*').order('name')
    setSpelers(sData ?? [])
    setLoading(false)
  }

  async function fetchStats() {
    const { data: goals } = await supabase
      .from('goals')
      .select('scorer_id, assist_id, matches!inner(season_id)')
      .eq('matches.season_id', seizoen.id)

    const { data: matchPlayers } = await supabase
      .from('match_players')
      .select('player_id, matches!inner(season_id)')
      .eq('matches.season_id', seizoen.id)

    const berekend = {}
    spelers.forEach(s => { berekend[s.id] = { goals: 0, assists: 0, matches: 0 } })
    goals?.forEach(g => {
      if (berekend[g.scorer_id]) berekend[g.scorer_id].goals++
      if (g.assist_id && berekend[g.assist_id]) berekend[g.assist_id].assists++
    })
    matchPlayers?.forEach(mp => {
      if (berekend[mp.player_id]) berekend[mp.player_id].matches++
    })
    setStats(berekend)
  }

  const gefilterd = spelers.filter(s =>
    s.name.toLowerCase().includes(zoek.toLowerCase())
  )

  // Sorteer op doelpunten desc
  const gesorteerd = [...gefilterd].sort((a, b) => {
    const sa = stats[a.id] ?? { goals: 0 }
    const sb = stats[b.id] ?? { goals: 0 }
    return sb.goals - sa.goals
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Spelers</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>{spelers.length} spelers in de selectie</p>
        </div>

        {/* Archief kiezer */}
        <ArchiefKiezer />
      </div>

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '320px' }}>
        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Zoek speler…"
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px 9px 36px', fontSize: '14px',
            border: '1px solid #e2e8f0', borderRadius: '10px',
            background: 'white', outline: 'none', color: '#0f172a',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>
      ) : gesorteerd.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Geen spelers gevonden.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '14px',
        }}>
          {gesorteerd.map((speler, i) => {
            const s = stats[speler.id] ?? { goals: 0, assists: 0, matches: 0 }
            const isTopscorer = i === 0 && s.goals > 0
            return <SpelerKaart key={speler.id} speler={speler} stats={s} isTopscorer={isTopscorer} />
          })}
        </div>
      )}
    </div>
  )
}

function SpelerKaart({ speler, stats, isTopscorer }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white',
        border: `1px solid ${hover ? '#bfdbfe' : '#e2e8f0'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s',
        boxShadow: hover ? '0 4px 20px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'default',
      }}
    >
      {/* Foto sectie */}
      <div style={{
        height: '140px',
        background: speler.photo_url ? 'transparent' : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {speler.photo_url ? (
          <img
            src={speler.photo_url}
            alt={speler.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: '#93c5fd', opacity: 0.7 }}>
              {speler.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Topscorer badge */}
        {isTopscorer && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#f59e0b', color: 'white',
            fontSize: '10px', fontWeight: '700',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            🥇 Topscorer
          </div>
        )}
      </div>

      {/* Info sectie */}
      <div style={{ padding: '14px' }}>
        <p style={{
          fontSize: '14px', fontWeight: '700', color: '#0f172a',
          marginBottom: '10px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {speler.name}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          <StatPil icoon="⚽" waarde={stats.goals} label="Goals" kleur="#eff6ff" tekstkleur="#1d4ed8" />
          <StatPil icoon="🎯" waarde={stats.assists} label="Assists" kleur="#f0fdf4" tekstkleur="#15803d" grens />
          <StatPil icoon="🏟️" waarde={stats.matches} label="Matchen" kleur="#fafafa" tekstkleur="#475569" grens />
        </div>
      </div>
    </div>
  )
}

function StatPil({ icoon, waarde, label, kleur, tekstkleur, grens }) {
  return (
    <div style={{
      flex: 1, background: kleur, padding: '8px 4px', textAlign: 'center',
      borderLeft: grens ? '1px solid #f1f5f9' : 'none',
    }}>
      <div style={{ fontSize: '13px', fontWeight: '800', color: tekstkleur }}>{waarde}</div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{label}</div>
    </div>
  )
}
