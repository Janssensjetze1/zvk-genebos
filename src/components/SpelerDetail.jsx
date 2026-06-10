import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

const CAT = {
  brons:     { ro: '#e8a87c', ri: '#9a5c1a', rc: '#fff3e0', label: 'Brons',     lb: '#fff7ed', lc: '#c2410c', lbo: '#fed7aa' },
  zilver:    { ro: '#cfd8dc', ri: '#546e7a', rc: '#eceff1', label: 'Zilver',    lb: '#f8fafc', lc: '#475569', lbo: '#cbd5e1' },
  goud:      { ro: '#ffe082', ri: '#b06c00', rc: '#fff8e1', label: 'Goud',      lb: '#fefce8', lc: '#a16207', lbo: '#fde68a' },
  legendary: { ro: '#a78bfa', ri: '#4c1d95', rc: '#ede9fe', label: 'Legendary', lb: '#faf5ff', lc: '#7c3aed', lbo: '#ddd6fe' },
  geheim:    { ro: '#334155', ri: '#0f172a', rc: '#1e293b', label: '???',       lb: '#0f172a', lc: '#94a3b8', lbo: '#1e293b' },
}

// Preview badges — conditie gebaseerd op speler stats
const BADGES = [
  {
    id: 'welkom',
    emoji: '🔐',
    naam: 'Welkom',
    beschrijving: 'Eerste wedstrijd gespeeld voor ZVK Genebos.',
    categorie: 'brons',
    conditieTekst: 'Verdiend bij je eerste match.',
    conditie: (s) => s.aantalWedstrijden >= 1,
  },
  {
    id: 'test_badge',
    emoji: '🧪',
    naam: 'Test badge',
    beschrijving: 'Een badge die nog wacht om verdiend te worden.',
    categorie: 'zilver',
    conditieTekst: null,
    conditie: () => false,
  },
]

// ── Hex badge component ─────────────────────────────────────────────────────
function BadgeHex({ emoji, categorie, size = 70, verdiend }) {
  const cat = CAT[categorie] ?? CAT.zilver
  const H  = Math.round(size * 1.155)
  const iW = Math.round(size * 0.8125)
  const iH = Math.round(iW * 1.155)
  const iL = Math.round((size - iW) / 2)
  const iT = Math.round((H - iH) / 2)
  const cD = Math.round(iW * 0.70)
  const fs = Math.round(cD * 0.52)
  return (
    <div style={{
      position: 'relative', width: size, height: H, flexShrink: 0,
      filter: verdiend ? 'none' : 'grayscale(1)',
      opacity: verdiend ? 1 : 0.35,
      transition: 'opacity 0.2s, filter 0.2s',
    }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: HEX, background: cat.ro }} />
      <div style={{
        position: 'absolute', left: iL, top: iT, width: iW, height: iH,
        clipPath: HEX, background: cat.ri,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: cD, height: cD, borderRadius: '50%', background: cat.rc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, lineHeight: 1,
        }}>
          {verdiend ? emoji : '❓'}
        </div>
      </div>
    </div>
  )
}

// ── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({ waarde, label, kleur, tekstkleur }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: kleur, borderRadius: '14px' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: tekstkleur, lineHeight: 1 }}>{waarde}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', fontWeight: '500' }}>{label}</div>
    </div>
  )
}

// ── Stats tab ───────────────────────────────────────────────────────────────
function StatsTab({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Dit seizoen */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          Dit seizoen
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatChip waarde={stats.seizoenGoals}   label="Goals"   kleur="#eff6ff" tekstkleur="#1d4ed8" />
          <StatChip waarde={stats.seizoenAssists} label="Assists" kleur="#f0fdf4" tekstkleur="#15803d" />
          <StatChip waarde={stats.seizoenMatches} label="Matchen" kleur="#f8fafc" tekstkleur="#475569" />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#f1f5f9' }} />

      {/* All-time */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          All-time
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatChip waarde={stats.aantalGoals}     label="Goals"   kleur="#eff6ff" tekstkleur="#1d4ed8" />
          <StatChip waarde={stats.aantalAssists}   label="Assists" kleur="#f0fdf4" tekstkleur="#15803d" />
          <StatChip waarde={stats.aantalWedstrijden} label="Matchen" kleur="#f8fafc" tekstkleur="#475569" />
        </div>
      </div>

      {/* Hattrick bonus */}
      {stats.hattricks > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>🔥</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#c2410c' }}>
              {stats.hattricks}× Hattrick
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              3+ goals in één wedstrijd gescoord
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Badges tab ──────────────────────────────────────────────────────────────
function BadgesTab({ badges, geselecteerdeBadge, setGeselecteerdeBadge }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {badges.map(badge => {
          const cat = CAT[badge.categorie]
          return (
            <div
              key={badge.id}
              onClick={() => badge.verdiend && setGeselecteerdeBadge(badge)}
              style={{
                background: 'white', border: `1.5px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                borderRadius: '16px', padding: '16px 12px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                cursor: badge.verdiend ? 'pointer' : 'default', position: 'relative',
                transition: 'transform 0.12s',
              }}
              onPointerDown={e => badge.verdiend && (e.currentTarget.style.transform = 'scale(0.96)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                border: `1.5px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: badge.verdiend ? '#16a34a' : undefined,
              }}>
                {badge.verdiend ? '✓' : '🔒'}
              </div>

              <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={72} verdiend={badge.verdiend} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: badge.verdiend ? '#0f172a' : '#94a3b8', marginBottom: '5px' }}>
                  {badge.naam}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
                  background: badge.verdiend ? cat.lb : '#f1f5f9',
                  color: badge.verdiend ? cat.lc : '#94a3b8',
                  border: `1px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                }}>
                  {cat.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Badge detail inline */}
      {geselecteerdeBadge && (() => {
        const badge = geselecteerdeBadge
        const cat = CAT[badge.categorie]
        return (
          <div style={{
            marginTop: '16px', background: 'white', border: `1.5px solid ${cat.lbo}`,
            borderRadius: '16px', padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          }}>
            <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{badge.naam}</div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{badge.beschrijving}</p>
            </div>
            <div style={{
              width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '12px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: '#dcfce7', border: '1.5px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: '#16a34a', fontWeight: '700',
              }}>✓</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>Verdiend!</div>
                {badge.conditieTekst && (
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>{badge.conditieTekst}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setGeselecteerdeBadge(null)}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: '10px',
                padding: '8px 20px', fontSize: '13px', fontWeight: '600',
                color: '#475569', cursor: 'pointer',
              }}
            >
              Sluiten
            </button>
          </div>
        )
      })()}
    </div>
  )
}

// ── Hoofd component ─────────────────────────────────────────────────────────
// variant: 'sheet' (bottom sheet, PWA) | 'modal' (centered modal, desktop)
export default function SpelerDetail({ speler, seizoenId, onClose, variant = 'sheet' }) {
  const [tab, setTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geselecteerdeBadge, setGeselecteerdeBadge] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [speler.id, seizoenId])

  async function fetchStats() {
    setLoading(true)
    const [goalsRes, assistsRes, matchesRes] = await Promise.all([
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('scorer_id', speler.id),
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('assist_id', speler.id),
      supabase.from('match_players')
        .select('match_id, match:match_id(season_id)')
        .eq('player_id', speler.id),
    ])

    const goalsArr   = goalsRes.data   ?? []
    const assistArr  = assistsRes.data  ?? []
    const matchesArr = matchesRes.data  ?? []

    // Hattricks: groepeer goals per match
    const goalsByMatch = {}
    goalsArr.forEach(g => {
      if (g.match_id) goalsByMatch[g.match_id] = (goalsByMatch[g.match_id] || 0) + 1
    })
    const hattricks = Object.values(goalsByMatch).filter(n => n >= 3).length
    const maxGoalsInWedstrijd = Math.max(0, ...Object.values(goalsByMatch))

    setStats({
      // All-time
      aantalGoals:       goalsArr.length,
      aantalAssists:     assistArr.length,
      aantalWedstrijden: matchesArr.length,
      // Dit seizoen
      seizoenGoals:   goalsArr.filter(g => g.match?.season_id === seizoenId).length,
      seizoenAssists: assistArr.filter(g => g.match?.season_id === seizoenId).length,
      seizoenMatches: matchesArr.filter(m => m.match?.season_id === seizoenId).length,
      // Badges
      hattricks,
      maxGoalsInWedstrijd,
    })
    setLoading(false)
  }

  const badgesMetStatus = BADGES.map(b => ({
    ...b,
    verdiend: stats ? b.conditie(stats) : false,
  }))

  // ── Gedeelde blokken ────────────────────────────────────────────────────
  const spelerHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '68px', height: '68px', borderRadius: '50%', flexShrink: 0,
        background: '#eff6ff', border: '2px solid #bfdbfe',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {speler.photo_url
          ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '26px', fontWeight: '700', color: '#3b82f6' }}>{speler.name?.charAt(0)}</span>
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: speler.nickname ? '2px' : 0 }}>
          {speler.name}
        </div>
        {speler.nickname && (
          <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginBottom: '2px' }}>
            "{speler.nickname}"
          </div>
        )}
        {speler.position && (
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{speler.position}</div>
        )}
      </div>
    </div>
  )

  const tabBar = (
    <div style={{
      display: 'flex', gap: '4px',
      background: '#f1f5f9', borderRadius: '12px', padding: '4px',
      marginTop: '18px',
    }}>
      {[
        { id: 'stats',  label: '📊 Statistieken' },
        { id: 'badges', label: '🏅 Badges' },
      ].map(t => (
        <button
          key={t.id}
          onClick={() => { setTab(t.id); setGeselecteerdeBadge(null) }}
          style={{
            flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? '#0f172a' : '#64748b',
            fontSize: '13px', fontWeight: tab === t.id ? '700' : '500',
            cursor: 'pointer',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  const inhoud = loading ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
      <div style={{ width: '22px', height: '22px', border: '2.5px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Stats laden...</span>
    </div>
  ) : tab === 'stats' ? (
    <StatsTab stats={stats} />
  ) : (
    <BadgesTab badges={badgesMetStatus} geselecteerdeBadge={geselecteerdeBadge} setGeselecteerdeBadge={setGeselecteerdeBadge} />
  )

  // ── Bottom sheet (PWA) ──────────────────────────────────────────────────
  if (variant === 'sheet') {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)' }} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: 'white', borderRadius: '24px 24px 0 0',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.25)',
        }}>
          {/* Handle + header + tabs */}
          <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '0 auto 20px' }} />
            {spelerHeader}
            {tabBar}
            <div style={{ height: '20px' }} />
          </div>
          {/* Scrollbaar inhoudsgebied */}
          <div style={{ overflow: 'auto', flex: 1, padding: '0 24px calc(env(safe-area-inset-bottom) + 40px)' }}>
            {inhoud}
          </div>
        </div>
      </>
    )
  }

  // ── Modal (desktop) ─────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 301,
        transform: 'translate(-50%, -50%)',
        background: 'white', borderRadius: '22px',
        width: '500px', maxWidth: 'calc(100vw - 32px)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }}>
        {/* Sluitknop */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 1,
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#f1f5f9', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: '#64748b', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
        >✕</button>

        <div style={{ padding: '28px 28px 0', flexShrink: 0 }}>
          {spelerHeader}
          {tabBar}
          <div style={{ height: '20px' }} />
        </div>
        <div style={{ overflow: 'auto', flex: 1, padding: '0 28px 28px' }}>
          {inhoud}
        </div>
      </div>
    </>
  )
}
