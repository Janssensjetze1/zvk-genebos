import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { useMatchdayCountdown } from '../hooks/useMatchdayCountdown'
import { AnnouncementPopup } from '../components/AnnouncementPopup'
import PWASplashScreen from './PWASplashScreen'

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

const PULL_THRESHOLD = 72

function usePullToRefresh(mainRef) {
  const touchStartY  = useRef(0)
  const currentDist  = useRef(0)
  const [pullDist,   setPullDist]   = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    function onTouchStart(e) {
      if (el.scrollTop === 0) touchStartY.current = e.touches[0].clientY
    }

    function onTouchMove(e) {
      if (!touchStartY.current) return
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta > 0 && el.scrollTop === 0) {
        e.preventDefault()
        const d = Math.min(delta * 0.45, PULL_THRESHOLD + 24)
        currentDist.current = d
        setPullDist(d)
      }
    }

    function onTouchEnd() {
      if (currentDist.current >= PULL_THRESHOLD) {
        setRefreshing(true)
        touchStartY.current  = 0
        currentDist.current  = 0
        setTimeout(() => {
          sessionStorage.setItem('ptr_reload', '1')
          window.location.reload()
        }, 650)
      } else {
        setPullDist(0)
        currentDist.current = 0
        touchStartY.current = 0
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [mainRef])

  return { pullDist, refreshing }
}

export default function PWALayout({ children }) {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const { actief: seizoen } = useSeason()
  const invullenActive = location.pathname.startsWith('/app/invullen')
  const [splashKlaar, setSplashKlaar] = useState(false)

  const mainRef = useRef(null)
  const { pullDist, refreshing } = usePullToRefresh(mainRef)
  const pulling = pullDist > 0 || refreshing
  const progress = Math.min(pullDist / PULL_THRESHOLD, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      {!splashKlaar && <PWASplashScreen onKlaar={() => setSplashKlaar(true)} />}

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

      {/* Pull-to-refresh indicator */}
      {pulling && (
        <div style={{
          position: 'fixed',
          top: `${62 + pullDist - 52}px`,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 49,
          width: '40px', height: '40px',
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: refreshing ? 1 : progress,
          pointerEvents: 'none',
          transition: refreshing ? 'top 0.25s cubic-bezier(0.34,1.4,0.64,1)' : 'none',
        }}>
          <img
            src="/logo.png"
            alt=""
            style={{
              width: '24px', height: '24px', objectFit: 'contain',
              transform: !refreshing ? `rotate(${progress * 360}deg)` : undefined,
              animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
            }}
          />
        </div>
      )}

      {/* Page content */}
      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: '110px' }}>
        {children}
      </main>

      <AnnouncementPopup />

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 36px)',
        paddingTop: '8px',
        paddingLeft: '16px', paddingRight: '16px',
        background: 'linear-gradient(to top, rgba(10,10,20,0.98) 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(22,22,38,0.97)',
          borderRadius: '100px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          padding: '6px',
          gap: '2px',
          pointerEvents: 'all',
          backdropFilter: 'blur(20px)',
        }}>
          <span style={{
            position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 4px)', right: '24px',
            fontSize: '9px', color: 'rgba(255,255,255,0.1)', pointerEvents: 'none',
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
                  flex: active ? '0 0 auto' : 1,
                  display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '7px',
                  padding: active ? '13px 20px' : '13px 0',
                  textDecoration: 'none',
                  borderRadius: '100px',
                  background: active ? 'white' : 'transparent',
                  color: active ? '#0f172a' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                  whiteSpace: 'nowrap',
                  minWidth: active ? 'auto' : 0,
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex' }}>
                  {tab.icon}
                </div>
                {active && (
                  <span style={{
                    fontSize: '13px', fontWeight: '700',
                    letterSpacing: '-0.01em',
                  }}>
                    {tab.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
