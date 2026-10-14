import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BADGES, CATEGORIE_VOLGORDE, CAT, SHINE, verborgen } from '../data/badges'
import { computeStats, haalPronostiekStats, haalSupporterStats } from '../lib/badgeStats'
import SpelerAvatar from './SpelerAvatar'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'


// ── Hex badge ───────────────────────────────────────────────────────────────
function BadgeHex({ emoji, categorie, size = 64, verdiend }) {
  const cat = CAT[categorie]   ?? CAT.zilver
  const sh  = SHINE[categorie] ?? SHINE.zilver
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
      filter: verdiend
        ? `drop-shadow(0 2px 6px ${sh.glow}) drop-shadow(0 0 12px ${sh.glow})`
        : 'grayscale(1)',
      opacity: verdiend ? 1 : 0.35,
      transition: 'opacity 0.2s, filter 0.2s',
    }}>
      <div style={{
        position: 'absolute', inset: 0, clipPath: HEX,
        background: verdiend ? sh.outerGrad : cat.ro,
      }} />
      <div style={{
        position: 'absolute', left: iL, top: iT, width: iW, height: iH,
        clipPath: HEX,
        background: verdiend ? sh.innerGrad : cat.ri,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: cD, height: cD, borderRadius: '50%',
          background: verdiend ? sh.circleGrad : cat.rc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, lineHeight: 1,
        }}>
          {verdiend ? emoji : '❓'}
        </div>
      </div>
      {/* Platina glitter sterretjes */}
      {verdiend && categorie === 'platina' && [
        { top: '-14%', left:  '8%',  s: 0.20, d: '0.0s', t: '1.8s' },
        { top:  '-5%', left: '72%',  s: 0.16, d: '0.5s', t: '1.6s' },
        { top:  '38%', left: '108%', s: 0.18, d: '1.1s', t: '2.0s' },
        { top:  '90%', left: '68%',  s: 0.17, d: '0.3s', t: '1.7s' },
        { top:  '85%', left: '-10%', s: 0.15, d: '0.8s', t: '1.9s' },
        { top:  '22%', left: '-8%',  s: 0.14, d: '1.4s', t: '1.5s' },
      ].map((sp, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: sp.top, left: sp.left,
          fontSize: Math.max(5, Math.round(size * sp.s)),
          color: 'white',
          textShadow: '0 0 4px #bae6fd, 0 0 8px #7dd3fc',
          animation: `glitter ${sp.t} ${sp.d} ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 10, lineHeight: 1,
        }}>✦</div>
      ))}
    </div>
  )
}

// ── Stat chip ───────────────────────────────────────────────────────────────
function StatChip({ waarde, label, kleur, tekstkleur }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: kleur, borderRadius: '14px' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: tekstkleur, lineHeight: 1 }}>{waarde}</div>
      <div style={{ fontSize: '11px', color: 'var(--z-tekst-4)', marginTop: '5px', fontWeight: '500' }}>{label}</div>
    </div>
  )
}

// ── Stats tab ───────────────────────────────────────────────────────────────
function StatsTab({ stats }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          Dit seizoen
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatChip waarde={stats.seizoenGoals}   label="Goals"   kleur="#eff6ff" tekstkleur="#1d4ed8" />
          <StatChip waarde={stats.seizoenAssists} label="Assists" kleur="#f0fdf4" tekstkleur="#15803d" />
          <StatChip waarde={stats.seizoenMatches} label="Matchen" kleur="#f8fafc" tekstkleur="#475569" />
        </div>
      </div>
      <div style={{ height: '1px', background: 'var(--z-lijn-zacht)' }} />
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          All-time
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatChip waarde={stats.aantalGoals}       label="Goals"   kleur="#eff6ff" tekstkleur="#1d4ed8" />
          <StatChip waarde={stats.aantalAssists}     label="Assists" kleur="#f0fdf4" tekstkleur="#15803d" />
          <StatChip waarde={stats.aantalWedstrijden} label="Matchen" kleur="#f8fafc" tekstkleur="#475569" />
        </div>
      </div>
      {stats.hattricks > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>🔥</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#c2410c' }}>{stats.hattricks}× Hattrick</div>
            <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>3+ goals in één wedstrijd</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Badges tab ──────────────────────────────────────────────────────────────
function BadgesTab({ badgesMetStatus, geselecteerdeBadge, setGeselecteerdeBadge }) {
  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length

  return (
    <div>
      {/* Voortgang */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '5px', background: 'var(--z-lijn-zacht)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(aantalVerdiend / BADGES.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--z-blauw-500), #8b5cf6)',
            borderRadius: '99px', transition: 'width 0.6s',
          }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--z-tekst-4)', fontWeight: '600', flexShrink: 0 }}>
          {aantalVerdiend}/{BADGES.length}
        </span>
      </div>

      {/* Per categorie */}
      {CATEGORIE_VOLGORDE.map((cat, catIdx) => {
        const groep = badgesMetStatus.filter(b => b.categorie === cat)
        if (groep.length === 0) return null
        const catInfo = CAT[cat]
        const verdiendInGroep = groep.filter(b => b.verdiend).length
        return (
          <div key={cat} style={{ marginBottom: '18px', marginTop: catIdx === 0 ? 0 : '4px' }}>
            {/* Categorie header: horizontale scheidingslijn */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{
                fontSize: '10px', fontWeight: '800', color: catInfo.lc,
                textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
              }}>
                {catInfo.label}
              </span>
              <div style={{ flex: 1, height: '1px', background: catInfo.lbo }} />
              <span style={{ fontSize: '10px', color: 'var(--z-tekst-4)', flexShrink: 0, fontWeight: '600' }}>
                {verdiendInGroep}/{groep.length}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {groep.map(badge => {
                const c = CAT[badge.categorie]
                const isGeheim = verborgen(badge)
                const isSelected = geselecteerdeBadge?.id === badge.id
                return (
                  <div
                    key={badge.id}
                    onClick={() => setGeselecteerdeBadge(isSelected ? null : badge)}
                    style={{
                      background: 'var(--z-kaart)',
                      border: `1.5px solid ${isSelected ? c.lc : badge.verdiend ? c.lbo : 'var(--z-lijn)'}`,
                      borderRadius: '11px', padding: '9px 5px 7px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      cursor: 'pointer',
                      position: 'relative', transition: 'transform 0.1s',
                    }}
                    onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                    onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{
                      position: 'absolute', top: '5px', right: '5px',
                      width: '13px', height: '13px', borderRadius: '50%',
                      background: badge.verdiend ? '#dcfce7' : 'var(--z-lijn-zacht)',
                      border: `1px solid ${badge.verdiend ? '#86efac' : 'var(--z-lijn)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '7px', color: badge.verdiend ? 'var(--z-winst)' : undefined,
                    }}>
                      {badge.verdiend ? '✓' : '🔒'}
                    </div>
                    <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={42} verdiend={badge.verdiend} />
                    <div style={{
                      fontSize: '10px', fontWeight: '700', textAlign: 'center',
                      color: badge.verdiend ? 'var(--z-tekst)' : 'var(--z-tekst-4)', lineHeight: 1.3,
                    }}>
                      {isGeheim ? '???' : badge.naam}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Badge modal wordt gerenderd in het hoofd SpelerDetail component */}
    </div>
  )
}

// ── Hoofd component ─────────────────────────────────────────────────────────
export default function SpelerDetail({ speler, seizoenId, onClose, variant = 'sheet' }) {
  const [tab, setTab] = useState('stats')
  const [rawStats, setRawStats]     = useState(null)
  const [dbBadgeIds, setDbBadgeIds] = useState(new Set())
  const [loading, setLoading]       = useState(true)
  const [geselecteerdeBadge, setGeselecteerdeBadge] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [speler.id, seizoenId])

  async function fetchStats() {
    setLoading(true)
    const [goalsRes, assistsRes, matchesRes, dbRes, pronoStats, supporterStats] = await Promise.all([
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('scorer_id', speler.id),
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('assist_id', speler.id),
      supabase.from('match_players')
        .select('match_id, match:match_id(season_id, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk))')
        .eq('player_id', speler.id),
      // Handmatig toegekende badges (bv. de Gouden Schoen)
      supabase.from('player_badges').select('badge_id').eq('player_id', speler.id),
      // Pronostiek hangt aan het account; de view geeft het player_id mee
      haalPronostiekStats({ playerId: speler.id }),
      haalSupporterStats({ playerId: speler.id }),
    ])

    setDbBadgeIds(new Set((dbRes.data ?? []).map(r => r.badge_id)))

    const goalsArr   = goalsRes.data   ?? []
    const assistsArr = assistsRes.data  ?? []
    const matchesArr = matchesRes.data  ?? []

    // Seizoen-specifieke stats
    const seizoenGoals   = goalsArr.filter(g => g.match?.season_id === seizoenId).length
    const seizoenAssists = assistsArr.filter(a => a.match?.season_id === seizoenId).length
    const seizoenMatches = matchesArr.filter(m => m.match?.season_id === seizoenId).length

    const computed = computeStats({ goalsArr, assistsArr, matchesArr, seizoenId, pronostiek: pronoStats, supporter: supporterStats })

    setRawStats({ ...computed, seizoenGoals, seizoenAssists, seizoenMatches })
    setLoading(false)
  }

  const badgesMetStatus = BADGES.map(b => ({
    ...b,
    verdiend: dbBadgeIds.has(b.id) ||
      (rawStats ? (() => { try { return b.conditie(rawStats) } catch { return false } })() : false),
  }))

  // ── Gedeelde blokken ────────────────────────────────────────────────────
  const spelerHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <SpelerAvatar speler={speler} size={68} letterGrootte={26} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--z-tekst)', marginBottom: speler.nickname ? '2px' : 0 }}>
          {speler.name}
        </div>
        {speler.nickname && (
          <div style={{ fontSize: '13px', color: 'var(--z-tekst-3)', fontStyle: 'italic', marginBottom: '2px' }}>
            "{speler.nickname}"
          </div>
        )}
        {speler.position && (
          <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>{speler.position}</div>
        )}
      </div>
    </div>
  )

  const tabBar = (
    <div style={{
      display: 'flex', gap: '4px',
      background: 'var(--z-lijn-zacht)', borderRadius: '12px', padding: '4px',
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
            background: tab === t.id ? 'var(--z-kaart)' : 'transparent',
            color: tab === t.id ? 'var(--z-tekst)' : 'var(--z-tekst-3)',
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
      <div style={{ width: '22px', height: '22px', border: '2.5px solid var(--z-lijn)', borderTopColor: 'var(--z-blauw-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '13px', color: 'var(--z-tekst-4)' }}>Stats laden...</span>
    </div>
  ) : tab === 'stats' ? (
    <StatsTab stats={rawStats} />
  ) : (
    <BadgesTab
      badgesMetStatus={badgesMetStatus}
      geselecteerdeBadge={geselecteerdeBadge}
      setGeselecteerdeBadge={setGeselecteerdeBadge}
    />
  )

  // ── Badge modal (gedeeld tussen sheet en modal variant) ────────────────
  const badgeModal = geselecteerdeBadge ? (() => {
    const b = geselecteerdeBadge
    const c = CAT[b.categorie]
    return (
      <>
        <div
          onClick={() => setGeselecteerdeBadge(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 401,
          transform: 'translate(-50%, -50%)',
          background: 'var(--z-kaart)', borderRadius: '28px',
          padding: '36px 28px 28px',
          width: 'min(340px, calc(100vw - 32px))',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
        }}>
          <button
            onClick={() => setGeselecteerdeBadge(null)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--z-lijn-zacht)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: 'var(--z-tekst-3)',
            }}
          >×</button>

          <BadgeHex emoji={b.emoji} categorie={b.categorie} size={96} verdiend={b.verdiend} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--z-tekst)', marginBottom: '6px' }}>{verborgen(b) ? '???' : b.naam}</div>
            <span style={{
              fontSize: '12px', fontWeight: '600',
              padding: '4px 12px', borderRadius: '99px',
              background: c.lb, color: c.lc, border: `1px solid ${c.lbo}`,
            }}>
              {c.label}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--z-tekst-2)', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
            {(verborgen(b) ? '' : b.beschrijving) || 'Deze badge is nog geheim.'}
          </p>

          <button
            onClick={() => setGeselecteerdeBadge(null)}
            style={{
              width: '100%', background: 'var(--z-lijn-zacht)', border: 'none',
              borderRadius: '14px', padding: '14px', fontSize: '14px',
              fontWeight: '600', color: 'var(--z-tekst-2)', cursor: 'pointer',
            }}
          >Sluiten</button>
        </div>
      </>
    )
  })() : null

  // ── Bottom sheet ────────────────────────────────────────────────────────
  if (variant === 'sheet') {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)' }} />
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
          background: 'var(--z-kaart)', borderRadius: '24px 24px 0 0',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.25)',
        }}>
          <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '4px', background: 'var(--z-lijn)', borderRadius: '2px', margin: '0 auto 20px' }} />
            {spelerHeader}
            {tabBar}
            <div style={{ height: '20px' }} />
          </div>
          <div style={{ overflow: 'auto', flex: 1, padding: '0 24px calc(env(safe-area-inset-bottom) + 40px)' }}>
            {inhoud}
          </div>
        </div>
        {badgeModal}
      </>
    )
  }

  // ── Modal ───────────────────────────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 301,
        transform: 'translate(-50%, -50%)',
        background: 'var(--z-kaart)', borderRadius: '22px',
        width: '500px', maxWidth: 'calc(100vw - 32px)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 1,
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'var(--z-lijn-zacht)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: 'var(--z-tekst-3)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--z-lijn)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--z-lijn-zacht)')}
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
      {badgeModal}
    </>
  )
}
