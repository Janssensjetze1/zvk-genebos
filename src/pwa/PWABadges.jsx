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

// Voorlopig 2 preview badges
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

      {/* Progress bar */}
      <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '99px', margin: '16px 0 28px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progPct}%`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          borderRadius: '99px', transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
                padding: '20px 12px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: badge.verdiend ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
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
                  position: 'absolute', top: '10px', right: '10px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#dcfce7', border: '1.5px solid #86efac',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: '#16a34a', fontWeight: '700',
                }}>✓</div>
              )}

              {/* Niet verdiend slot */}
              {!badge.verdiend && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px',
                }}>🔒</div>
              )}

              <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend={badge.verdiend} />

              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{
                  fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                  color: badge.verdiend ? '#0f172a' : '#94a3b8',
                }}>
                  {badge.naam}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  padding: '2px 9px', borderRadius: '99px',
                  background: badge.verdiend ? cat.lb : '#f1f5f9',
                  color: badge.verdiend ? cat.lc : '#94a3b8',
                  border: `1px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                }}>
                  {cat.label}
                </span>
              </div>

              {!badge.verdiend && (
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
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
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
              background: 'white', borderRadius: '24px 24px 0 0',
              padding: '12px 24px calc(env(safe-area-inset-bottom) + 40px)',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.2)',
            }}>
              {/* Handle */}
              <div style={{ width: '36px', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '0 auto 24px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={100} verdiend />

                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                    {geselecteerd.naam}
                  </h2>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    padding: '3px 12px', borderRadius: '99px',
                    background: cat.lb, color: cat.lc, border: `1px solid ${cat.lbo}`,
                  }}>
                    {cat.label}
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.65, margin: 0, maxWidth: '280px' }}>
                  {geselecteerd.beschrijving}
                </p>

                {/* Verdiend banner */}
                <div style={{
                  width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '14px', padding: '13px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#dcfce7', border: '1.5px solid #86efac',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0,
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
