import { useEffect, useRef, useState } from 'react'

// Easter egg: typ ergens in de app "pint" of "bier" en er klinken twee pintjes
// in beeld. Luistert op elk tekstveld, zonder dat een pagina er iets voor hoeft
// te doen. Hoogstens één keer per paar seconden, zodat "pintje pintje" niet
// blijft afgaan.

const WOORD = /(pint|bier)$/i
const DUUR = 2200
const RUST = 4000

export default function Pintjes() {
  const [toon, setToon] = useState(0) // 0 = niets, anders een sleutel per keer
  const laatste = useRef(0)

  useEffect(() => {
    function opInvoer(e) {
      const el = e.target
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
      if (el.type === 'password' || e.inputType?.startsWith('delete')) return
      // Enkel net getypte tekst telt: kijk naar wat vlak voor de cursor staat
      const tot = el.selectionStart ?? el.value.length
      if (!WOORD.test(el.value.slice(0, tot))) return
      const nu = Date.now()
      if (nu - laatste.current < RUST) return
      laatste.current = nu
      setToon(nu)
    }
    document.addEventListener('input', opInvoer, true)
    return () => document.removeEventListener('input', opInvoer, true)
  }, [])

  useEffect(() => {
    if (!toon) return
    const t = setTimeout(() => setToon(0), DUUR)
    return () => clearTimeout(t)
  }, [toon])

  if (!toon) return null

  return (
    <div key={toon} className="z-pintjes" aria-hidden="true">
      <div className="z-pintjes-duo">
        <div className="z-pint z-pint-links"><Pint gespiegeld /></div>
        <div className="z-pint z-pint-rechts"><Pint /></div>
        <div className="z-pintjes-spat">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ '--hoek': `${-80 + i * 20}deg`, '--afstand': `${40 + (i % 3) * 14}px` }} />
          ))}
        </div>
      </div>
      <div className="z-pintjes-tekst">Schol!</div>
    </div>
  )
}

function Pint({ gespiegeld }) {
  const id = gespiegeld ? 'r' : 'l'
  return (
    <svg viewBox="0 0 100 130" width="100%" height="100%" style={gespiegeld ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <linearGradient id={`bier-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="0.45" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Oor */}
      <path d="M74 44 h10 a12 12 0 0 1 12 12 v26 a12 12 0 0 1 -12 12 h-10" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="7" />
      {/* Bier */}
      <path d="M14 34 h62 l-4 84 a8 8 0 0 1 -8 7 H26 a8 8 0 0 1 -8 -7 Z" fill={`url(#bier-${id})`} />
      {/* Belletjes */}
      <g fill="rgba(255,255,255,0.7)">
        <circle className="z-pint-bel" cx="32" cy="100" r="2.2" />
        <circle className="z-pint-bel" cx="50" cy="110" r="1.8" style={{ animationDelay: '0.3s' }} />
        <circle className="z-pint-bel" cx="60" cy="95" r="2" style={{ animationDelay: '0.6s' }} />
      </g>
      {/* Glans */}
      <path d="M24 42 l3 70" stroke="rgba(255,255,255,0.45)" strokeWidth="4" strokeLinecap="round" />
      {/* Glas */}
      <path d="M14 34 h62 l-4 84 a8 8 0 0 1 -8 7 H26 a8 8 0 0 1 -8 -7 Z" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" />
      {/* Schuimkraag */}
      <g fill="#fffbeb">
        <circle cx="22" cy="32" r="11" />
        <circle cx="38" cy="26" r="13" />
        <circle cx="56" cy="27" r="12" />
        <circle cx="70" cy="33" r="10" />
        <rect x="14" y="30" width="62" height="10" />
      </g>
    </svg>
  )
}
