import { useEffect, useState, useRef } from 'react'
import { willekeurigeQuote } from '../lib/quotes'


function randomDuur() {
  return 5000
}

// Gouden ster boven het logo. Met de hand getekend, geen icoonpakket: een
// klassieke vijfpuntige ster met facetten — elke punt bestaat uit een lichte
// en een donkere helft, zodat ze gefacetteerd oogt in plaats van vlak.
// De animaties (opkomst + trage gloed) staan in index.css.
function Ster({ weg }) {
  const STER = 'M50 5 L60.9 36 L93.7 36.8 L67.6 56.7 L77 88.2 L50 69.5 L23 88.2 L32.4 56.7 L6.3 36.8 L39.1 36 Z'
  const LICHT = 'M50 51 L39.1 36 L50 5 Z M50 51 L60.9 36 L93.7 36.8 Z M50 51 L67.6 56.7 L77 88.2 Z M50 51 L50 69.5 L23 88.2 Z M50 51 L32.4 56.7 L6.3 36.8 Z'
  const DONKER = 'M50 51 L50 5 L60.9 36 Z M50 51 L93.7 36.8 L67.6 56.7 Z M50 51 L77 88.2 L50 69.5 Z M50 51 L23 88.2 L32.4 56.7 Z M50 51 L6.3 36.8 L39.1 36 Z'

  return (
    <svg
      className="zvk-ster"
      width="26" height="26" viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        marginBottom: '16px',
        opacity: weg ? 0 : undefined,
        transition: 'opacity 0.4s',
      }}
    >
      <defs>
        <linearGradient id="zvk-goud" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%"   stopColor="#fff3c4" />
          <stop offset="30%"  stopColor="#fcd34d" />
          <stop offset="72%"  stopColor="#f0a318" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      <path d={STER} fill="url(#zvk-goud)" />
      <path d={LICHT} fill="#ffffff" opacity="0.22" />
      <path d={DONKER} fill="#92400e" opacity="0.18" />
      <path d={STER} fill="none" stroke="#fff7d6" strokeOpacity="0.5" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

export default function PWASplashScreen({ onKlaar }) {
  // Pull-to-refresh herlaadt de pagina — splash overslaan
  if (sessionStorage.getItem('ptr_reload')) {
    sessionStorage.removeItem('ptr_reload')
    sessionStorage.setItem('splash_done', '1')
    setTimeout(onKlaar, 0)
    return null
  }

  const [quote] = useState(willekeurigeQuote)
  const [duur] = useState(() => randomDuur())
  const [voortgang, setVoortgang] = useState(0)
  const [weggaan, setWeggaan] = useState(false)
  const intervalRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    // Update voortgangsbalk elke 50ms
    intervalRef.current = setInterval(() => {
      const verstreken = Date.now() - startRef.current
      const pct = Math.min((verstreken / duur) * 100, 100)
      setVoortgang(pct)

      if (pct >= 100) {
        clearInterval(intervalRef.current)
        setWeggaan(true)
        setTimeout(onKlaar, 500)
      }
    }, 50)

    return () => clearInterval(intervalRef.current)
  }, [duur, onKlaar])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px',
      opacity: weggaan ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Gouden ster boven het logo */}
      <Ster weg={weggaan} />

      {/* Logo */}
      <img
        src="/logo.png"
        alt="ZVK Genebos"
        style={{
          width: '90px', height: '90px', objectFit: 'contain',
          marginBottom: '48px',
          opacity: weggaan ? 0 : 1,
          transform: weggaan ? 'scale(0.9)' : 'scale(1)',
          transition: 'opacity 0.4s, transform 0.4s',
        }}
      />

      {/* Quote */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '300px' }}>
        <p style={{
          fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '14px',
        }}>
          Quote of the day
        </p>
        <p style={{
          fontSize: '15px', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.65, marginBottom: '12px', fontWeight: '400',
        }}>
          "{quote.tekst}"
        </p>
        <p style={{
          fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          — {quote.auteur}
        </p>
      </div>

      {/* Loading bar */}
      <div style={{
        width: '180px', height: '3px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '100px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${voortgang}%`,
          background: 'linear-gradient(90deg, #3b82f6, #93c5fd)',
          borderRadius: '100px',
          transition: 'width 0.08s linear',
          boxShadow: '0 0 8px rgba(147,197,253,0.5)',
        }} />
      </div>
    </div>
  )
}
