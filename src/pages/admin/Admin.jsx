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
import { useBeheerTellers } from './useBeheerTellers'
import { Teller } from './ui'

const ONDERDELEN = [
  { id: 'leden',       label: 'Ledenbeheer', icon: '👥', teller: 'wachtendeLeden', tellerKleur: '#3b82f6' },
  { id: 'spelers',     label: 'Spelers',     icon: '🎽' },
  { id: 'teams',       label: 'Teams',       icon: '🛡️' },
  { id: 'wedstrijden', label: 'Wedstrijden', icon: '📅', teller: 'bladOntbreekt', tellerKleur: '#f59e0b' },
  { id: 'seizoen',     label: 'Seizoenen',   icon: '📆' },
  { id: 'meldingen',   label: 'Meldingen',   icon: '🔔' },
  { id: 'quotes',      label: 'Quotes',      icon: '💬' },
  { id: 'feedback',    label: 'Feedback',    icon: '📬', teller: 'ongelezenFeedback', tellerKleur: '#7c3aed' },
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
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px' }}>Beheer</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
          Administratie van de ZVK applicatie{seizoen ? ` · seizoen ${seizoen.name}` : ''}
        </p>
      </div>

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
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{o.icon}</span>
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
      emoji: '🙋',
      tekst: n => `${n} ${n === 1 ? 'lid wacht' : 'leden wachten'} op goedkeuring`,
      knop: 'Naar ledenbeheer',
      tab: 'leden',
      kleur: { bg: '#eff6ff', rand: '#bfdbfe', tekst: '#1d4ed8' },
    },
    {
      aantal: tellers.bladOntbreekt,
      emoji: '📋',
      tekst: n => `${n} gespeelde ${n === 1 ? 'wedstrijd heeft' : 'wedstrijden hebben'} nog geen wedstrijdblad`,
      knop: 'Naar wedstrijden',
      tab: 'wedstrijden',
      kleur: { bg: '#fffbeb', rand: '#fde68a', tekst: '#b45309' },
    },
    {
      aantal: tellers.ongelezenFeedback,
      emoji: '📬',
      tekst: n => `${n} ${n === 1 ? 'nieuw bericht' : 'nieuwe berichten'} via feedback`,
      knop: 'Naar feedback',
      tab: 'feedback',
      kleur: { bg: '#faf5ff', rand: '#e9d5ff', tekst: '#7c3aed' },
    },
  ].filter(p => p.aantal > 0)

  if (punten.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
        padding: '12px 16px', marginBottom: '24px',
        fontSize: '13px', color: '#15803d', fontWeight: '500',
      }}>
        <span style={{ fontSize: '16px' }}>✓</span>
        Alles is bij — niets dat op je wacht.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '10px', marginBottom: '24px',
    }}>
      {punten.map(p => (
        <div key={p.tab} style={{
          background: p.kleur.bg, border: `1px solid ${p.kleur.rand}`, borderRadius: '12px',
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '18px', lineHeight: 1.2, flexShrink: 0 }}>{p.emoji}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: p.kleur.tekst, lineHeight: 1.45 }}>
              {p.tekst(p.aantal)}
            </span>
          </div>
          <button
            onClick={() => ga(p.tab)}
            style={{
              alignSelf: 'flex-start',
              background: 'white', border: `1px solid ${p.kleur.rand}`, borderRadius: '8px',
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
