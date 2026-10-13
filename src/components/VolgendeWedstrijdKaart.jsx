import { useNavigate } from 'react-router-dom'
import { Icoon, hoofdletter } from '../ui'
import PloegLogo from './PloegLogo'

// Het blauwe kaartje met onze eerstvolgende wedstrijd. Gebruikt op het
// desktopoverzicht en bovenaan het startscherm van de app.
// variant: 'desktop' of 'pwa' (route en maten)

function aftellen(datumISO) {
  const datum = new Date(`${datumISO}T00:00:00`)
  const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
  const diff = Math.round((datum - vandaag) / 86400000)
  if (diff <= 0) return { getal: null, tekst: 'Vandaag' }
  if (diff === 1) return { getal: null, tekst: 'Morgen' }
  return { getal: diff, tekst: 'dagen' }
}

export default function VolgendeWedstrijdKaart({ wedstrijd: w, variant = 'desktop', children }) {
  const navigate = useNavigate()
  const pwa = variant === 'pwa'
  const isThuis = w.home_team?.is_zvk
  const datumTekst = hoofdletter(new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))
  const af = aftellen(w.date)
  const meta = { display: 'inline-flex', alignItems: 'center', gap: '6px' }

  return (
    <div className="z-held" style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--z-r-l)', color: 'white',
      boxShadow: '0 10px 30px rgba(12,26,61,0.35), 0 2px 6px rgba(12,26,61,0.2)',
      background: 'var(--z-kaart)',
    }}>
      {/* Het blauwe vlak met het logo: los van de opgave eronder, zodat het
          logo niet verspringt of verdwijnt als die openklapt. */}
      <div style={{
        position: 'relative', overflow: 'hidden', isolation: 'isolate',
        background: 'radial-gradient(120% 140% at 100% 0%, #2a4fb8 0%, #13234d 45%, #0c1a3d 100%)',
      }}>
      {/* Het clublogo schuin rechtsonder, verwerkt in de achtergrond */}
      <img src="/logo.png" alt="" aria-hidden="true" className="z-held-logo" style={{
        right: pwa ? '-30px' : '-22px', bottom: pwa ? '-44px' : '-58px',
        width: pwa ? '180px' : '260px', opacity: pwa ? 0.24 : 0.2,
      }} />

      <div
        onClick={() => navigate(`${pwa ? '/app' : ''}/wedstrijd/${w.id}`)}
        style={{ position: 'relative', zIndex: 2, cursor: 'pointer', padding: pwa ? '18px 18px 16px' : '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: pwa ? '16px' : '22px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px',
            background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
          }}>
            {pwa ? 'Volgende wedstrijd' : (isThuis ? 'Thuiswedstrijd' : 'Uitwedstrijd')}
          </span>
          {w.type && w.type !== 'competitie' && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{w.type}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: pwa ? '14px' : '24px' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: pwa ? '8px' : '10px' }}>
            {[w.home_team, w.away_team].map((team, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <PloegLogo team={team} grootte={pwa ? 28 : 32} opDonker />
                <span style={{
                  fontSize: pwa ? '18px' : '22px', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.2,
                  color: team?.is_zvk ? 'white' : 'rgba(255,255,255,0.78)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {team?.name ?? '?'}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            flexShrink: 0, textAlign: 'center', minWidth: pwa ? '74px' : '96px',
            padding: pwa ? '10px 12px' : '12px 16px', borderRadius: 'var(--z-r)',
            background: 'rgba(12,26,61,0.55)', border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>
            {af.getal != null ? (
              <>
                <div className="z-tab-nums" style={{ fontSize: pwa ? '26px' : '30px', fontWeight: 800, lineHeight: 1 }}>{af.getal}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{af.tekst}</div>
              </>
            ) : (
              <div style={{ fontSize: '15px', fontWeight: 700, padding: '6px 0' }}>{af.tekst}</div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: pwa ? '16px' : '22px',
          paddingTop: pwa ? '12px' : '16px', borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingRight: pwa ? '120px' : '190px', /* ruimte voor het logo rechtsonder */
          fontSize: '13px', color: 'rgba(255,255,255,0.7)',
        }}>
          <span style={meta}><Icoon naam="kalender" grootte={15} /> {datumTekst}</span>
          {w.time && <span style={meta}><Icoon naam="klok" grootte={15} /> {w.time.slice(0, 5)}</span>}
          {pwa && <span>{isThuis ? 'Thuis' : 'Uit'}</span>}
          {w.location && <span style={meta}><Icoon naam="locatie" grootte={15} /> {w.location}</span>}
        </div>
      </div>
      </div>

      {/* Bijvoorbeeld de opgave: in een licht vlak onderaan het kaartje */}
      {children && (
        <div style={{ position: 'relative', zIndex: 3, color: 'var(--z-tekst)', padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}
