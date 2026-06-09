import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'

export default function PWASpelers() {
  const { actief: seizoen } = useSeason()
  const [spelers, setSpelers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')

  useEffect(() => { if (seizoen) fetchData() }, [seizoen])

  async function fetchData() {
    setLoading(true)
    const vandaag = new Date().toISOString().split('T')[0]
    const [{ data: sData }, { data: gData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('goals').select('scorer_id, match:match_id(date, season_id)')
        .eq('match.season_id', seizoen.id),
    ])
    setSpelers(sData ?? [])
    setGoals((gData ?? []).filter(g => g.match?.date < vandaag))
    setLoading(false)
  }

  const doelpuntenMap = {}
  for (const g of goals) {
    if (g.scorer_id) doelpuntenMap[g.scorer_id] = (doelpuntenMap[g.scorer_id] || 0) + 1
  }

  const gefilterd = spelers
    .filter(s => s.name.toLowerCase().includes(zoek.toLowerCase()))
    .map(s => ({ ...s, goals: doelpuntenMap[s.id] || 0 }))
    .sort((a, b) => b.goals - a.goals)

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Spelers</h1>

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={zoek} onChange={e => setZoek(e.target.value)}
          placeholder="Zoek speler..."
          style={{
            width: '100%', padding: '0 14px 0 42px', height: '44px', fontSize: '15px',
            border: '1.5px solid #e2e8f0', borderRadius: '12px', outline: 'none',
            background: 'white', boxSizing: 'border-box', color: '#0f172a',
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gefilterd.map((speler, i) => (
            <div key={speler.id} style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              {/* Positie */}
              <span style={{ fontSize: '12px', color: '#cbd5e1', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {i + 1}
              </span>

              {/* Foto */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: '#eff6ff', border: '2px solid #bfdbfe',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {speler.photo_url
                  ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '17px', fontWeight: '700', color: '#3b82f6' }}>{speler.name?.charAt(0)}</span>
                }
              </div>

              {/* Naam */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {speler.name}
                </div>
                {speler.position && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{speler.position}</div>
                )}
              </div>

              {/* Goals */}
              {speler.goals > 0 && (
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{speler.goals}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>doelpunten</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
