import { useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import { useBeheerTellers } from '../pages/admin/useBeheerTellers'
import { OnderdeelInhoud } from '../pages/admin/onderdelen'
import { ONDERDELEN, GROEPEN } from '../pages/admin/onderdelenLijst'
import { AppPagina, Icoon } from '../ui'

// Het volledige beheer in de app. Startscherm: wat aandacht vraagt, snelle
// acties en alle onderdelen in groepen, zoals de instellingen van een iPhone.
// Elk onderdeel opent als eigen scherm met een terugknop, zodat het de hele
// breedte van de telefoon krijgt. De inhoud is dezelfde als op desktop.

export default function PWABeheer() {
  const navigate = useNavigate()
  const { actief: seizoen } = useSeason()
  const tellers = useBeheerTellers()

  const aandacht = [
    { aantal: tellers.wachtendeLeden, tekst: n => `${n} ${n === 1 ? 'lid wacht' : 'leden wachten'} op goedkeuring`, icoon: 'leden', naar: 'leden', toon: 'blauw' },
    { aantal: tellers.bladOntbreekt, tekst: n => `${n} ${n === 1 ? 'wedstrijdblad' : 'wedstrijdbladen'} in te vullen`, icoon: 'invullen', naar: 'wedstrijden', toon: 'gelijk' },
    { aantal: tellers.ongelezenFeedback, tekst: n => `${n} ${n === 1 ? 'nieuw bericht' : 'nieuwe berichten'} via feedback`, icoon: 'inbox', naar: 'feedback', toon: 'paars' },
  ].filter(a => a.aantal > 0)

  return (
    <AppPagina bovenlabel="Admin" titel="Beheer" ondertitel={seizoen ? `Seizoen ${seizoen.name}` : null}>
      {/* Wat vraagt aandacht */}
      {aandacht.length === 0 ? (
        <div className="z-beheer-alles-bij">
          <Icoon naam="vink" grootte={18} dikte={2.4} />
          Alles is bij.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {aandacht.map(a => (
            <button key={a.naar} type="button" className={`z-beheer-aandacht z-beheer-aandacht-${a.toon}`} onClick={() => navigate(`/app/beheer/${a.naar}`)}>
              <Icoon naam={a.icoon} grootte={18} />
              <span style={{ flex: 1, textAlign: 'left' }}>{a.tekst(a.aantal)}</span>
              <Icoon naam="chevron" grootte={16} dikte={2} />
            </button>
          ))}
        </div>
      )}

      {/* Snelle acties */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button type="button" className="z-beheer-actie" onClick={() => window.dispatchEvent(new Event('zvk:nieuwe-wedstrijd'))}>
          <span className="z-icoonvak"><Icoon naam="plus" grootte={18} dikte={2.2} /></span>
          Wedstrijd toevoegen
        </button>
        <button type="button" className="z-beheer-actie" onClick={() => navigate('/app/invullen')}>
          <span className="z-icoonvak"><Icoon naam="invullen" grootte={18} /></span>
          Uitslag invullen
        </button>
      </div>

      {/* Alle onderdelen */}
      {GROEPEN.map(groep => (
        <section key={groep}>
          <h2 className="z-beheer-groep">{groep}</h2>
          <div className="z-kaart z-lijst" style={{ overflow: 'hidden' }}>
            {ONDERDELEN.filter(o => o.groep === groep).map(o => (
              <button key={o.id} type="button" className="z-rij z-rij-klik z-beheer-rij-knop" onClick={() => navigate(`/app/beheer/${o.id}`)}>
                <span className="z-icoonvak"><Icoon naam={o.icon} grootte={18} /></span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--z-tekst)' }}>{o.label}</span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.uitleg}</span>
                </span>
                {o.teller && tellers[o.teller] > 0 && (
                  <span className="z-teller" style={{ background: o.tellerKleur }}>{tellers[o.teller]}</span>
                )}
                <Icoon naam="chevron" grootte={16} dikte={2} className="z-chevron" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </AppPagina>
  )
}

// Eén onderdeel op een eigen scherm
export function PWABeheerOnderdeel() {
  const { onderdeel } = useParams()
  const navigate = useNavigate()
  const tellers = useBeheerTellers()
  const info = ONDERDELEN.find(o => o.id === onderdeel)

  useEffect(() => { window.scrollTo(0, 0) }, [onderdeel])

  if (!info) return <Navigate to="/app/beheer" replace />

  return (
    <div className="z-app-pagina z-beheer-mobiel">
      <button type="button" className="z-beheer-terug" onClick={() => navigate('/app/beheer')}>
        <Icoon naam="terug" grootte={18} dikte={2.2} />
        Beheer
      </button>
      <OnderdeelInhoud id={info.id} tellers={tellers} />
    </div>
  )
}
