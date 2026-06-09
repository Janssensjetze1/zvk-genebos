import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { supabase } from '../lib/supabase'

const ICON_SIZE = 20

const tabs = [
  {
    path: '/app',
    label: 'Wedstrijden',
    icon: (
      <svg width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/app/klassement',
    label: 'Stand',
    icon: (
      <svg width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/app/stats',
    label: 'Stats',
    icon: (
      <svg width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    path: '/app/spelers',
    label: 'Spelers',
    icon: (
      <svg width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    path: '/app/account',
    label: 'Account',
    icon: (
      <svg width={ICON_SIZE} height={ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

function useMatchdayCountdown(seizoenId) {
  const [wedstrijd, setWedstrijd] = useState(null)
  const [restTijd, setRestTijd] = useState(null) // null = nog niet berekend, false = voorbij

  useEffect(() => {
    if (!seizoenId) return
    const vandaag = new Date().toISOString().split('T')[0]
    supabase
      .from('matches')
      .select('id, time, home_team:home_team_id(name, is_zvk), away_team:away_team_id(name, is_zvk)')
      .eq('season_id', seizoenId)
      .eq('date', vandaag)
      .not('time', 'is', null)
      .order('time', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => setWedstrijd(data ?? null))
  }, [seizoenId])

  useEffect(() => {
    if (!wedstrijd?.time) return

    function bereken() {
      const nu = new Date()
      const [uur, min] = wedstrijd.time.split(':').map(Number)
      const aftrap = new Date()
      aftrap.setHours(uur, min, 0, 0)
      const diff = aftrap - nu
      if (diff <= 0) { setRestTijd(false); return }
      const totMinuten = Math.floor(diff / 60000)
      const uren = Math.floor(totMinuten / 60)
      const minuten = totMinuten % 60
      setRestTijd(uren > 0 ? `${uren}u${minuten < 10 ? '0' : ''}${minuten}m` : `${minuten}m`)
    }

    bereken()
    const interval = setInterval(bereken, 30000) // update elke 30s
    return () => clearInterval(interval)
  }, [wedstrijd])

  return { wedstrijd, restTijd }
}

function MatchdayBadge({ seizoenId }) {
  const { wedstrijd, restTijd } = useMatchdayCountdown(seizoenId)

  // Niet tonen als er geen wedstrijd is, of als de aftrap al geweest is
  if (!wedstrijd || restTijd === null || restTijd === false) return null

  const thuisNaam = wedstrijd.home_team?.name ?? '?'
  const uitNaam = wedstrijd.away_team?.name ?? '?'
  const tijdLabel = wedstrijd.time?.slice(0, 5)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <div style={{
        background: 'rgba(59,130,246,0.15)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: '10px',
        padding: '5px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '1px',
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
          {thuisNaam} – {uitNaam}
        </span>
        <span className="pulse-soft" style={{
          fontSize: '12px', fontWeight: '800', color: '#93c5fd', lineHeight: 1,
          letterSpacing: '-0.3px',
        }}>
          ⚽ {tijdLabel} · nog {restTijd}
        </span>
      </div>
    </div>
  )
}

export default function PWALayout({ children }) {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const { actief: seizoen } = useSeason()
  const invullenActive = location.pathname.startsWith('/app/invullen')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Top header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,20,0.97)',
        padding: '0 20px',
        height: '62px', display: 'flex', alignItems: 'center',
        gap: '10px',
      }}>
        <img src="/logo.png" alt="ZVK" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <span style={{ fontSize: '16px', fontWeight: '700', color: 'white', flex: 1 }}>ZVK Genebos</span>

        {/* Matchday countdown */}
        <MatchdayBadge seizoenId={seizoen?.id} />

        {/* Invullen knop — enkel voor admins */}
        {isAdmin && (
          <Link
            to="/app/invullen"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              textDecoration: 'none',
              background: invullenActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: invullenActive ? 'white' : 'rgba(255,255,255,0.8)',
              borderRadius: '10px',
              padding: '7px 13px',
              fontSize: '13px', fontWeight: '600',
              transition: 'background 0.15s',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Invullen
          </Link>
        )}
      </header>

      {/* Page content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '76px' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,20,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 2px)', right: '8px',
          fontSize: '9px', color: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
        }}>v0.1</span>

        {tabs.map(tab => {
          const active = tab.path === '/app'
            ? location.pathname === '/app'
            : location.pathname.startsWith(tab.path)
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 2px 8px',
                textDecoration: 'none',
                color: active ? '#93c5fd' : 'rgba(255,255,255,0.35)',
                gap: '2px',
                transition: 'color 0.2s',
                minWidth: 0, position: 'relative',
              }}
            >
              {/* Actieve indicator streepje */}
              <div style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: active ? '20px' : '0px', height: '2px',
                background: '#93c5fd', borderRadius: '0 0 4px 4px',
                transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }} />

              <div
                className={active ? 'tab-bounce' : ''}
                key={active ? 'active' : 'inactive'}
                style={{ opacity: active ? 1 : 0.5, flexShrink: 0, transition: 'opacity 0.2s' }}
              >
                {tab.icon}
              </div>
              <span style={{
                fontSize: '9px', fontWeight: active ? '700' : '500',
                letterSpacing: '0.01em', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                transition: 'font-weight 0.15s',
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
