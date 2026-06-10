import { useEffect, useState, useRef } from 'react'

const QUOTES = [
  { text: "Voetbal is simpel, maar het moeilijkste da er is, is simpel voetballen.", auteur: "Johan Cruijff" },
  { text: "Kampioen , we pakken de beker ok nog!", auteur: "Dretze" },
  { text: "Burgemeester de Bie,beter wordt het nie.", auteur: "Nicole" },
  { text: "zoals ZVK’ers tegenwoordig doen won ik die wedstrijd ", auteur: "Lander Engelen" },
  { text: "Ik mut een wijf hemme om te daanse.", auteur: "Frank Den voorzitter" },
  { text: "Nog een kleine fun fact: al die lichte maaltijden hebben me niet geholpen, heb quasi heel de namiddag op het kleinste kamertje gezeten", auteur: "Lander Engelen" },
  { text: "Match gedaan, beker de lucht in, bubbels van de voorzitter opdrinken en een goei lange nabespreking in de Kantin. Gelukkig is het nog ni gedaan voor dit jaar, den DUBBEL is nog een optie. Den Antwaaarp deed het ons vorig seizoen voor. Zeer benieuwd of de gouden generatie zich hiervoor nog opgeladen krijgt.. Iedereen is bang van Genebos, nu ook tijdens de match", auteur: "Dretze" },
  { text: "Voetbal is ne godsdienst en het stadion is onze kerk.", auteur: "Pep Guardiola" },
  { text: "Mijne zondag begon zoals elke zondag bij mij, goed uitslapen zoals het hoort en een beetje bekomen van de lange nacht die ik tegenmoed was gegaan", auteur: "Jean" },
  { text: "Had ik nog zoveel moeten eten veu zowe een match.. Das nie het slimste idee dak had", auteur: "Luyte" },
  { text: "Ik heb wel op de deklat gesjot eh", auteur: "Dretze" },
  { text: "J'ai soif.", auteur: "Dretze" },
  { text: "Er werd weer verdedigd als janetten.", auteur: "De ZVK Supporters" },
  { text: "Dit jaar spelen we kampioen.", auteur: "Dretze" },
  { text: "Dieje he teveel deklatjuice gedronken", auteur: "Werres" },
]

function randomDuur() {
  const kans = Math.random()
  if (kans < 0.15) return 6000 + Math.random() * 2000  // 15%: express lang (6-8s)
  if (kans < 0.35) return 3500 + Math.random() * 1500  // 20%: iets langer (3.5-5s)
  return 1500 + Math.random() * 1500                   // 65%: normaal (1.5-3s)
}

export default function PWASplashScreen({ onKlaar }) {
  // Pull-to-refresh herlaadt de pagina — splash overslaan
  if (sessionStorage.getItem('ptr_reload')) {
    sessionStorage.removeItem('ptr_reload')
    setTimeout(onKlaar, 0)
    return null
  }

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
