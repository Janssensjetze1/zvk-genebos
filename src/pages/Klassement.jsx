import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { useIsMobile } from '../hooks/useIsMobile'

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  beker: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}

export default function Klassement() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [actieveTab, setActieveTab] = useState('competitie')

  useEffect(() => { if (seizoen) fetchWedstrijden() }, [seizoen])

  async function fetchWedstrijden() {
    setLoading(true)
    const vandaag = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name, is_zvk),
        away_team:away_team_id(id, name, is_zvk)
      `)
      .eq('season_id', seizoen.id)
      .lt('date', vandaag) // enkel gespeelde wedstrijden
      .order('date', { ascending: true })
    setWedstrijden(data ?? [])
    setLoading(false)
  }

  // Bereken klassement voor een bepaald type wedstrijd
  function berekenKlassement(type) {
    const gefilterd = wedstrijden.filter(w => w.type === type)
    const teams = {}

    for (const w of gefilterd) {
      const { home_team, away_team, home_score, away_score } = w
      if (!home_team || !away_team) continue

      // Initialiseer teams
      for (const team of [home_team, away_team]) {
        if (!teams[team.id]) {
          teams[team.id] = {
            id: team.id,
            name: team.name,
            is_zvk: team.is_zvk,
            gespeeld: 0, gewonnen: 0, gelijkspel: 0, verloren: 0,
            doelpuntenVoor: 0, doelpuntenTegen: 0, punten: 0,
          }
        }
      }

      const thuis = teams[home_team.id]
      const uit = teams[away_team.id]

      thuis.gespeeld++
      uit.gespeeld++
      thuis.doelpuntenVoor += home_score
      thuis.doelpuntenTegen += away_score
      uit.doelpuntenVoor += away_score
      uit.doelpuntenTegen += home_score

      if (home_score > away_score) {
        thuis.gewonnen++; thuis.punten += 3
        uit.verloren++
      } else if (home_score < away_score) {
        uit.gewonnen++; uit.punten += 3
        thuis.verloren++
      } else {
        thuis.gelijkspel++; thuis.punten++
        uit.gelijkspel++; uit.punten++
      }
    }

    return Object.values(teams).sort((a, b) => {
      if (b.punten !== a.punten) return b.punten - a.punten
      const saldoB = b.doelpuntenVoor - b.doelpuntenTegen
      const saldoA = a.doelpuntenVoor - a.doelpuntenTegen
      if (saldoB !== saldoA) return saldoB - saldoA
      return b.doelpuntenVoor - a.doelpuntenVoor
    })
  }

  const isMobile = useIsMobile()
  const tabs = ['competitie']
  const klassement = berekenKlassement(actieveTab)
  const zvkPos = klassement.findIndex(t => t.is_zvk)

  if (!seizoen) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>Selecteer eerst een seizoen via Beheer → Seizoenen.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Klassement</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{seizoen.name}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {tabs.map(tab => {
          const actief = tab === actieveTab
          return (
            <button
              key={tab}
              onClick={() => setActieveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: actief ? '600' : '400',
                background: actief ? 'white' : 'transparent',
                color: actief ? '#0f172a' : '#64748b',
                boxShadow: actief ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {TYPE_LABELS[tab]}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>
      ) : klassement.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Nog geen {TYPE_LABELS[actieveTab].toLowerCase()}wedstrijden gespeeld dit seizoen.</p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '36px 1fr 36px 36px 48px' : '40px 1fr 48px 48px 48px 48px 64px 64px 48px',
            padding: '10px 14px',
            borderBottom: '1px solid #f1f5f9',
            fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>#</span>
            <span>Team</span>
            {!isMobile && <><span style={{ textAlign: 'center' }}>G</span><span style={{ textAlign: 'center' }}>W</span><span style={{ textAlign: 'center' }}>G</span><span style={{ textAlign: 'center' }}>V</span><span style={{ textAlign: 'center' }}>DV–DT</span><span style={{ textAlign: 'center' }}>Saldo</span></>}
            {isMobile && <><span style={{ textAlign: 'center' }}>G</span><span style={{ textAlign: 'center' }}>W-G-V</span></>}
            <span style={{ textAlign: 'center', fontWeight: '700' }}>Pnt</span>
          </div>

          {/* Rijen */}
          {klassement.map((team, i) => {
            const isZVK = team.is_zvk
            const saldo = team.doelpuntenVoor - team.doelpuntenTegen
            const top3 = i < 3

            return (
              <div
                key={team.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '36px 1fr 36px 36px 48px' : '40px 1fr 48px 48px 48px 48px 64px 64px 48px',
                  padding: isMobile ? '12px 14px' : '13px 16px',
                  borderBottom: i < klassement.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: isZVK ? 'rgba(59,130,246,0.04)' : 'white',
                  alignItems: 'center',
                }}
              >
                {/* Positie */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {top3 ? (
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#b45309',
                      color: 'white', fontSize: '11px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500', paddingLeft: '4px' }}>{i + 1}</span>
                  )}
                </div>

                {/* Teamnaam */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{
                    fontSize: isMobile ? '13px' : '14px', fontWeight: isZVK ? '600' : '400',
                    color: isZVK ? '#1d4ed8' : '#0f172a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {team.name}
                  </span>
                  {isZVK && !isMobile && (
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#3b82f6', background: '#eff6ff', padding: '1px 6px', borderRadius: '10px', flexShrink: 0 }}>ZVK</span>
                  )}
                </div>

                {/* Desktop stats */}
                {!isMobile && <>
                  <span style={statStijl}>{team.gespeeld}</span>
                  <span style={{ ...statStijl, color: '#16a34a' }}>{team.gewonnen}</span>
                  <span style={{ ...statStijl, color: '#64748b' }}>{team.gelijkspel}</span>
                  <span style={{ ...statStijl, color: '#ef4444' }}>{team.verloren}</span>
                  <span style={{ ...statStijl, fontSize: '12px' }}>{team.doelpuntenVoor}–{team.doelpuntenTegen}</span>
                  <span style={{ ...statStijl, color: saldo > 0 ? '#16a34a' : saldo < 0 ? '#ef4444' : '#64748b', fontWeight: '600' }}>
                    {saldo > 0 ? '+' : ''}{saldo}
                  </span>
                </>}

                {/* Mobile stats: alleen gespeeld + W-G-V compact */}
                {isMobile && <>
                  <span style={statStijl}>{team.gespeeld}</span>
                  <span style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>{team.gewonnen}</span>
                    <span style={{ color: '#94a3b8' }}>-</span>
                    <span>{team.gelijkspel}</span>
                    <span style={{ color: '#94a3b8' }}>-</span>
                    <span style={{ color: '#ef4444', fontWeight: '600' }}>{team.verloren}</span>
                  </span>
                </>}

                {/* Punten */}
                <span style={{ textAlign: 'center', fontSize: '14px', fontWeight: '700', color: isZVK ? '#1d4ed8' : '#0f172a' }}>
                  {team.punten}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Legenda — enkel desktop */}
      {!isMobile && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {['G = Gespeeld', 'W = Gewonnen', 'G = Gelijkspel', 'V = Verloren', 'DV–DT = Doelpunten voor–tegen', 'Pnt = Punten'].map(label => (
            <span key={label} style={{ fontSize: '11px', color: '#cbd5e1' }}>{label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const statStijl = {
  textAlign: 'center', fontSize: '13px', color: '#475569',
}
