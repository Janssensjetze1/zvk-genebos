import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { useMatchdayCountdown } from '../hooks/useMatchdayCountdown'
import { AnnouncementPopup } from './AnnouncementPopup'
import { Avatar, Icoon } from '../ui'
import { useThema } from '../lib/thema'
import { useShopOpen } from '../hooks/useShopOpen'

const NAV = [
  { label: 'Overzicht', path: '/', icoon: 'home' },
  { label: 'Wedstrijden', path: '/wedstrijden', icoon: 'kalender' },
  { label: 'Klassement', path: '/klassement', icoon: 'klassement' },
  { label: 'Statistieken', path: '/stats', icoon: 'ster' },
  { label: 'Spelers', path: '/spelers', icoon: 'spelers' },
  { label: 'Pronostiek', path: '/pronostiek', icoon: 'pronostiek' },
  { label: 'Badges', path: '/badges', icoon: 'badge' },
  { label: 'ZVK-fanshop', path: '/fanshop', icoon: 'winkel', enkelAlsShopOpen: true },
]

const ADMIN_NAV = [
  { label: 'Beheer', path: '/admin', icoon: 'beheer' },
]

// Titel in de topbalk, op basis van de route
const TITELS = {
  '/': 'Overzicht',
  '/wedstrijden': 'Wedstrijden',
  '/klassement': 'Klassement',
  '/stats': 'Statistieken',
  '/spelers': 'Spelers',
  '/pronostiek': 'Pronostiek',
  '/badges': 'Badges',
  '/fanshop': 'ZVK-fanshop',
  '/account': 'Account',
  '/admin': 'Beheer',
  '/gouden-jaar': 'Het gouden jaar',
}

function titelVoor(pad) {
  if (pad.startsWith('/wedstrijd/')) return 'Wedstrijd'
  return TITELS[pad] ?? ''
}

function NavItem({ item, actief }) {
  return (
    <Link to={item.path} className="z-nav-item" aria-current={actief ? 'page' : undefined} title={item.label}>
      <Icoon naam={item.icoon} />
      <span className="z-nav-label">{item.label}</span>
    </Link>
  )
}

function Zijbalk() {
  const { isAdmin, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const shopOpen = useShopOpen()

  async function afmelden() {
    await signOut()
    navigate('/login')
  }

  const isActief = pad => pad === '/' ? pathname === '/' : pathname.startsWith(pad)
    || (pad === '/wedstrijden' && pathname.startsWith('/wedstrijd/'))

  return (
    <aside className="z-zijbalk">
      <Link to="/" className="z-merk">
        <img src="/logo.png" alt="ZVK Genebos" />
        <div className="z-merk-tekst">
          <div className="z-merk-naam">ZVK GENEBOS</div>
          <div className="z-merk-sub">Sinds 1991</div>
        </div>
      </Link>

      <nav className="z-nav">
        {NAV.filter(item => !item.enkelAlsShopOpen || shopOpen).map(item => <NavItem key={item.path} item={item} actief={isActief(item.path)} />)}

        {isAdmin && (
          <>
            <div className="z-nav-groep">Admin</div>
            {ADMIN_NAV.map(item => <NavItem key={item.path} item={item} actief={isActief(item.path)} />)}
          </>
        )}
      </nav>

      <div className="z-zijbalk-voet">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link
            to="/account"
            className="z-profiel"
            aria-current={pathname === '/account' ? 'page' : undefined}
            style={{ flex: 1, minWidth: 0 }}
            title="Account"
          >
            <Avatar
              naam={profile?.display_name}
              foto={profile?.avatar_url}
              grootte={32}
              style={{ background: 'rgba(127,162,255,0.2)', color: '#c7d6ff' }}
            />
            <div className="z-profiel-tekst" style={{ minWidth: 0 }}>
              <div className="z-profiel-naam">{profile?.display_name ?? 'Mijn account'}</div>
              <div className="z-profiel-sub">{isAdmin ? 'Admin' : 'Lid'}</div>
            </div>
          </Link>
          <button className="z-afmelden" onClick={afmelden} title="Afmelden" aria-label="Afmelden">
            <Icoon naam="afmelden" grootte={16} dikte={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── Seizoenskiezer ──────────────────────────────────────────────────────────

function SeizoenKiezer() {
  const { seizoenen, actief, huidigSeizoen, switchSeizoen, isArchief } = useSeason()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!actief) return null
  const meerdere = seizoenen.length > 1

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="z-knop"
        onClick={() => meerdere && setOpen(o => !o)}
        style={{
          cursor: meerdere ? 'pointer' : 'default',
          ...(isArchief && { background: 'var(--z-gelijk-bg)', borderColor: 'var(--z-gelijk-rand)', color: 'var(--z-gelijk)' }),
        }}
      >
        <Icoon naam={isArchief ? 'archief' : 'kalender'} grootte={15} dikte={2} />
        <span style={{ fontWeight: 500, color: isArchief ? 'inherit' : 'var(--z-tekst-3)' }}>
          {isArchief ? 'Archief' : 'Seizoen'}
        </span>
        {actief.name}
        {meerdere && (
          <Icoon
            naam="chevronOmlaag"
            grootte={14}
            dikte={2}
            style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        )}
      </button>

      {open && (
        <div
          className="z-kaart"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
            minWidth: '220px', padding: '6px', boxShadow: 'var(--z-schaduw-l)',
          }}
        >
          {seizoenen.map(s => {
            const gekozen = s.id === actief.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { switchSeizoen(s); setOpen(false) }}
                className="z-rij-klik"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  height: '36px', padding: '0 10px', border: 'none', borderRadius: '6px',
                  background: gekozen ? 'var(--z-blauw-50)' : 'transparent',
                  color: gekozen ? 'var(--z-blauw)' : 'var(--z-tekst)',
                  fontSize: '13px', fontWeight: gekozen ? 600 : 500, textAlign: 'left',
                }}
              >
                <span style={{ flex: 1 }}>{s.name}</span>
                {s.id === huidigSeizoen?.id && (
                  <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', fontWeight: 500 }}>huidig</span>
                )}
                {gekozen && <Icoon naam="vink" grootte={14} dikte={2.4} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Snel wisselen tussen licht en donker; "Systeem" kies je in Account
function ThemaKnop() {
  const [, zetKeuze, isDonker] = useThema()
  return (
    <button
      type="button"
      className="z-knop z-knop-stil"
      onClick={() => zetKeuze(isDonker ? 'licht' : 'donker')}
      title={isDonker ? 'Licht thema' : 'Donker thema'}
      aria-label={isDonker ? 'Licht thema' : 'Donker thema'}
      style={{ width: '38px', padding: 0 }}
    >
      <Icoon naam={isDonker ? 'zon' : 'maan'} grootte={18} />
    </button>
  )
}

// ─── Banners ─────────────────────────────────────────────────────────────────

function MatchdayBanner() {
  const { actief: seizoen } = useSeason()
  const { wedstrijd, restTijd } = useMatchdayCountdown(seizoen?.id)

  if (!wedstrijd || !restTijd) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 40px', background: 'var(--z-blauw)', color: 'white', fontSize: '13px',
    }}>
      <span className="pulse-soft" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#86efac', flexShrink: 0 }} />
      <span style={{ fontWeight: 600 }}>Matchdag</span>
      <span style={{ opacity: 0.8 }}>
        {wedstrijd.home_team?.name ?? '?'} – {wedstrijd.away_team?.name ?? '?'} om {wedstrijd.time?.slice(0, 5)}
      </span>
      <span className="z-tab-nums" style={{ marginLeft: 'auto', fontWeight: 600 }}>nog {restTijd}</span>
    </div>
  )
}

function ArchiefBanner() {
  const { isArchief, actief, huidigSeizoen, switchSeizoen } = useSeason()
  if (!isArchief) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 40px', fontSize: '13px',
      background: 'var(--z-gelijk-bg)', color: 'var(--z-gelijk)',
      borderBottom: '1px solid var(--z-gelijk-rand)',
    }}>
      <Icoon naam="archief" grootte={16} dikte={2} />
      <span>
        Je bekijkt het archief van seizoen <strong>{actief?.name}</strong>. Alles is alleen-lezen.
      </span>
      {huidigSeizoen && (
        <button
          type="button"
          onClick={() => switchSeizoen(huidigSeizoen)}
          style={{
            marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'inherit', fontSize: '13px', fontWeight: 600, textDecoration: 'underline',
          }}
        >
          Terug naar {huidigSeizoen.name}
        </button>
      )}
    </div>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const titel = titelVoor(pathname)

  return (
    <div className="z-shell">
      <Zijbalk />
      <div className="z-hoofd">
        <header className="z-topbalk">
          <div className="z-kruimel">
            <span>ZVK Genebos</span>
            {titel && <><Icoon naam="chevron" grootte={14} dikte={2} /><strong>{titel}</strong></>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemaKnop />
            <SeizoenKiezer />
          </div>
        </header>
        <MatchdayBanner />
        <ArchiefBanner />
        <main className="z-inhoud">
          {children}
        </main>
      </div>
      <AnnouncementPopup />
    </div>
  )
}
