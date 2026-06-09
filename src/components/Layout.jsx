import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSeason } from '../context/SeasonContext'

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Spelers', path: '/spelers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Wedstrijden', path: '/wedstrijden', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Klassement', path: '/klassement', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const adminItems = [
  { label: 'Beheer', path: '/admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const NavLink = ({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className="nav-item"
    style={{
      display: 'flex', alignItems: 'center', gap: '11px',
      padding: '10px 12px', borderRadius: '10px',
      textDecoration: 'none', fontSize: '14px', fontWeight: '500',
      background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
      color: active ? '#93c5fd' : 'rgba(255,255,255,0.5)',
      boxShadow: active ? 'inset 0 0 0 1px rgba(59,130,246,0.25)' : 'none',
    }}
  >
    <svg style={{ width: '16px', height: '16px', flexShrink: 0, opacity: active ? 1 : 0.7 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
    </svg>
    {item.label}
  </Link>
)

function GoudenJaarLink({ onClose }) {
  const spanRef = useRef(null)
  const lastPos = useRef({ x: 0, t: 0 })
  const rafRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = useCallback((e) => {
    const el = spanRef.current
    if (!el) return
    const rect = e.currentTarget.getBoundingClientRect()
    const rx = (e.clientX - rect.left) / rect.width
    const now = Date.now()
    const dx = e.clientX - lastPos.current.x
    const dt = Math.max(now - lastPos.current.t, 1)
    const speed = Math.min(Math.abs(dx / dt) * 80, 100)
    lastPos.current = { x: e.clientX, t: now }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const p = rx * 100
      const brightness = (1 + speed / 100).toFixed(2)
      el.style.backgroundImage = `linear-gradient(
        105deg,
        #b8860b 0%,
        #b8860b ${(p - 22).toFixed(0)}%,
        #fff8c0 ${(p - 4).toFixed(0)}%,
        #ffd700 ${p.toFixed(0)}%,
        #fff8c0 ${(p + 4).toFixed(0)}%,
        #b8860b ${(p + 22).toFixed(0)}%,
        #b8860b 100%
      )`
      el.style.filter = `brightness(${brightness})`
    })
  }, [])

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    const el = spanRef.current
    if (el) { el.style.backgroundImage = ''; el.style.filter = '' }
  }, [])

  return (
    <div style={{ padding: '0 8px 8px' }}>
      <style>{`
        @keyframes goudGolf {
          0%   { transform: translateY(0px) rotate(0deg); }
          20%  { transform: translateY(-2px) rotate(-0.5deg); }
          40%  { transform: translateY(1px) rotate(0.4deg); }
          60%  { transform: translateY(-1.5px) rotate(-0.3deg); }
          80%  { transform: translateY(0.5px) rotate(0.2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .gouden-tekst {
          display: inline-block;
          color: #c9a84c;
          transition: color 0.2s;
        }
        .gouden-tekst.actief {
          background: linear-gradient(105deg, #b8860b 0%, #b8860b 30%, #ffd700 50%, #b8860b 70%, #b8860b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: goudGolf 1.8s ease-in-out infinite;
        }
      `}</style>
      <Link
        to="/gouden-jaar"
        onClick={onClose}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px',
          textDecoration: 'none', fontSize: '14px', fontWeight: '700',
        }}
      >
        <span style={{ fontSize: '15px', flexShrink: 0 }}>🏆</span>
        <span ref={spanRef} className={`gouden-tekst${hovered ? ' actief' : ''}`}>Het gouden jaar</span>
      </Link>
    </div>
  )
}

function Sidebar({ onClose }) {
  const { isAdmin, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside style={{
      width: '220px', height: '100%',
      background: 'rgba(10,10,20,0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="ZVK Genebos" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', letterSpacing: '-0.2px' }}>ZVK Genebos</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>Zaalvoetbal</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink key={item.path} item={item} active={location.pathname === item.path} onClick={onClose} />
        ))}

        {isAdmin && (
          <>
            <div style={{ margin: '14px 0 6px 12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</span>
            </div>
            {adminItems.map(item => (
              <NavLink key={item.path} item={item} active={location.pathname.startsWith('/admin')} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Gouden Jaar — tijdelijk verborgen */}
      {false && isAdmin && <GoudenJaarLink onClose={onClose} />}

      {/* Profiel */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to="/account"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '10px',
            textDecoration: 'none', marginBottom: '6px',
            background: 'rgba(255,255,255,0.04)',
            transition: 'background 0.15s',
          }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#93c5fd',
            overflow: 'hidden', border: '1.5px solid rgba(59,130,246,0.3)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile?.display_name ?? '?').charAt(0).toUpperCase()
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.display_name ?? 'Mijn account'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Instellingen</div>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
          }}
          style={{
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '12px', color: 'rgba(255,255,255,0.25)', padding: '7px 10px',
            textAlign: 'left', borderRadius: '8px', transition: 'background 0.15s, color 0.15s',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Afmelden
        </button>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', padding: '2px 10px', display: 'block' }}>v0.1</span>
      </div>
    </aside>
  )
}

function ArchiefBanner() {
  const { isArchief, actief, huidigSeizoen, switchSeizoen } = useSeason()
  if (!isArchief) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #92400e, #b45309)',
      color: 'white',
      padding: '12px 24px',
      display: 'flex', alignItems: 'center', gap: '14px',
      borderBottom: '1px solid rgba(255,255,255,0.15)',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>📦</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.02em' }}>
          ARCHIEFMODUS
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>
          Je bekijkt het archief van seizoen <strong style={{ color: 'white' }}>{actief?.name}</strong>. Gegevens zijn alleen-lezen.
        </div>
      </div>
      {huidigSeizoen && (
        <button
          onClick={() => switchSeizoen(huidigSeizoen)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', borderRadius: '8px', padding: '7px 14px',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
        >
          ← Terug naar huidig seizoen
        </button>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile } = useAuth()

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

        {/* Top nav */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(9,9,15,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: '52px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="ZVK" style={{ height: '32px', objectFit: 'contain' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>ZVK Genebos</span>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', padding: '7px', color: 'white', lineHeight: 0 }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Overlay */}
        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }} />
        )}

        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300,
          width: '240px',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Sidebar onClose={() => setDrawerOpen(false)} />
        </div>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ArchiefBanner />
          <div style={{ padding: '24px 16px', flex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
        <ArchiefBanner />
        <main style={{ flex: 1, padding: '40px 44px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
