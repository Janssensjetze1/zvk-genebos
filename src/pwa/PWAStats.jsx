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
    <div style={{ background: '#07071a', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* ── Hero header ── */}
      <div style={{
        padding: '28px 20px 24px',
        background: 'linear-gradient(180deg, #0d0d2b 0%, #07071a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
          {seizoen?.name}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
          Statistieken
        </div>
        {!loading && (
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <StatPil waarde={goals.length} label="doelpunten" />
            <StatPil waarde={goals.filter(g => g.assist_id).length} label="assists" />
            <StatPil waarde={topscorers.length} label="scorers" />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
          <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.08)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Laden...</span>
        </div>
      ) : topscorers.length === 0 && topassists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚽</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>Nog geen statistieken</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Statistieken verschijnen na gespeelde wedstrijden.</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>

          {/* ── De Gouden Stier ── */}
          <SectieHeader
            emoji="🐂"
            titel="De Gouden Stier"
            subtitel="Topscorer van het seizoen"
            kleur="#f59e0b"
            glowKleur="rgba(245,158,11,0.2)"
          />
          {topscorers.length > 0 ? (
            <>
              <GloriePodium spelers={topscorers.slice(0, 3)} stat="goals" kleur="#f59e0b" glow="rgba(245,158,11,0.35)" />
              {topscorers.length > 3 && (
                <LijstKaart spelers={topscorers.slice(3)} stat="goals" offset={4} accentKleur="#f59e0b" />
              )}
            </>
          ) : (
            <LegeStaat tekst="Nog geen doelpunten gescoord." />
          )}

          {/* ── Assistenkoning ── */}
          <SectieHeader
            emoji="👑"
            titel="Assistenkoning"
            subtitel="Meeste assists van het seizoen"
            kleur="#a78bfa"
            glowKleur="rgba(167,139,250,0.2)"
            topMargin
          />
          {topassists.length > 0 ? (
            <>
              <GloriePodium spelers={topassists.slice(0, 3)} stat="assists" kleur="#a78bfa" glow="rgba(167,139,250,0.35)" />
              {topassists.length > 3 && (
                <LijstKaart spelers={topassists.slice(3)} stat="assists" offset={4} accentKleur="#a78bfa" />
              )}
            </>
          ) : (
            <LegeStaat tekst="Nog geen assists geregistreerd." />
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes podium-rise {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%       { box-shadow: 0 0 24px 6px rgba(245,158,11,0.3); }
        }
        @keyframes crown-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  )
}

// ── Mini statistiekpil in header ──────────────────────────────────────────────
function StatPil({ waarde, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{waarde}</span>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>{label}</span>
    </div>
  )
}

// ── Sectieheader ──────────────────────────────────────────────────────────────
function SectieHeader({ emoji, titel, subtitel, kleur, glowKleur, topMargin }) {
  return (
    <div style={{
      marginTop: topMargin ? '36px' : '28px',
      marginBottom: '20px',
      padding: '18px 20px',
      background: `linear-gradient(135deg, ${glowKleur}, rgba(255,255,255,0.02))`,
      border: `1px solid ${kleur}22`,
      borderRadius: '20px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px',
        background: `${kleur}18`,
        border: `1.5px solid ${kleur}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.01em' }}>{titel}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{subtitel}</div>
      </div>
    </div>
  )
}

// ── Podium ────────────────────────────────────────────────────────────────────
function GloriePodium({ spelers, stat, kleur, glow }) {
  if (spelers.length === 0) return null

  // Volgorde: 2e, 1e, 3e
  const volgorde = spelers.length >= 3
    ? [spelers[1], spelers[0], spelers[2]]
    : spelers.length === 2
    ? [spelers[1], spelers[0]]
    : [spelers[0]]

  // Welke originele index heeft elke visuele positie
  const origIdxen = spelers.length >= 3 ? [1, 0, 2] : spelers.length === 2 ? [1, 0] : [0]

  const podiumHoogtes = [100, 140, 72]
  const medalKleuren = [
    '#94a3b8',                  // zilver (#2)
    kleur,                      // goud (#1) — accentkleur
    '#b45309',                  // brons (#3)
  ]
  const medalLabels = ['2', '1', '3']
  const avatarSizes = [52, 70, 44]

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      gap: '6px', marginBottom: '16px', padding: '16px 8px 0',
    }}>
      {volgorde.map((speler, vi) => {
        const oi = origIdxen[vi]
        const isWinnaar = oi === 0
        const hoogte = podiumHoogtes[oi] ?? 60
        const mKleur = medalKleuren[oi] ?? '#94a3b8'
        const avSize = avatarSizes[oi] ?? 42
        const waarde = speler[stat]

        return (
          <div key={speler.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>

            {/* Kroon voor winnaar */}
            {isWinnaar && (
              <div style={{
                fontSize: '20px', lineHeight: 1,
                animation: 'crown-bounce 2s ease-in-out infinite',
                filter: `drop-shadow(0 0 6px ${kleur})`,
              }}>👑</div>
            )}

            {/* Avatar */}
            <div style={{
              width: avSize, height: avSize, borderRadius: '50%',
              border: `2.5px solid ${mKleur}`,
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${mKleur}22`,
              boxShadow: isWinnaar ? `0 0 0 3px ${kleur}30, 0 0 24px ${kleur}40` : `0 0 0 0 transparent`,
              animation: isWinnaar ? 'glow-pulse 3s ease-in-out infinite' : 'none',
              position: 'relative',
            }}>
              {speler.photo_url
                ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: '800', fontSize: isWinnaar ? '24px' : '16px' }}>
                    {speler.name?.charAt(0)}
                  </span>
              }
            </div>

            {/* Naam & score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isWinnaar ? '13px' : '11px',
                fontWeight: '700', color: isWinnaar ? 'white' : 'rgba(255,255,255,0.6)',
                maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {speler.name?.split(' ')[0]}
              </div>
              <div style={{
                fontSize: isWinnaar ? '26px' : '20px',
                fontWeight: '900', color: mKleur, lineHeight: 1,
                textShadow: isWinnaar ? `0 0 20px ${mKleur}` : 'none',
              }}>
                {waarde}
              </div>
            </div>

            {/* Podiumblok */}
            <div style={{
              width: '100%', height: `${hoogte}px`,
              borderRadius: '10px 10px 0 0',
              background: `linear-gradient(180deg, ${mKleur}28 0%, ${mKleur}10 100%)`,
              border: `1px solid ${mKleur}30`,
              borderBottom: 'none',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              paddingTop: '10px',
              transformOrigin: 'bottom',
              animation: 'podium-rise 0.5s ease-out both',
              animationDelay: `${vi * 0.08}s`,
            }}>
              <span style={{
                fontSize: '22px', fontWeight: '900',
                color: mKleur, opacity: 0.7,
              }}>
                {medalLabels[oi]}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lijst voor positie 4+ ─────────────────────────────────────────────────────
function LijstKaart({ spelers, stat, offset, accentKleur }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '8px',
    }}>
      {spelers.map((s, i) => {
        const waarde = s[stat]
        const isLast = i === spelers.length - 1
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '13px 16px',
            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{
              fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.2)',
              width: '22px', textAlign: 'center', flexShrink: 0,
            }}>{offset + i}</span>

            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {s.photo_url
                ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>{s.name?.charAt(0)}</span>
              }
            </div>

            <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.name}
            </span>

            <div style={{
              fontSize: '17px', fontWeight: '800', color: accentKleur,
              minWidth: '28px', textAlign: 'right',
              textShadow: `0 0 12px ${accentKleur}60`,
            }}>
              {waarde}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lege staat ────────────────────────────────────────────────────────────────
function LegeStaat({ tekst }) {
  return (
    <div style={{
      padding: '28px 16px', textAlign: 'center',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', marginBottom: '8px',
    }}>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>{tekst}</div>
    </div>
  )
}
