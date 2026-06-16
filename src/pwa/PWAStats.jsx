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
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* ── Hero header ── */}
      <div style={{
        padding: '28px 20px 20px',
        background: 'white',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {seizoen?.name}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
          Statistieken
        </div>
        {!loading && (
          <div style={{ display: 'flex', gap: '24px', marginTop: '14px' }}>
            <StatPil waarde={goals.length} label="doelpunten" />
            <StatPil waarde={goals.filter(g => g.assist_id).length} label="assists" />
            <StatPil waarde={topscorers.length} label="scorers" />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '14px' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #f1f5f9', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Laden...</span>
        </div>
      ) : topscorers.length === 0 && topassists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚽</div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#64748b' }}>Nog geen statistieken</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Statistieken verschijnen na gespeelde wedstrijden.</div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>

          {/* ── De Gouden Stier ── */}
          <SectieHeader
            emoji="🐂"
            titel="De Gouden Stier"
            subtitel="Topscorer van het seizoen"
            kleur="#d97706"
            achtergrond="#fffbeb"
            rand="#fde68a"
          />
          {topscorers.length > 0 ? (
            <>
              <GloriePodium spelers={topscorers.slice(0, 3)} stat="goals" accentKleur="#d97706" />
              {topscorers.length > 3 && (
                <LijstKaart spelers={topscorers.slice(3)} stat="goals" offset={4} accentKleur="#d97706" />
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
            kleur="#7c3aed"
            achtergrond="#f5f3ff"
            rand="#ddd6fe"
            topMargin
          />
          {topassists.length > 0 ? (
            <>
              <GloriePodium spelers={topassists.slice(0, 3)} stat="assists" accentKleur="#7c3aed" />
              {topassists.length > 3 && (
                <LijstKaart spelers={topassists.slice(3)} stat="assists" offset={4} accentKleur="#7c3aed" />
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
        @keyframes crown-bounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

// ── Mini statistiekpil ────────────────────────────────────────────────────────
function StatPil({ waarde, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
      <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{waarde}</span>
      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{label}</span>
    </div>
  )
}

// ── Sectieheader ──────────────────────────────────────────────────────────────
function SectieHeader({ emoji, titel, subtitel, kleur, achtergrond, rand, topMargin }) {
  return (
    <div style={{
      marginTop: topMargin ? '32px' : '24px',
      marginBottom: '18px',
      padding: '16px 18px',
      background: achtergrond,
      border: `1.5px solid ${rand}`,
      borderRadius: '18px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '13px',
        background: 'white',
        border: `1.5px solid ${rand}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', flexShrink: 0,
        boxShadow: `0 2px 8px ${kleur}20`,
      }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>{titel}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{subtitel}</div>
      </div>
    </div>
  )
}

// ── Podium ────────────────────────────────────────────────────────────────────
// Gesorteerde array: index 0 = beste speler, index 1 = tweede, index 2 = derde
// Visuele volgorde podium: links=2e, midden=1e, rechts=3e
// origIdx = positie in originele gesorteerde array (0=1e, 1=2e, 2=3e)
function GloriePodium({ spelers, stat, accentKleur }) {
  if (spelers.length === 0) return null

  // Visuele volgorde: 2e links, 1e midden, 3e rechts
  const volgorde = spelers.length >= 3
    ? [spelers[1], spelers[0], spelers[2]]
    : spelers.length === 2
    ? [spelers[1], spelers[0]]
    : [spelers[0]]

  // origIdx[vi] = index in de gesorteerde array voor visuele positie vi
  const origIdxen = spelers.length >= 3 ? [1, 0, 2]
    : spelers.length === 2 ? [1, 0] : [0]

  // Geïndexeerd op origIdx (0=1e, 1=2e, 2=3e)
  const podiumHoogtes  = [140, 100, 70]          // 1e hoogst
  const medalKleuren   = [accentKleur, '#94a3b8', '#b45309']  // 1e=goud, 2e=zilver, 3e=brons
  const medalLabels    = ['1', '2', '3']
  const avatarSizes    = [68, 52, 42]            // 1e = grootste avatar

  return (
    <div style={{
      background: 'white',
      border: '1px solid #f1f5f9',
      borderRadius: '20px',
      padding: '20px 12px 0',
      marginBottom: '12px',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '6px' }}>
        {volgorde.map((speler, vi) => {
          const oi = origIdxen[vi]
          const isWinnaar = oi === 0
          const hoogte    = podiumHoogtes[oi]  ?? 60
          const mKleur    = medalKleuren[oi]   ?? '#94a3b8'
          const avSize    = avatarSizes[oi]    ?? 42
          const waarde    = speler[stat]

          return (
            <div key={speler.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>

              {/* Bouncing kroon boven winnaar */}
              {isWinnaar && (
                <div style={{
                  fontSize: '22px', lineHeight: 1,
                  animation: 'crown-bounce 2.2s ease-in-out infinite',
                  filter: `drop-shadow(0 2px 4px ${mKleur}80)`,
                }}>👑</div>
              )}

              {/* Avatar */}
              <div style={{
                width: avSize, height: avSize, borderRadius: '50%',
                border: `3px solid ${mKleur}`,
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${mKleur}18`,
                boxShadow: isWinnaar
                  ? `0 0 0 4px ${mKleur}20, 0 4px 20px ${mKleur}40`
                  : `0 2px 8px rgba(0,0,0,0.08)`,
              }}>
                {speler.photo_url
                  ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: isWinnaar ? 'white' : '#475569', fontWeight: '800', fontSize: isWinnaar ? '24px' : '16px', background: `${mKleur}22` }}>
                      {speler.name?.charAt(0)}
                    </span>
                }
              </div>

              {/* Naam & score */}
              <div style={{ textAlign: 'center', paddingBottom: '2px' }}>
                <div style={{
                  fontSize: isWinnaar ? '13px' : '11px',
                  fontWeight: '700',
                  color: isWinnaar ? '#0f172a' : '#64748b',
                  maxWidth: '82px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {speler.name?.split(' ')[0]}
                </div>
                <div style={{
                  fontSize: isWinnaar ? '28px' : '20px',
                  fontWeight: '900',
                  color: mKleur,
                  lineHeight: 1.1,
                }}>
                  {waarde}
                </div>
              </div>

              {/* Podiumblok */}
              <div style={{
                width: '100%',
                height: `${hoogte}px`,
                borderRadius: '10px 10px 0 0',
                background: isWinnaar
                  ? `linear-gradient(180deg, ${mKleur}22 0%, ${mKleur}10 100%)`
                  : `linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)`,
                borderTop: `2px solid ${mKleur}40`,
                borderLeft: `1px solid ${isWinnaar ? mKleur + '30' : '#e2e8f0'}`,
                borderRight: `1px solid ${isWinnaar ? mKleur + '30' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '10px',
                transformOrigin: 'bottom',
                animation: 'podium-rise 0.45s ease-out both',
                animationDelay: `${vi * 0.1}s`,
              }}>
                <span style={{
                  fontSize: '20px', fontWeight: '900',
                  color: isWinnaar ? mKleur : '#cbd5e1',
                }}>
                  {medalLabels[oi]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Lijst voor positie 4+ ─────────────────────────────────────────────────────
function LijstKaart({ spelers, stat, offset, accentKleur }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #f1f5f9',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      {spelers.map((s, i) => {
        const waarde = s[stat]
        const isLast = i === spelers.length - 1
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '13px 16px',
            borderBottom: isLast ? 'none' : '1px solid #f8fafc',
          }}>
            <span style={{
              fontSize: '13px', fontWeight: '700', color: '#cbd5e1',
              width: '22px', textAlign: 'center', flexShrink: 0,
            }}>{offset + i}</span>

            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#f8fafc', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #f1f5f9',
            }}>
              {s.photo_url
                ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8' }}>{s.name?.charAt(0)}</span>
              }
            </div>

            <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.name}
            </span>

            <span style={{
              fontSize: '17px', fontWeight: '800', color: accentKleur,
              minWidth: '28px', textAlign: 'right',
            }}>
              {waarde}
            </span>
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
      padding: '24px 16px', textAlign: 'center',
      background: 'white', border: '1px solid #f1f5f9',
      borderRadius: '16px', marginBottom: '8px',
    }}>
      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{tekst}</div>
    </div>
  )
}
