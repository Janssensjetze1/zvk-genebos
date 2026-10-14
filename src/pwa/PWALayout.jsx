import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { AnnouncementPopup } from '../components/AnnouncementPopup'
import PWASplashScreen from './PWASplashScreen'
import WedstrijdFormulier from '../components/WedstrijdFormulier'
import { Avatar, Icoon } from '../ui'

const TABS = [
  { path: '/app', label: 'Wedstrijden', icoon: 'kalender' },
  { path: '/app/klassement', label: 'Stand', icoon: 'klassement' },
  { path: '/app/stats', label: 'Stats', icoon: 'ster' },
  { path: '/app/spelers', label: 'Spelers', icoon: 'spelers' },
]

const MEER_ITEMS = [
  { label: 'Pronostiek', icoon: 'pronostiek', path: '/app/pronostiek' },
  { label: 'Badges', icoon: 'badge', path: '/app/badges' },
  { label: 'Info', icoon: 'info', path: '/app/info' },
  { label: 'Feedback', icoon: 'chat', path: '/app/feedback' },
  { label: 'Instellingen', icoon: 'beheer', path: '/app/account' },
]

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

    // Een veeg in een venster bovenop de pagina (badge, bottom sheet, formulier)
    // mag nooit verversen: dat venster scrollt zelf, terwijl de pagina eronder
    // gewoon bovenaan blijft staan. Hetzelfde voor elk eigen scrollvak dat niet
    // helemaal bovenaan staat.
    function inVensterOfScrollvak(doel) {
      if (document.body.style.overflow === 'hidden') return true
      for (let el = doel; el && el !== document.body; el = el.parentElement) {
        if (el === mainRef.current) break
        if (el.closest?.('.z-app-balk')) return false
        const stijl = getComputedStyle(el)
        if (stijl.position === 'fixed') return true
        if (/(auto|scroll)/.test(stijl.overflowY) && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return true
      }
      return false
    }

    function onTouchStart(e) {
      if (isAtTop() && !inVensterOfScrollvak(e.target)) {
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

// ─── Meer: bottom sheet met de secundaire schermen ───────────────────────────
function MeerMenu({ open, onClose, isAdmin, onNieuweWedstrijd }) {
  const navigate = useNavigate()
  if (!open) return null

  function ga(pad) {
    onClose()
    navigate(pad)
  }

  return (
    <>
      <div className="z-sheet-achter" onClick={onClose} />
      <div className="z-sheet" role="dialog" aria-label="Meer">
        <div className="z-sheet-greep" />

        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className="z-knop z-knop-primair"
              onClick={() => { onClose(); onNieuweWedstrijd() }}
              style={{ flex: 1, height: '48px', fontSize: '15px' }}
            >
              <Icoon naam="plus" grootte={18} dikte={2.2} />
              Wedstrijd
            </button>
            <button
              type="button"
              className="z-knop"
              onClick={() => ga('/app/invullen')}
              style={{ flex: 1, height: '48px', fontSize: '15px' }}
            >
              <Icoon naam="invullen" grootte={18} dikte={2} />
              Uitslag invullen
            </button>
          </div>
        )}

        <div className="z-kaart z-lijst" style={{ overflow: 'hidden' }}>
          {MEER_ITEMS.map(item => (
            <div
              key={item.path}
              className="z-rij z-rij-klik"
              onClick={() => ga(item.path)}
              style={{ padding: '10px 16px', minHeight: '52px' }}
            >
              <span className="z-icoonvak"><Icoon naam={item.icoon} grootte={18} /></span>
              <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: 'var(--z-tekst)' }}>{item.label}</span>
              <Icoon naam="chevron" grootte={16} dikte={2} className="z-chevron" />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="z-knop"
          onClick={onClose}
          style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '12px' }}
        >
          Sluiten
        </button>
      </div>
    </>
  )
}

export default function PWALayout({ children }) {
  const { pathname } = useLocation()
  const { isAdmin, profile } = useAuth()
  const [splashKlaar, setSplashKlaar] = useState(() => !!sessionStorage.getItem('splash_done'))
  const [meerOpen, setMeerOpen] = useState(false)
  const [nieuweWedstrijd, setNieuweWedstrijd] = useState(false)
  const navigate = useNavigate()

  const mainRef = useRef(null)
  const { pullDist, refreshing } = usePullToRefresh(mainRef)
  const pulling = pullDist > 0 || refreshing
  const progress = Math.min(pullDist / PULL_THRESHOLD, 1)

  // Meer-tab oplichten op de schermen die je via Meer bereikt
  const viaMeer = MEER_ITEMS.some(i => pathname.startsWith(i.path)) || pathname.startsWith('/app/invullen')

  return (
    <div className="z-app">
      {!splashKlaar && <PWASplashScreen onKlaar={() => { sessionStorage.setItem('splash_done', '1'); setSplashKlaar(true) }} />}

      <header className="z-app-balk">
        {/* Links: profielfoto, rechtstreeks naar je instellingen */}
        <button
          onClick={() => navigate('/app/account')}
          aria-label="Instellingen"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
        >
          <Avatar
            naam={profile?.display_name ?? profile?.email}
            foto={profile?.avatar_url}
            grootte={34}
            style={{ background: 'rgba(127,162,255,0.2)', color: '#c7d6ff', boxShadow: '0 0 0 2px rgba(255,255,255,0.15)' }}
          />
        </button>

        {/* Midden: logo dat uitsteekt onder de balk en meebeweegt bij pull-to-refresh */}
        <div style={{
          position: 'absolute', left: '50%', bottom: '-16px',
          transform: `translateX(-50%) scale(${pulling ? 1 + progress * 0.5 : 1})`,
          transition: refreshing ? 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)' : 'transform 0.2s ease',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--z-navy)',
          boxShadow: pulling
            ? `0 0 0 ${2 + progress * 3}px rgba(127,162,255,${0.25 + progress * 0.35}), 0 6px 18px rgba(12,26,61,0.35)`
            : '0 0 0 2px rgba(255,255,255,0.12), 0 6px 18px rgba(12,26,61,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
        }}>
          <img
            src="/logo.png"
            alt="ZVK Genebos"
            style={{
              width: '38px', height: '38px', objectFit: 'contain',
              transform: pulling && !refreshing ? `rotate(${progress * 360}deg)` : undefined,
              animation: refreshing ? 'spin 0.75s linear infinite' : 'none',
            }}
          />
        </div>

        {/* Rechts: admin kan meteen invullen, anders een lege plek zodat het logo centraal blijft */}
        {isAdmin ? (
          <button
            onClick={() => navigate('/app/invullen')}
            aria-label="Wedstrijden invullen"
            style={{
              width: '34px', height: '34px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icoon naam="invullen" grootte={17} dikte={2} />
          </button>
        ) : <div style={{ width: 34 }} />}
      </header>

      <MeerMenu open={meerOpen} onClose={() => setMeerOpen(false)} isAdmin={isAdmin} onNieuweWedstrijd={() => setNieuweWedstrijd(true)} />
      {nieuweWedstrijd && (
        <WedstrijdFormulier
          onSluiten={() => setNieuweWedstrijd(false)}
          onOpgeslagen={() => window.dispatchEvent(new Event('zvk:wedstrijden-gewijzigd'))}
        />
      )}

      <main ref={mainRef} className="z-app-inhoud">
        {children}
      </main>

      <AnnouncementPopup />

      {/* Zwevende navigatiepil */}
      <nav className="z-pilnav">
        <div className="z-pilnav-balk">
          {TABS.map(tab => {
            const actief = tab.path === '/app'
              ? pathname === '/app' || pathname.startsWith('/app/wedstrijd/')
              : pathname.startsWith(tab.path)
            return (
              <Link key={tab.path} to={tab.path} className="z-pil" aria-current={actief && !meerOpen ? 'page' : undefined}>
                <Icoon naam={tab.icoon} grootte={20} />
                <span className="z-pil-label">{tab.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            className="z-pil"
            onClick={() => setMeerOpen(v => !v)}
            aria-current={meerOpen || viaMeer ? 'page' : undefined}
          >
            <Icoon naam="meer" grootte={20} dikte={3} />
            <span className="z-pil-label">Meer</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
