import { Link, useLocation, useNavigate } from 'react-router-dom'
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
]

// Meer-tab (geen path, triggert menu)
const MEER_TAB = {
  label: 'Meer',
  icon: (
    <svg width={ICON_SIZE} height={ICON_SIZE} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  ),
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

const PULL_THRESHOLD = 72

function usePullToRefresh(mainRef) {
  const touchStartY  = useRef(0)
  const isTracking   = useRef(false)
  const currentDist  = useRef(0)
  const [pullDist,   setPullDist]   = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Controleer of de pagina werkelijk helemaal boven staat.
    // Scroll kan op window (body groeit) óf op het <main> element zitten.
    function isAtTop() {
      const winScroll  = window.scrollY ?? window.pageYOffset ?? 0
      const elScroll   = mainRef.current?.scrollTop ?? 0
      return winScroll === 0 && elScroll === 0
    }

    function resetGesture() {
      isTracking.current  = false
      touchStartY.current = 0
      currentDist.current = 0
    }

    function onTouchStart(e) {
      if (isAtTop()) {
        touchStartY.current = e.touches[0].clientY
        isTracking.current  = true
      }
    }

    function onTouchMove(e) {
      if (!isTracking.current || !isAtTop()) {
        resetGesture()
        return
      }
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta > 0) {
        e.preventDefault()
        const d = Math.min(delta * 0.45, PULL_THRESHOLD + 24)
        currentDist.current = d
        setPullDist(d)
      }
    }

    function onTouchEnd() {
      if (!isTracking.current) return
      if (currentDist.current >= PULL_THRESHOLD) {
        setRefreshing(true)
        resetGesture()
        setTimeout(() => {
          sessionStorage.setItem('ptr_reload', '1')
          window.location.reload()
        }, 650)
      } else {
        setPullDist(0)
        resetGesture()
      }
    }

    // Luister op window zodat we zowel window-scroll als element-scroll vangen
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [mainRef])

  return { pullDist, refreshing }
}

// ─── Profielfoto avatar met initialen fallback ────────────────────────────────
function Avatar({ src, naam, size = 38 }) {
  const initialen = (naam ?? '?').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const [imgFout, setImgFout] = useState(false)

  if (src && !imgFout) {
    return (
      <img
        src={src}
        alt={naam}
        onError={() => setImgFout(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)',
          display: 'block',
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: '700', color: 'white',
      border: '2px solid rgba(255,255,255,0.25)',
      flexShrink: 0,
    }}>
      {initialen}
    </div>
  )
}

// ─── Profiel-popover (badges + instellingen) ──────────────────────────────────
function ProfielPopover({ open, onClose }) {
  const navigate = useNavigate()
  if (!open) return null

  function ga(pad) {
    onClose()
    navigate(pad)
  }

  return (
    <>
      {/* Klikbaar overlay om te sluiten */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 98 }}
      />
      {/* Popover kaartje */}
      <div style={{
        position: 'fixed', top: '72px', left: '16px', zIndex: 99,
        background: 'rgba(18,18,32,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '170px',
        backdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={() => ga('/app/badges')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '13px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '14px', fontWeight: '500',
            textAlign: 'left',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span style={{ fontSize: '18px' }}>🏅</span>
          Badges
        </button>
        <button
          onClick={() => ga('/app/account')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '13px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', fontSize: '14px', fontWeight: '500',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚙️</span>
          Instellingen
        </button>
      </div>
    </>
  )
}

// ─── Secundaire nav (drie puntjes) ────────────────────────────────────────────
const MEER_ITEMS = [
  { label: 'Pagina 1', icon: '📄' },
  { label: 'Pagina 2', icon: '📋' },
]

function MeerMenu({ open, onClose, isAdmin }) {
  const navigate = useNavigate()
  if (!open) return null

  return (
    <>
      {/* Dimmed overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Side panel vanuit rechts */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: '280px',
        background: 'rgba(12,12,24,0.98)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
      }}>
        {/* Header paneel */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Meer</span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '18px',
            }}
          >×</button>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {MEER_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '500',
                textAlign: 'left', width: '100%',
                transition: 'background 0.12s',
              }}
              onPointerEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onPointerLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: '20px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Admin: invullen knop */}
          {isAdmin && (
            <button
              onClick={() => { onClose(); navigate('/app/invullen') }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                cursor: 'pointer', color: '#93c5fd', fontSize: '14px', fontWeight: '600',
                textAlign: 'left', width: '100%', marginTop: '8px',
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Invullen
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default function PWALayout({ children }) {
  const location = useLocation()
  const { isAdmin, profile } = useAuth()
  const { actief: seizoen } = useSeason()
  const [splashKlaar, setSplashKlaar] = useState(() => !!sessionStorage.getItem('splash_done'))
  const [profielOpen, setProfielOpen] = useState(false)
  const [meerOpen, setMeerOpen] = useState(false)

  const mainRef = useRef(null)
  const { pullDist, refreshing } = usePullToRefresh(mainRef)
  const pulling = pullDist > 0 || refreshing
  const progress = Math.min(pullDist / PULL_THRESHOLD, 1)

  const avatarSrc = profile?.avatar_url ?? null
  const avatarNaam = profile?.display_name ?? profile?.email ?? '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      {!splashKlaar && <PWASplashScreen onKlaar={() => { sessionStorage.setItem('splash_done', '1'); setSplashKlaar(true) }} />}

      {/* Top header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,20,0.97)',
        padding: '0 20px',
        height: '62px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'visible',
      }}>

        {/* Links: profielfoto */}
        <button
          onClick={() => setProfielOpen(v => !v)}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', flexShrink: 0, lineHeight: 0,
          }}
        >
          <Avatar src={avatarSrc} naam={avatarNaam} size={38} />
        </button>

        {/* Midden: logo in cirkel, uitstekend onder de header */}
        <div style={{
          position: 'absolute', left: '50%',
          bottom: '-14px',
          transform: 'translateX(-50%)',
          width: '58px', height: '58px',
          borderRadius: '50%',
          background: 'rgba(10,10,20,0.97)',
          border: '2.5px solid rgba(255,255,255,0.18)',
          boxShadow: '0 0 0 1px rgba(99,102,241,0.3), 0 4px 20px rgba(0,0,0,0.6), 0 0 24px rgba(99,102,241,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <img src="/logo.png" alt="ZVK" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
        </div>

        {/* Rechts: placeholder zodat logo exact gecentreerd blijft */}
        <div style={{ width: 38, flexShrink: 0 }} />
      </header>

      {/* Profiel popover */}
      <ProfielPopover open={profielOpen} onClose={() => setProfielOpen(false)} />

      {/* Meer menu */}
      <MeerMenu open={meerOpen} onClose={() => setMeerOpen(false)} isAdmin={isAdmin} />

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
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        paddingTop: '10px',
        paddingLeft: '16px', paddingRight: '16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(18, 18, 28, 0.55)',
          borderRadius: '100px',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '6px',
          gap: '2px',
          pointerEvents: 'all',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
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
                  padding: active ? '12px 20px' : '12px 0',
                  textDecoration: 'none',
                  borderRadius: '100px',
                  background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
                  boxShadow: active ? '0 2px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,1)' : 'none',
                  color: active ? '#0f172a' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                  whiteSpace: 'nowrap',
                  minWidth: active ? 'auto' : 0,
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex' }}>
                  {tab.icon}
                </div>
                {active && (
                  <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                    {tab.label}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Meer-tab (drie puntjes) */}
          <button
            onClick={() => setMeerOpen(v => !v)}
            style={{
              flex: meerOpen ? '0 0 auto' : 1,
              display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: '7px',
              padding: meerOpen ? '12px 20px' : '12px 0',
              borderRadius: '100px',
              background: meerOpen ? 'rgba(255,255,255,0.92)' : 'transparent',
              boxShadow: meerOpen ? '0 2px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,1)' : 'none',
              color: meerOpen ? '#0f172a' : 'rgba(255,255,255,0.45)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex' }}>
              {MEER_TAB.icon}
            </div>
            {meerOpen && (
              <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                {MEER_TAB.label}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  )
}
