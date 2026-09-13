import { useEffect, useState, useRef } from 'react'
import { willekeurigeQuote } from '../lib/quotes'


function randomDuur() {
  return 5000
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
