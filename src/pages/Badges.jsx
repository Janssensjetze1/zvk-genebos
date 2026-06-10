import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BADGES, CAT, SHINE, CATEGORIE_VOLGORDE } from '../data/badges'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

function BadgeHex({ emoji, categorie, size = 80, verdiend }) {
  const cat = CAT[categorie]   ?? CAT.brons
  const sh  = SHINE[categorie] ?? SHINE.zilver
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
      filter: verdiend
        ? `drop-shadow(0 2px 8px ${sh.glow}) drop-shadow(0 0 16px ${sh.glow})`
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
    </div>
  )
}

export default function Badges() {
  const { profile } = useAuth()
  const [geselecteerd, setGeselecteerd] = useState(null)

  // Geen spelersfiche → geen badges
  if (!profile?.player_id) {
    return (
      <div style={{ maxWidth: '480px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>Jouw verdiende badges</p>
        <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
          padding: '40px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔗</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Geen spelersfiche gekoppeld
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Je account is nog niet gekoppeld aan een spelersfiche.
            Een admin doet dit voor je. Pas dan worden jouw badges berekend.
          </p>
        </div>
      </div>
    )
  }

  const badgesMetStatus = BADGES.map(b => ({
    ...b,
    verdiend: (() => { try { return b.conditie({}) } catch { return false } })(),
  }))

  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length
  const totaal = badgesMetStatus.length
  const progPct = totaal > 0 ? (aantalVerdiend / totaal) * 100 : 0

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          {aantalVerdiend} van {totaal} verdiend
        </p>
      </div>

      {/* Voortgang */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
        padding: '20px 24px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Voortgang</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{aantalVerdiend}/{totaal}</span>
          </div>
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progPct}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: '99px', transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
            {Math.round(progPct)}%
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>voltooid</div>
        </div>
      </div>

      {/* Badges per categorie */}
      {CATEGORIE_VOLGORDE.map(cat => {
        const groep = badgesMetStatus.filter(b => b.categorie === cat)
        if (groep.length === 0) return null
        const catInfo = CAT[cat]
        const verdiendInGroep = groep.filter(b => b.verdiend).length
        return (
          <div key={cat} style={{ marginBottom: '36px' }}>
            {/* Categorie header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span style={{
                fontSize: '12px', fontWeight: '800', color: catInfo.lc,
                textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0,
              }}>
                {catInfo.label}
              </span>
              <div style={{ flex: 1, height: '1px', background: catInfo.lbo }} />
              <span style={{
                fontSize: '12px', color: '#94a3b8', flexShrink: 0, fontWeight: '600',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '99px', padding: '2px 10px',
              }}>
                {verdiendInGroep}/{groep.length}
              </span>
            </div>

            {/* Badge kaarten */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {groep.map(badge => {
                const c = CAT[badge.categorie]
                return (
                  <div
                    key={badge.id}
                    onClick={() => badge.verdiend && setGeselecteerd(badge)}
                    style={{
                      background: badge.verdiend ? c.lb : 'white',
                      border: `1.5px solid ${badge.verdiend ? c.lbo : '#e2e8f0'}`,
                      borderRadius: '20px', padding: '24px 16px 18px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      cursor: badge.verdiend ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'transform 0.12s, box-shadow 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (badge.verdiend) {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                      border: `1.5px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      {badge.verdiend ? '✓' : '🔒'}
                    </div>

                    <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend={badge.verdiend} />

                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                        color: badge.verdiend ? '#0f172a' : '#94a3b8',
                      }}>
                        {badge.naam}
                      </div>
                      <p style={{
                        fontSize: '11px', color: badge.verdiend ? '#64748b' : '#cbd5e1',
                        margin: 0, lineHeight: 1.5,
                      }}>
                        {badge.beschrijving}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Modal */}
      {geselecteerd && (() => {
        const cat = CAT[geselecteerd.categorie]
        return (
          <>
            <div
              onClick={() => setGeselecteerd(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              }}
            />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', zIndex: 201,
              transform: 'translate(-50%, -50%)',
              background: 'white', borderRadius: '24px',
              padding: '36px 40px', width: '380px', maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={108} verdiend />
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                    {geselecteerd.naam}
                  </h2>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    padding: '4px 12px', borderRadius: '99px',
                    background: cat.lb, color: cat.lc, border: `1px solid ${cat.lbo}`,
                  }}>
                    {cat.label}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
                  {geselecteerd.beschrijving}
                </p>
                <div style={{
                  width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '14px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#dcfce7', border: '1.5px solid #86efac',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', flexShrink: 0,
                  }}>✓</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Verdiend!</div>
                </div>
                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{
                    width: '100%', background: '#f1f5f9', border: 'none',
                    borderRadius: '12px', padding: '13px', fontSize: '14px',
                    fontWeight: '600', color: '#475569', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
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
