import { useEffect, useState } from 'react'
import { useSeason } from '../../context/SeasonContext'
import TabLeden from './tabs/TabLeden'
import TabSpelers from './tabs/TabSpelers'
import TabTeams from './tabs/TabTeams'
import TabWedstrijden from './tabs/TabWedstrijden'
import TabSeizoen from './tabs/TabSeizoen'
import TabMeldingen from './tabs/TabMeldingen'
import TabFeedback from './tabs/TabFeedback'
import TabQuotes from './tabs/TabQuotes'
import TabGebruik from './tabs/TabGebruik'
import TabDatabase from './tabs/TabDatabase'
import { useBeheerTellers } from './useBeheerTellers'
import { Teller } from './ui'
import { Icoon, PaginaKop } from '../../ui'

const ONDERDELEN = [
  { id: 'leden',       label: 'Ledenbeheer', icon: 'leden', teller: 'wachtendeLeden', tellerKleur: 'var(--z-blauw)' },
  { id: 'spelers',     label: 'Spelers',     icon: 'shirt' },
  { id: 'teams',       label: 'Teams',       icon: 'schild' },
  { id: 'wedstrijden', label: 'Wedstrijden', icon: 'bal', teller: 'bladOntbreekt', tellerKleur: 'var(--z-goud)' },
  { id: 'seizoen',     label: 'Seizoenen',   icon: 'kalender' },
  { id: 'meldingen',   label: 'Meldingen',   icon: 'bel' },
  { id: 'quotes',      label: 'Quotes',      icon: 'citaat' },
  { id: 'gebruik',     label: 'Gebruik',     icon: 'klassement' },
  { id: 'database',    label: 'Database',    icon: 'archief' },
  { id: 'feedback',    label: 'Feedback',    icon: 'inbox', teller: 'ongelezenFeedback', tellerKleur: 'var(--z-paars)' },
]

export default function Admin() {
  const { actief: seizoen } = useSeason()
  const [actieveTab, setActieveTab] = useState('leden')
  const tellers = useBeheerTellers()

  // Na het wisselen van onderdeel kunnen de aantallen veranderd zijn
  useEffect(() => { tellers.herlaad() }, [actieveTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function ga(tab) {
    setActieveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Header */}
      <PaginaKop
        bovenlabel="Admin"
        titel="Beheer"
        ondertitel={`Administratie van de ZVK-app${seizoen ? ` · seizoen ${seizoen.name}` : ''}`}
      />

      {/* Wat vraagt aandacht */}
      <AandachtStrook tellers={tellers} ga={ga} />

      <div className="admin-shell">
        {/* Onderdelen */}
        <nav className="admin-nav">
          {ONDERDELEN.map(o => (
            <button
              key={o.id}
              className="admin-nav-knop"
              aria-current={actieveTab === o.id}
              onClick={() => ga(o.id)}
            >
              <Icoon naam={o.icon} grootte={17} />
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.teller && <Teller aantal={tellers[o.teller]} kleur={o.tellerKleur} />}
            </button>
          ))}
        </nav>

        {/* Inhoud */}
        <div style={{ minWidth: 0 }}>
          {actieveTab === 'leden' && <TabLeden />}
          {actieveTab === 'spelers' && <TabSpelers />}
          {actieveTab === 'teams' && <TabTeams />}
          {actieveTab === 'wedstrijden' && <TabWedstrijden />}
          {actieveTab === 'seizoen' && <TabSeizoen />}
          {actieveTab === 'meldingen' && <TabMeldingen />}
          {actieveTab === 'quotes' && <TabQuotes />}
          {actieveTab === 'gebruik' && <TabGebruik />}
          {actieveTab === 'database' && <TabDatabase />}
          {actieveTab === 'feedback' && (
            <TabFeedback onGelezen={() => tellers.setTellers(t => ({ ...t, ongelezenFeedback: 0 }))} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Wat vraagt aandacht ──────────────────────────────────────────────────────

function AandachtStrook({ tellers, ga }) {
  const punten = [
    {
      aantal: tellers.wachtendeLeden,
      icoon: 'leden',
      tekst: n => `${n} ${n === 1 ? 'lid wacht' : 'leden wachten'} op goedkeuring`,
      knop: 'Naar ledenbeheer',
      tab: 'leden',
      kleur: { bg: 'var(--z-blauw-50)', rand: 'var(--z-blauw-200)', tekst: 'var(--z-blauw)' },
    },
    {
      aantal: tellers.bladOntbreekt,
      icoon: 'invullen',
      tekst: n => `${n} gespeelde ${n === 1 ? 'wedstrijd heeft' : 'wedstrijden hebben'} nog geen wedstrijdblad`,
      knop: 'Naar wedstrijden',
      tab: 'wedstrijden',
      kleur: { bg: 'var(--z-gelijk-bg)', rand: 'var(--z-gelijk-rand)', tekst: 'var(--z-gelijk)' },
    },
    {
      aantal: tellers.ongelezenFeedback,
      icoon: 'inbox',
      tekst: n => `${n} ${n === 1 ? 'nieuw bericht' : 'nieuwe berichten'} via feedback`,
      knop: 'Naar feedback',
      tab: 'feedback',
      kleur: { bg: 'var(--z-paars-bg)', rand: '#ddd6fe', tekst: 'var(--z-paars)' },
    },
  ].filter(p => p.aantal > 0)

  if (punten.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--z-winst-bg)', border: '1px solid var(--z-winst-rand)', borderRadius: 'var(--z-r)',
        padding: '12px 16px', marginBottom: '28px',
        fontSize: '13px', color: 'var(--z-winst)', fontWeight: '500',
      }}>
        <Icoon naam="vink" grootte={16} dikte={2.4} />
        Alles is bij.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '12px', marginBottom: '28px',
    }}>
      {punten.map(p => (
        <div key={p.tab} style={{
          background: p.kleur.bg, border: `1px solid ${p.kleur.rand}`, borderRadius: 'var(--z-r)',
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ color: p.kleur.tekst, flexShrink: 0, marginTop: '1px' }}><Icoon naam={p.icoon} grootte={17} /></span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: p.kleur.tekst, lineHeight: 1.45 }}>
              {p.tekst(p.aantal)}
            </span>
          </div>
          <button
            onClick={() => ga(p.tab)}
            style={{
              alignSelf: 'flex-start',
              background: 'var(--z-kaart)', border: `1px solid ${p.kleur.rand}`, borderRadius: 'var(--z-r-s)',
              padding: '5px 12px', fontSize: '12px', fontWeight: '600',
              color: p.kleur.tekst, cursor: 'pointer',
            }}
          >
            {p.knop} →
          </button>
        </div>
      ))}
    </div>
  )
}
