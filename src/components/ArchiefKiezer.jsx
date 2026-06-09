import { useState, useRef, useEffect } from 'react'
import { useSeason } from '../context/SeasonContext'

/**
 * ArchiefKiezer — een dropdown die enkel verschijnt als er meer dan 1 seizoen is.
 * Het huidige (nieuwste) seizoen is niet kiesbaar: je klikt gewoon "Archief bekijken"
 * om een oud seizoen te selecteren. De globale ArchiefBanner in Layout toont de rest.
 */
export function ArchiefKiezer() {
  const { seizoenen, actief, huidigSeizoen, switchSeizoen, isArchief } = useSeason()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const oudeSeizoen = seizoenen.filter(s => s.id !== huidigSeizoen?.id)
  if (oudeSeizoen.length === 0) return null

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function kies(seizoen) {
    switchSeizoen(seizoen)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 13px', borderRadius: '8px', cursor: 'pointer',
          border: isArchief ? '1.5px solid #b45309' : '1px solid #e2e8f0',
          background: isArchief ? '#fef3c7' : 'white',
          color: isArchief ? '#92400e' : '#475569',
          fontSize: '13px', fontWeight: isArchief ? '700' : '500',
          transition: 'all 0.15s',
        }}
      >
        <span>📦</span>
        {isArchief ? `Archief: ${actief?.name}` : 'Archief bekijken'}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          minWidth: '200px', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Vorige seizoenen
            </span>
          </div>

          {oudeSeizoen.map(s => (
            <button
              key={s.id}
              onClick={() => kies(s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', border: 'none', background: actief?.id === s.id ? '#fef3c7' : 'white',
                cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                color: actief?.id === s.id ? '#92400e' : '#334155',
                fontWeight: actief?.id === s.id ? '700' : '400',
                transition: 'background 0.1s',
                borderBottom: '1px solid #f8fafc',
              }}
              onMouseEnter={e => { if (actief?.id !== s.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (actief?.id !== s.id) e.currentTarget.style.background = 'white' }}
            >
              <span style={{ fontSize: '14px' }}>📦</span>
              <span>{s.name}</span>
              {actief?.id === s.id && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#b45309' }}>● Actief</span>}
            </button>
          ))}

          {isArchief && (
            <button
              onClick={() => { switchSeizoen(huidigSeizoen); setOpen(false) }}
              style={{
                width: '100%', padding: '10px 14px', border: 'none',
                background: '#f0fdf4', cursor: 'pointer', textAlign: 'left',
                fontSize: '13px', color: '#16a34a', fontWeight: '600',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              ← Terug naar huidig seizoen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
