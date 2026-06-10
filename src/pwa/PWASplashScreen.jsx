import { useEffect, useState, useRef } from 'react'

const QUOTES = [
  { text: "Voetbal is simpel, maar het moeilijkste da er is, is simpel voetballen.", auteur: "Johan Cruijff" },
  { text: "Ge kunt beter ne keer verliezen dan altijd tweede staan.", auteur: "Johan Cruijff" },
  { text: "In het voetbal wint altijd de beste ploeg. Soms is da de tegenstander.", auteur: "Johan Cruijff" },
  { text: "Amai, da was ne schone goal!", auteur: "Elke supporter ooit" },
  { text: "De bal is rond en de wedstrijd duurt negentig minuten.", auteur: "Sepp Herberger" },
  { text: "Ze emme verloren met 10-0 maar ze emme gevochten tot het einde.", auteur: "Elke trainer ooit" },
  { text: "Ge moet altijd geloven, zelfs as het ni meer kan.", auteur: "Marc Wilmots" },
  { text: "Voetbal is ne godsdienst en het stadion is onze kerk.", auteur: "Pep Guardiola" },
  { text: "Da's zijn tiende van het seizoen! Den kerel is ne machine!", auteur: "ZVK commentator" },
  { text: "Ik train om te winnen. Wie ni wil winnen, moet ni trainen.", auteur: "Zlatan Ibrahimović" },
  { text: "Some people think football is a matter of life and death. It's much more important than that.", auteur: "Bill Shankly" },
  { text: "J'ai soif.", auteur: "Dretze" },
  { text: "Er werd weer verdedigd als janetten.", auteur: "De ZVK Supporters" },
  { text: "Dit jaar spelen we kampioen.", auteur: "Dretze" },
]

function randomDuur() {
  const kans = Math.random()
  if (kans < 0.15) return 6000 + Math.random() * 2000  // 15%: express lang (6-8s)
  if (kans < 0.35) return 3500 + Math.random() * 1500  // 20%: iets langer (3.5-5s)
  return 1500 + Math.random() * 1500                   // 65%: normaal (1.5-3s)
}

export default function PWASplashScreen({ onKlaar }) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])
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
          fontSize: '15px', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.65, marginBottom: '12px', fontWeight: '400',
        }}>
          "{quote.text}"
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
