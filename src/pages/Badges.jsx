import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

const CAT = {
  brons:     { ro: '#e8a87c', ri: '#9a5c1a', rc: '#fff3e0', label: 'Brons',     lb: '#fff7ed', lc: '#c2410c', lbo: '#fed7aa' },
  zilver:    { ro: '#cfd8dc', ri: '#546e7a', rc: '#eceff1', label: 'Zilver',    lb: '#f8fafc', lc: '#475569', lbo: '#cbd5e1' },
  goud:      { ro: '#ffe082', ri: '#b06c00', rc: '#fff8e1', label: 'Goud',      lb: '#fefce8', lc: '#a16207', lbo: '#fde68a' },
  legendary: { ro: '#a78bfa', ri: '#4c1d95', rc: '#ede9fe', label: 'Legendary', lb: '#faf5ff', lc: '#7c3aed', lbo: '#ddd6fe' },
  geheim:    { ro: '#334155', ri: '#0f172a', rc: '#1e293b', label: '???',       lb: '#0f172a', lc: '#94a3b8', lbo: '#1e293b' },
}

const BADGES = [
  {
    id: 'welkom',
    emoji: '🔐',
    naam: 'Welkom',
    beschrijving: 'Je hebt je voor het eerst aangemeld bij ZVK Genebos. Welkom in de club!',
    categorie: 'brons',
    conditieTekst: 'Verdiend bij je eerste aanmelding bij de app.',
  },
  {
    id: 'test_badge',
    emoji: '🧪',
    naam: 'Test badge',
    beschrijving: 'Een badge die nog wacht om verdiend te worden.',
    categorie: 'zilver',
    conditieTekst: null,
  },
]

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

export default function Badges() {
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
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          {aantalVerdiend} van {totaal} verdiend
        </p>
      </div>

      {/* Progress */}
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

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {badgesMetStatus.map(badge => {
          const cat = CAT[badge.categorie]
          return (
            <div
              key={badge.id}
              onClick={() => badge.verdiend && setGeselecteerd(badge)}
              style={{
                background: 'white',
                border: `1.5px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                borderRadius: '20px',
                padding: '28px 20px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                cursor: badge.verdiend ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => {
                if (badge.verdiend) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Status indicator */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                border: `1.5px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px',
              }}>
                {badge.verdiend ? '✓' : '🔒'}
              </div>

              <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={88} verdiend={badge.verdiend} />

              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{
                  fontSize: '14px', fontWeight: '700', marginBottom: '6px',
                  color: badge.verdiend ? '#0f172a' : '#94a3b8',
                }}>
                  {badge.naam}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  padding: '3px 10px', borderRadius: '99px',
                  background: badge.verdiend ? cat.lb : '#f1f5f9',
                  color: badge.verdiend ? cat.lc : '#94a3b8',
                  border: `1px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                }}>
                  {cat.label}
                </span>
              </div>

              {!badge.verdiend && (
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                  Nog te verdienen
                </p>
              )}
            </div>
          )
        })}
      </div>

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
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Verdiend!</div>
                    {geselecteerd.conditieTekst && (
                      <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '2px' }}>
                        {geselecteerd.conditieTekst}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{
                    width: '100%', background: '#f1f5f9', border: 'none',
                    borderRadius: '12px', padding: '13px', fontSize: '14px',
                    fontWeight: '600', color: '#475569', cursor: 'pointer',
                    transition: 'background 0.15s',
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
