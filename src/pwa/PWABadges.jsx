import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { BADGES, CAT, SHINE, CATEGORIE_STIJL } from '../data/badges'
import { haalBadgeData, badgesMetStatus } from '../lib/badgeStats'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

// De kaart achter een badge krijgt de kleur van zijn categorie mee.
// index.css leest deze variabelen in de achtergrond van .badge-card.
function kaartTint(categorie) {
  const cat = CAT[categorie] ?? CAT.zilver
  return {
    '--badge-tint-a': `${cat.ro}3d`,
    '--badge-tint-b': `${cat.ro}52`,
    '--badge-tint-c': `${cat.rc}24`,
  }
}

function BadgeHex({ emoji, categorie, size = 80, verdiend }) {
  const cat   = CAT[categorie]             ?? CAT.zilver
  const sh    = SHINE[categorie]           ?? SHINE.zilver
  const stijl = CATEGORIE_STIJL[categorie] ?? CATEGORIE_STIJL.zilver
  const H   = Math.round(size * 1.155)
  const iW  = Math.round(size * 0.8125)
  const iH  = Math.round(iW * 1.155)
  const iL  = Math.round((size - iW) / 2)
  const iT  = Math.round((H - iH) / 2)
  const cD  = Math.round(iW * 0.70)
  const fs  = Math.round(cD * 0.52)

  // Sterretjes rond de badge, in de gloedkleur van de categorie
  const sterretjes = [
    { top: '-14%', left:  '8%',  s: 0.20, d: '0.0s', t: '1.8s' },
    { top:  '-5%', left: '72%',  s: 0.16, d: '0.5s', t: '1.6s' },
    { top:  '38%', left: '104%', s: 0.18, d: '1.1s', t: '2.0s' },
    { top:  '90%', left: '68%',  s: 0.17, d: '0.3s', t: '1.7s' },
    { top:  '85%', left: '-8%',  s: 0.15, d: '0.8s', t: '1.9s' },
    { top:  '22%', left: '-6%',  s: 0.14, d: '1.4s', t: '1.5s' },
  ]

  return (
    <div style={{
      position: 'relative', width: size, height: H, flexShrink: 0,
      // Ook een nog niet verdiende badge houdt de kleur van zijn categorie —
      // het verschil zit in de gloed, de sterretjes en het slotje.
      filter: verdiend
        ? `drop-shadow(0 2px 8px ${sh.glow}) drop-shadow(0 0 16px ${sh.glow})`
        : `drop-shadow(0 2px 7px ${stijl.glow})`,
      opacity: verdiend ? 1 : 0.82,
      animation: verdiend ? 'badge-hex-glow 2.8s ease-in-out infinite' : 'none',
      transition: 'opacity 0.2s, filter 0.2s',
    }}>
      {/* Buitenring */}
      <div style={{
        position: 'absolute', inset: 0, clipPath: HEX, overflow: 'hidden',
        background: verdiend ? sh.outerGrad : stijl.gradient,
      }}>
        {/* Glans die over de badge glijdt — subtieler zolang je hem niet hebt */}
        <span className="badge-hex-shine" style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${verdiend ? 0.55 : 0.28}) 50%, transparent 100%)`,
        }} />
      </div>

      {/* Binnenhex */}
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

      {/* Glinstering in de kleur van de categorie */}
      {verdiend && sterretjes.map((sp, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: sp.top, left: sp.left,
          fontSize: Math.max(6, Math.round(size * sp.s)),
          color: 'white',
          textShadow: `0 0 5px ${sh.glow}, 0 0 10px ${sh.glow}`,
          animation: `glitter ${sp.t} ${sp.d} ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 10, lineHeight: 1,
        }}>✦</div>
      ))}
    </div>
  )
}

export default function PWABadges() {
  const { user, profile } = useAuth()
  const { actief: seizoen } = useSeason()
  const [geselecteerd, setGeselecteerd] = useState(null)
  const [stats, setStats] = useState(null)
  const [dbBadgeIds, setDbBadgeIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.player_id) { setLoading(false); return }
    let levend = true
    haalBadgeData({
      playerId: profile.player_id,
      seizoenId: seizoen?.id,
      userCreatedAt: user?.created_at,
    }).then(({ stats, dbBadgeIds }) => {
      if (!levend) return
      setStats(stats)
      setDbBadgeIds(dbBadgeIds)
      setLoading(false)
    })
    return () => { levend = false }
  }, [profile?.player_id, seizoen?.id, user?.created_at])

  // Geen spelersfiche → niks te berekenen
  if (!profile?.player_id) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }}>Badges</h1>
        <div className="badge-card" style={{
          padding: '40px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '36px', position: 'relative', zIndex: 1 }}>🔗</span>
          <p style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', margin: 0, position: 'relative', zIndex: 1 }}>
            Geen spelersfiche gekoppeld
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5, maxWidth: '240px', position: 'relative', zIndex: 1 }}>
            Een admin koppelt je account aan een spelersfiche. Pas dan worden je badges berekend.
          </p>
        </div>
      </div>
    )
  }

  const lijst = badgesMetStatus(BADGES, stats, dbBadgeIds)
  const aantalVerdiend = lijst.filter(b => b.verdiend).length
  const totaal = lijst.length
  const progPct = totaal > 0 ? (aantalVerdiend / totaal) * 100 : 0

  return (
    <div style={{ padding: '20px 16px 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: '6px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          {loading ? 'Berekenen...' : `${aantalVerdiend} van ${totaal} verdiend`}
        </p>
      </div>

      {/* Progress bar */}
      {totaal > 0 && (
        <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '99px', margin: '16px 0 28px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progPct}%`,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '99px', transition: 'width 0.6s ease',
          }} />
        </div>
      )}

      {/* Lege staat */}
      {totaal === 0 && (
        <div className="badge-card" style={{
          padding: '48px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '40px', position: 'relative', zIndex: 1 }}>🏅</span>
          <p style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', margin: 0, position: 'relative', zIndex: 1 }}>
            Binnenkort beschikbaar
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5, maxWidth: '220px', position: 'relative', zIndex: 1 }}>
            Er zijn op dit moment nog geen badges. Kom later terug!
          </p>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {lijst.map(badge => {
          const cat = CAT[badge.categorie]
          return (
            <div
              key={badge.id}
              onClick={() => setGeselecteerd(badge)}
              className={`badge-card ${badge.verdiend ? 'badge-card-earned' : 'badge-card-locked'}`}
              style={{
                ...kaartTint(badge.categorie),
                padding: '20px 12px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.12s',
                userSelect: 'none',
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {/* Verdiend vinkje */}
              {badge.verdiend && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px', zIndex: 1,
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(74,222,128,0.15)', border: '1.5px solid rgba(74,222,128,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: '#4ade80', fontWeight: '700',
                }}>✓</div>
              )}

              {/* Niet verdiend slot */}
              {!badge.verdiend && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px', zIndex: 1,
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px',
                }}>🔒</div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend={badge.verdiend} />
              </div>

              <div style={{ textAlign: 'center', width: '100%', position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                  color: badge.verdiend ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                }}>
                  {badge.naam}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  padding: '2px 9px', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.07)',
                  color: cat.ro,
                  border: `1px solid ${cat.ro}55`,
                  opacity: badge.verdiend ? 1 : 0.65,
                }}>
                  {cat.label}
                </span>
              </div>

              {!badge.verdiend && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, textAlign: 'center', lineHeight: 1.4, position: 'relative', zIndex: 1 }}>
                  {badge.placeholder ? 'Nog geheim' : 'Nog te verdienen'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom sheet detail */}
      {geselecteerd && (() => {
        const cat = CAT[geselecteerd.categorie]
        return (
          <>
            <div
              onClick={() => setGeselecteerd(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)' }}
            />
            <div
              className="badge-card"
              style={{
                ...kaartTint(geselecteerd.categorie),
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
                borderRadius: '24px 24px 0 0',
                padding: '12px 24px calc(env(safe-area-inset-bottom) + 40px)',
                boxShadow: '0 -12px 48px rgba(99,102,241,0.2)',
                animation: 'badge-aurora 7s ease infinite, badge-border-glow 3s ease-in-out infinite',
              }}
            >
              {/* Handle */}
              <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 24px', position: 'relative', zIndex: 1 }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={100} verdiend={geselecteerd.verdiend} />

                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'rgba(255,255,255,0.95)', margin: '0 0 8px' }}>
                    {geselecteerd.naam}
                  </h2>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    padding: '3px 12px', borderRadius: '99px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    {cat.label}
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.65, margin: 0, maxWidth: '280px' }}>
                  {geselecteerd.beschrijving || 'Deze badge is nog geheim.'}
                </p>

                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px', padding: '13px', fontSize: '14px',
                    fontWeight: '600', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                  }}
                >
                  Sluiten
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
