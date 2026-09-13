import { useAuth } from '../context/AuthContext'

// Toont het wedstrijdverslag en — voor admins — de knoppen om het te laten
// genereren, zelf te schrijven of aan te passen.
// De state komt van useVerslag(wedstrijd), zodat een kaart die zelf al een
// genereerknop heeft (het beheerscherm) dezelfde toestand deelt.
// variant: 'pwa' | 'desktop' | 'admin'

const MAAT = {
  pwa:     { tekst: '13px', padding: '14px 16px' },
  desktop: { tekst: '14px', padding: '16px 18px' },
  admin:   { tekst: '13px', padding: '14px 16px' },
}

function Knop({ soort = 'stil', onClick, disabled, children }) {
  const stijlen = {
    vol:  { background: '#0f172a', color: 'white', border: 'none' },
    rand: { background: 'white', color: '#475569', border: '1px solid #e2e8f0' },
    stil: { background: 'none', color: '#94a3b8', border: 'none', textDecoration: 'underline', padding: '0' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: '10px', padding: soort === 'stil' ? 0 : '9px 16px',
        fontSize: '12px', fontWeight: soort === 'stil' ? '500' : '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        ...stijlen[soort],
      }}
    >
      {children}
    </button>
  )
}

export default function VerslagPaneel({ verslagState: v, variant = 'pwa', toonGenereren = true }) {
  const { isAdmin } = useAuth()
  const maat = MAAT[variant] ?? MAAT.pwa
  const isAdminKaart = variant === 'admin'

  return (
    <div style={{ padding: maat.padding }}>
      {isAdminKaart && (
        <p style={{
          fontSize: '11px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          📰 Wedstrijdverslag
        </p>
      )}

      {v.fout && (
        <div style={{
          fontSize: '12px', color: '#b91c1c', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px',
        }}>
          {v.fout}
        </div>
      )}

      {/* Bezig met genereren */}
      {v.genereert ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
          <div className="pulse-soft" style={{ fontSize: '26px', marginBottom: '8px' }}>📝</div>
          <p style={{ fontSize: '13px' }}>Verslag wordt gegenereerd...</p>
        </div>

      /* Bewerken */
      ) : v.bewerkt ? (
        <div>
          <textarea
            value={v.tekst}
            onChange={e => v.setTekst(e.target.value)}
            rows={9}
            autoFocus
            placeholder="Schrijf hier het wedstrijdverslag..."
            style={{
              width: '100%', boxSizing: 'border-box',
              fontSize: maat.tekst, lineHeight: 1.7, color: '#334155',
              fontFamily: 'inherit',
              background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px',
              padding: '12px', resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <Knop soort="vol" onClick={v.bewaar} disabled={v.bezig}>
              {v.bezig ? 'Bewaren...' : '💾 Bewaren'}
            </Knop>
            <Knop soort="rand" onClick={v.annuleer} disabled={v.bezig}>Annuleren</Knop>
            <span style={{ fontSize: '11px', color: '#cbd5e1', marginLeft: 'auto' }}>
              Leeg bewaren wist het verslag.
            </span>
          </div>
        </div>

      /* Er is een verslag */
      ) : v.verslag ? (
        <div>
          <p style={{
            fontSize: maat.tekst, color: '#334155', lineHeight: 1.75,
            whiteSpace: 'pre-wrap', fontStyle: 'italic', margin: 0,
          }}>
            {v.verslag}
          </p>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
              <Knop onClick={v.startBewerken}>✎ Aanpassen</Knop>
              {toonGenereren && <Knop onClick={v.genereer}>Opnieuw genereren</Knop>}
            </div>
          )}
        </div>

      /* Nog geen verslag */
      ) : isAdmin ? (
        <div style={{ textAlign: isAdminKaart ? 'left' : 'center', padding: isAdminKaart ? 0 : '16px' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Nog geen verslag.</p>
          <div style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
            justifyContent: isAdminKaart ? 'flex-start' : 'center',
          }}>
            {toonGenereren && (
              <Knop soort="vol" onClick={v.genereer}>✨ Genereer verslag</Knop>
            )}
            <Knop soort="rand" onClick={v.startBewerken}>✍️ Zelf schrijven</Knop>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px', margin: 0 }}>
          Nog geen verslag beschikbaar.
        </p>
      )}
    </div>
  )
}
