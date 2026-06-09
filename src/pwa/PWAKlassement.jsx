import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'

export default function PWAKlassement() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [alleTeams, setAlleTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (seizoen) fetchData() }, [seizoen])

  async function fetchData() {
    setLoading(true)
    const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
      supabase.from('teams').select('id, name, is_zvk').order('name'),
      supabase
        .from('matches')
        .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk)')
        .eq('season_id', seizoen.id)
        .eq('type', 'competitie')
        .order('date', { ascending: true }),
    ])
    setAlleTeams(teamsData ?? [])
    setWedstrijden(matchesData ?? [])
    setLoading(false)
  }

  function berekenKlassement() {
    const vandaag = new Date().toISOString().split('T')[0]

    // Stap 1: begin met ALLE teams op 0
    const teams = {}
    for (const team of alleTeams) {
      teams[team.id] = { id: team.id, name: team.name, is_zvk: team.is_zvk, g: 0, w: 0, ge: 0, v: 0, dv: 0, dt: 0, pnt: 0 }
    }

    // Stap 2: tel stats enkel voor gespeelde wedstrijden (datum in verleden + score ingevuld)
    for (const w of wedstrijden) {
      const { home_team, away_team, home_score, away_score, date } = w
      if (!home_team || !away_team) continue
      if (date >= vandaag) continue
      if (home_score == null || away_score == null) continue
      const thuis = teams[home_team.id]
      const uit = teams[away_team.id]
      thuis.g++; uit.g++
      thuis.dv += home_score; thuis.dt += away_score
      uit.dv += away_score; uit.dt += home_score
      if (home_score > away_score) { thuis.w++; thuis.pnt += 3; uit.v++ }
      else if (home_score < away_score) { uit.w++; uit.pnt += 3; thuis.v++ }
      else { thuis.ge++; thuis.pnt++; uit.ge++; uit.pnt++ }
    }

    return Object.values(teams).sort((a, b) => {
      if (b.pnt !== a.pnt) return b.pnt - a.pnt
      const saldoB = b.dv - b.dt, saldoA = a.dv - a.dt
      if (saldoB !== saldoA) return saldoB - saldoA
      return b.dv - a.dv
    })
  }

  const klassement = berekenKlassement()

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Klassement</h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>{seizoen?.name} · Competitie</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
      ) : klassement.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
          Geen competitiewedstrijden ingepland dit seizoen.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 28px 28px 28px 36px',
            padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
            fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>#</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>G</span>
            <span style={{ textAlign: 'center' }}>W</span>
            <span style={{ textAlign: 'center' }}>V</span>
            <span style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>Pnt</span>
          </div>

          {klassement.map((team, i) => {
            const isZVK = team.is_zvk
            const top3 = i < 3
            return (
              <div key={team.id} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 28px 28px 28px 36px',
                padding: '13px 14px', alignItems: 'center',
                borderBottom: i < klassement.length - 1 ? '1px solid #f8fafc' : 'none',
                background: isZVK ? '#eff6ff' : 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {top3 ? (
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#b45309',
                      color: 'white', fontSize: '11px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '3px' }}>{i + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: '14px', fontWeight: isZVK ? '700' : '500', color: isZVK ? '#1d4ed8' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team.name}
                </span>
                <span style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{team.g}</span>
                <span style={{ textAlign: 'center', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{team.w}</span>
                <span style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>{team.v}</span>
                <span style={{ textAlign: 'center', fontSize: '15px', fontWeight: '800', color: isZVK ? '#1d4ed8' : '#0f172a' }}>{team.pnt}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
