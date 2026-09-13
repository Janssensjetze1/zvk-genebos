// Gedeelde bouwstenen voor het beheerscherm, zodat elk tabblad dezelfde knoppen,
// velden, kaarten en meldingen gebruikt in plaats van eigen inline stijlen.
// De kale stijlobjecten (inputStijl, labelStijl) staan in ./stijlen.

const KNOP_SOORTEN = {
  vol:     { background: '#0f172a', color: 'white', border: '1px solid #0f172a' },
  rand:    { background: 'white', color: '#475569', border: '1px solid #e2e8f0' },
  gevaar:  { background: 'white', color: '#b91c1c', border: '1px solid #fecaca' },
  stil:    { background: 'transparent', color: '#94a3b8', border: '1px solid transparent' },
}

export function Knop({ soort = 'rand', klein = false, disabled, children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      {...rest}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        borderRadius: '8px',
        padding: klein ? '5px 11px' : '9px 18px',
        fontSize: klein ? '12px' : '13px',
        fontWeight: '600', whiteSpace: 'nowrap',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...KNOP_SOORTEN[soort],
        ...rest.style,
      }}
    >
      {children}
    </button>
  )
}

export function Kaart({ children, actief = false, style }) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${actief ? '#93c5fd' : '#e2e8f0'}`,
      borderRadius: '12px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// Kop van een tabblad: titel links, acties rechts
export function TabKop({ titel, subtitel, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap', marginBottom: '18px',
    }}>
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px' }}>{titel}</h2>
        {subtitel && <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{subtitel}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{children}</div>}
    </div>
  )
}

const MELDING_SOORTEN = {
  fout:  { background: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
  goed:  { background: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
  info:  { background: '#f8fafc', border: '#e2e8f0', color: '#475569' },
  let:   { background: '#fffbeb', border: '#fde68a', color: '#b45309' },
}

export function Melding({ soort = 'info', children, style }) {
  const s = MELDING_SOORTEN[soort] ?? MELDING_SOORTEN.info
  return (
    <div style={{
      background: s.background, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.5,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function LegeStaat({ emoji = '📭', titel, tekst, children }) {
  return (
    <div style={{
      background: 'white', border: '1px dashed #e2e8f0', borderRadius: '12px',
      padding: '44px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{emoji}</div>
      {titel && <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', margin: '0 0 4px' }}>{titel}</p>}
      {tekst && <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{tekst}</p>}
      {children && <div style={{ marginTop: '16px' }}>{children}</div>}
    </div>
  )
}

// Klein rond getal, bijvoorbeeld naast een tabbladnaam
export function Teller({ aantal, kleur = '#ef4444' }) {
  if (!aantal) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px',
      background: kleur, color: 'white', fontSize: '11px', fontWeight: '700',
      flexShrink: 0,
    }}>
      {aantal}
    </span>
  )
}
