import { useState, useEffect, useRef, useCallback } from 'react'
import { useShake } from '../hooks/useShake'

const DRETZE_QUOTES = [
  "J'ai soif.",
  "Dit jaar spelen we kampioen.",
  "Ge moet da weten!",
  "Amai, da's ne schone goal!",
  "Ik em ni verloren, ik em ni gewonnen.",
  "Ze emme gevochten toch?",
  "Da's de schuld van den scheidsrechter.",
  "Volgend jaar is ons jaar.",
  "As ge da ni gelooft, moet ge ni komen kijken.",
  "Den bal wou ni binnen.",
]

const ZVK_KLEUREN = ['#1d4ed8', '#3b82f6', '#93c5fd', '#ffffff', '#dbeafe', '#fbbf24']

function maakConfettiDeeltje(container) {
  const el = document.createElement('div')
  const kleur = ZVK_KLEUREN[Math.floor(Math.random() * ZVK_KLEUREN.length)]
  const isRond = Math.random() > 0.5
  const grootte = 6 + Math.random() * 8
  const startX = Math.random() * window.innerWidth
  const duur = 2000 + Math.random() * 2000
  const delay = Math.random() * 600

  el.style.cssText = `
    position: fixed;
    top: -20px;
    left: ${startX}px;
    width: ${grootte}px;
    height: ${isRond ? grootte : grootte * 0.4}px;
    background: ${kleur};
    border-radius: ${isRond ? '50%' : '2px'};
    z-index: 9998;
    pointer-events: none;
    transform: rotate(${Math.random() * 360}deg);
    animation: confetti-val ${duur}ms ${delay}ms ease-in forwards;
  `
  container.appendChild(el)
  setTimeout(() => el.remove(), duur + delay + 100)
}

export default function ShakeEasterEgg() {
  const [zichtbaar, setZichtbaar] = useState(false)
  const [weggaan, setWeggaan] = useState(false)
  const [quote, setQuote] = useState('')
  const [isIOS, setIsIOS] = useState(false)
  const [iOSKlaar, setIOSKlaar] = useState(false)
  const confettiRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const ios = typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    setIsIOS(ios)
    if (!ios) setIOSKlaar(true) // Android/desktop: direct klaar
  }, [])

  const triggerEasterEgg = useCallback(() => {
    const q = DRETZE_QUOTES[Math.floor(Math.random() * DRETZE_QUOTES.length)]
    setQuote(q)
    setWeggaan(false)
    setZichtbaar(true)

    // Confetti
    if (confettiRef.current) {
      for (let i = 0; i < 60; i++) {
        maakConfettiDeeltje(confettiRef.current)
      }
    }

    // Auto-sluiten na 4s
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setWeggaan(true)
      setTimeout(() => setZichtbaar(false), 400)
    }, 4000)
  }, [])

  const { vraagIOSToestemming } = useShake(iOSKlaar ? triggerEasterEgg : () => {})

  async function handleIOSActiveer() {
    await vraagIOSToestemming()
    setIOSKlaar(true)
  }

  function handleSluiten() {
    clearTimeout(timerRef.current)
    setWeggaan(true)
    setTimeout(() => setZichtbaar(false), 400)
  }

  return (
    <>
      {/* Confetti container */}
      <div ref={confettiRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />

      {/* iOS activeer knopje — subtiel in de hoek */}
      {isIOS && !iOSKlaar && (
        <button
          onClick={handleIOSActiveer}
          style={{
            position: 'fixed', bottom: '130px', right: '16px', zIndex: 100,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px', padding: '6px 12px',
            fontSize: '11px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          }}
        >
          🤫
        </button>
      )}

      {/* Quote popup */}
      {zichtbaar && (
        <div
          onClick={handleSluiten}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '32px',
            pointerEvents: 'all',
          }}
        >
          <div style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '24px',
            padding: '32px 28px',
            maxWidth: '320px',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.1)',
            backdropFilter: 'blur(20px)',
            transform: weggaan ? 'scale(0.88)' : 'scale(1)',
            opacity: weggaan ? 0 : 1,
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', lineHeight: 1 }}>🍺</div>
            <p style={{
              fontSize: '20px', fontWeight: '800', fontStyle: 'italic',
              color: 'white', lineHeight: 1.4, marginBottom: '16px',
            }}>
              "{quote}"
            </p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              — Dretze
            </p>
          </div>
        </div>
      )}

      {/* Confetti CSS animatie */}
      <style>{`
        @keyframes confetti-val {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(${window.innerHeight + 40}px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </>
  )
}
