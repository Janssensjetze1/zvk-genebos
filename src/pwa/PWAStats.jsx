import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'

export default function PWAStats() {
  const { actief: seizoen } = useSeason()
  const [goals, setGoals] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (seizoen) fetchData() }, [seizoen])

  async function fetchData() {
    setLoading(true)
    const vandaag = new Date().toISOString().split('T')[0]
    const [{ data: gData }, { data: sData }] = await Promise.all([
      supabase.from('goals').select('*, match:match_id(date, season_id)')
        .eq('match.season_id', seizoen.id),
      supabase.from('players').select('*'),
    ])
    const gefilterd = (gData ?? []).filter(g => g.match?.date < vandaag)
    setGoals(gefilterd)
    setSpelers(sData ?? [])
    setLoading(false)
  }

  // Bereken doelpunten per speler
  const doelpuntenMap = {}
  const assistsMap = {}
  for (const g of goals) {
    if (g.scorer_id) doelpuntenMap[g.scorer_id] = (doelpuntenMap[g.scorer_id] || 0) + 1
    if (g.assist_id) assistsMap[g.assist_id] = (assistsMap[g.assist_id] || 0) + 1
  }

  const topscorers = spelers
    .map(s => ({ ...s, goals: doelpuntenMap[s.id] || 0 }))
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals)

  const topassists = spelers
    .map(s => ({ ...s, assists: assistsMap[s.id] || 0 }))
    .filter(s => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Statistieken</h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>{seizoen?.name}</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
      ) : (
        <>
          {/* Topscorers */}
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            ⚽ Topscorers
          </h2>
          <Podium spelers={topscorers.slice(0, 3)} stat="goals" label="doelpunten" />
          {topscorers.length > 3 && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '28px' }}>
              {topscorers.slice(3).map((s, i) => (
                <RijSpeler key={s.id} speler={s} positie={i + 4} waarde={s.goals} label="doelpunten" />
              ))}
            </div>
          )}

          {/* Assists */}
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', marginTop: '8px' }}>
            🎯 Meeste assists
          </h2>
          <Podium spelers={topassists.slice(0, 3)} stat="assists" label="assists" />
          {topassists.length > 3 && (
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
              {topassists.slice(3).map((s, i) => (
                <RijSpeler key={s.id} speler={s} positie={i + 4} waarde={s.assists} label="assists" />
              ))}
            </div>
          )}

          {topscorers.length === 0 && topassists.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
              Nog geen statistieken beschikbaar.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Podium({ spelers, stat, label }) {
  if (spelers.length === 0) return null
  const volgorde = spelers.length >= 3
    ? [spelers[1], spelers[0], spelers[2]]
    : spelers.length === 2
    ? [spelers[1], spelers[0]]
    : [spelers[0]]
  const hoogtes = [80, 110, 60]
  const kleuren = ['#94a3b8', '#fbbf24', '#b45309']
  const origineel = spelers.length >= 3
    ? [1, 0, 2]
    : spelers.length === 2 ? [1, 0] : [0]

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', marginBottom: '24px', padding: '20px 16px 0' }}>
      {volgorde.map((speler, vi) => {
        const origIdx = origineel[vi]
        const hoogte = hoogtes[origIdx] ?? 60
        const kleur = kleuren[origIdx] ?? '#b45309'
        const waarde = speler[stat]
        return (
          <div key={speler.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {/* Avatar */}
            <div style={{
              width: origIdx === 0 ? '60px' : '48px',
              height: origIdx === 0 ? '60px' : '48px',
              borderRadius: '50%',
              background: kleur,
              border: `3px solid ${kleur}`,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {speler.photo_url
                ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: '800', fontSize: origIdx === 0 ? '22px' : '16px' }}>
                    {speler.name?.charAt(0)}
                  </span>
              }
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '2px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {speler.name?.split(' ')[0]}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: kleur }}>{waarde}</div>
            </div>
            {/* Podiumblok */}
            <div style={{
              width: '100%', height: `${hoogte}px`, borderRadius: '10px 10px 0 0',
              background: kleur, opacity: 0.15,
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '20px', fontWeight: '900', color: kleur, opacity: 1,
              }}>
                {origIdx + 1}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RijSpeler({ speler, positie, waarde, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '13px 16px', borderBottom: '1px solid #f8fafc',
    }}>
      <span style={{ fontSize: '13px', color: '#94a3b8', width: '20px', textAlign: 'center' }}>{positie}</span>
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {speler.photo_url
          ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>{speler.name?.charAt(0)}</span>
        }
      </div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{speler.name}</span>
      <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{waarde}</span>
    </div>
  )
}
