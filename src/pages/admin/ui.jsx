// Gedeelde bouwstenen voor het beheerscherm, zodat elk tabblad dezelfde knoppen,
// velden, kaarten en meldingen gebruikt in plaats van eigen inline stijlen.
// De kale stijlobjecten (inputStijl, labelStijl) staan in ./stijlen.

const KNOP_KLASSE = {
  vol: 'z-knop-primair',
  rand: '',
  gevaar: 'z-knop-gevaar',
  stil: 'z-knop-stil',
}

export function Knop({ soort = 'rand', klein = false, disabled, children, className = '', ...rest }) {
  const klassen = ['z-knop', KNOP_KLASSE[soort], klein && 'z-knop-klein', className].filter(Boolean).join(' ')
  return (
    <button type="button" disabled={disabled} {...rest} className={klassen}>
      {children}
    </button>
  )
}

export function Kaart({ children, actief = false, style }) {
  return (
    <div className="z-kaart" style={{
      ...(actief && { borderColor: 'var(--z-blauw-200)', boxShadow: '0 0 0 3px var(--z-blauw-50)' }),
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
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--z-tekst)', letterSpacing: '-0.01em', margin: '0 0 4px' }}>{titel}</h2>
        {subtitel && <p style={{ fontSize: '13px', color: 'var(--z-tekst-3)', margin: 0 }}>{subtitel}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{children}</div>}
    </div>
  )
}

const MELDING_SOORTEN = {
  fout:  { background: 'var(--z-verlies-bg)', border: 'var(--z-verlies-rand)', color: 'var(--z-verlies)' },
  goed:  { background: 'var(--z-winst-bg)', border: 'var(--z-winst-rand)', color: 'var(--z-winst)' },
  info:  { background: 'var(--z-vlak)', border: 'var(--z-lijn)', color: 'var(--z-tekst-2)' },
  let:   { background: 'var(--z-gelijk-bg)', border: 'var(--z-gelijk-rand)', color: 'var(--z-gelijk)' },
}

export function Melding({ soort = 'info', children, style }) {
  const s = MELDING_SOORTEN[soort] ?? MELDING_SOORTEN.info
  return (
    <div style={{
      background: s.background, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 'var(--z-r-s)', padding: '10px 14px', fontSize: '13px', lineHeight: 1.5,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function LegeStaat({ emoji = '📭', titel, tekst, children }) {
  return (
    <div style={{
      background: 'var(--z-kaart)', border: '1px dashed var(--z-lijn-sterk)', borderRadius: 'var(--z-r)',
      padding: '44px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{emoji}</div>
      {titel && <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--z-tekst-2)', margin: '0 0 4px' }}>{titel}</p>}
      {tekst && <p style={{ fontSize: '13px', color: 'var(--z-tekst-3)', margin: 0 }}>{tekst}</p>}
      {children && <div style={{ marginTop: '16px' }}>{children}</div>}
    </div>
  )
}

// Klein rond getal, bijvoorbeeld naast een tabbladnaam
export function Teller({ aantal, kleur = 'var(--z-verlies)' }) {
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
