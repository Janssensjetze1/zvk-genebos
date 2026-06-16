import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BADGES, CAT } from '../data/badges'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

function BadgeHex({ emoji, categorie, size = 80, verdiend }) {
  const cat = CAT[categorie] ?? CAT.zilver
  const H   = Math.round(size * 1.155)
  const iW  = Math.round(size * 0.8125)
  const iH  = Math.round(iW * 1.155)
  const iL  = Math.round((size - iW) / 2)
  const iT  = Math.round((H - iH) / 2)
  const cD  = Math.round(iW * 0.70)
  const fs  = Math.round(cD * 0.52)

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
          width: cD, height: cD, borderRadius: '50%',
          background: cat.rc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, lineHeight: 1,
        }}>
          {verdiend ? emoji : '❓'}
        </div>
      </div>
    </div>
  )
}

export default function PWABadges() {
  const { profile } = useAuth()
  const [geselecteerd, setGeselecteerd] = useState(null)

  const badgesMetStatus = BADGES.map(b => ({
    ...b,
    verdiend: b.id === 'welkom' ? !!profile : false,
  }))

  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length
  const totaal = badgesMetStatus.length
  const progPct = totaal > 0 ? (aantalVerdiend / totaal) * 100 : 0

  return (
    <div style={{ padding: '20px 16px 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: '6px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          {aantalVerdiend} van {totaal} verdiend
        </p>
      </div>

      {/* Progress bar — enkel tonen als er badges zijn */}
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
      {badgesMetStatus.length === 0 && (
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
        {badgesMetStatus.map(badge => {
          const cat = CAT[badge.categorie]
          return (
            <div
              key={badge.id}
              onClick={() => badge.verdiend && setGeselecteerd(badge)}
              className={`badge-card ${badge.verdiend ? 'badge-card-earned' : 'badge-card-locked'}`}
              style={{
                padding: '20px 12px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: badge.verdiend ? 'pointer' : 'default',
                transition: 'transform 0.12s',
                userSelect: 'none',
              }}
              onPointerDown={e => badge.verdiend && (e.currentTarget.style.transform = 'scale(0.96)')}
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
                  background: badge.verdiend ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: badge.verdiend ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                  border: `1px solid ${badge.verdiend ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {cat.label}
                </span>
              </div>

              {!badge.verdiend && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, textAlign: 'center', lineHeight: 1.4, position: 'relative', zIndex: 1 }}>
                  Nog te verdienen
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
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={100} verdiend />

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
                  {geselecteerd.beschrijving}
                </p>

                {/* Verdiend banner */}
                <div style={{
                  width: '100%',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.25)',
                  borderRadius: '14px', padding: '13px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(74,222,128,0.15)', border: '1.5px solid rgba(74,222,128,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0, color: '#4ade80',
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80' }}>Verdiend!</div>
                    {geselecteerd.conditieTekst && (
                      <div style={{ fontSize: '12px', color: 'rgba(74,222,128,0.7)', marginTop: '2px' }}>
                        {geselecteerd.conditieTekst}
                      </div>
                    )}
                  </div>
                </div>

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
