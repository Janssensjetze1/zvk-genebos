import { useState } from 'react'
import TabLeden from './tabs/TabLeden'
import TabSpelers from './tabs/TabSpelers'
import TabTeams from './tabs/TabTeams'
import TabWedstrijden from './tabs/TabWedstrijden'
import TabSeizoen from './tabs/TabSeizoen'

const tabs = [
  { id: 'leden', label: 'Ledenbeheer' },
  { id: 'spelers', label: 'Spelers' },
  { id: 'teams', label: 'Teams' },
  { id: 'wedstrijden', label: 'Wedstrijden' },
  { id: 'seizoen', label: 'Seizoenen' },
]

export default function Admin() {
  const [actieveTab, setActieveTab] = useState('leden')

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Beheer</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Administratie van de ZVK applicatie</p>
        </div>

        {/* PWA installatie kaart */}
        <a
          href="/invullen"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#0f172a', borderRadius: '14px',
            padding: '14px 18px', textDecoration: 'none',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(15,23,42,0.15)',
          }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'white', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <img src="/logo.png" alt="ZVK" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>
              Wedstrijden invullen
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Open → deel → voeg toe aan beginscherm
            </div>
          </div>
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
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
    </div>
  )
}
