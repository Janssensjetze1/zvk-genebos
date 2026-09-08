import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import TabLeden from './tabs/TabLeden'
import TabSpelers from './tabs/TabSpelers'
import TabTeams from './tabs/TabTeams'
import TabWedstrijden from './tabs/TabWedstrijden'
import TabSeizoen from './tabs/TabSeizoen'
import TabMeldingen from './tabs/TabMeldingen'
import TabFeedback from './tabs/TabFeedback'

const tabs = [
  { id: 'leden', label: 'Ledenbeheer' },
  { id: 'spelers', label: 'Spelers' },
  { id: 'teams', label: 'Teams' },
  { id: 'wedstrijden', label: 'Wedstrijden' },
  { id: 'seizoen', label: 'Seizoenen' },
  { id: 'meldingen', label: 'Meldingen' },
  { id: 'feedback', label: 'Feedback' },
]

export default function Admin() {
  const [actieveTab, setActieveTab] = useState('leden')
  const [ongelezen, setOngelezen] = useState(0)

  // Aantal nog niet bekeken feedbackberichten — teller op het tabblad
  useEffect(() => {
    supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .then(({ count }) => setOngelezen(count ?? 0))
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Beheer</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Administratie van de ZVK applicatie</p>
        </div>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0', marginBottom: '28px' }}>
        {tabs.map(tab => {
          const active = actieveTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: active ? '600' : '500',
                color: active ? '#0f172a' : '#94a3b8',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #0f172a' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.id === 'feedback' && ongelezen > 0 && (
                <span style={{
                  marginLeft: '7px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px',
                  background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: '700',
                  verticalAlign: 'middle',
                }}>
                  {ongelezen}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Inhoud */}
      {actieveTab === 'leden' && <TabLeden />}
      {actieveTab === 'spelers' && <TabSpelers />}
      {actieveTab === 'teams' && <TabTeams />}
      {actieveTab === 'wedstrijden' && <TabWedstrijden />}
      {actieveTab === 'seizoen' && <TabSeizoen />}
      {actieveTab === 'meldingen' && <TabMeldingen />}
      {actieveTab === 'feedback' && <TabFeedback onGelezen={() => setOngelezen(0)} />}
    </div>
  )
}
