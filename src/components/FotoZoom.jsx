import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icoon } from '../ui'

// Productfoto's op volledig scherm. Op gsm knijp je om in te zoomen, tik je
// twee keer om in of uit te zoomen, sleep je om rond te kijken en veeg je
// opzij naar de volgende foto. Op computer zoom je met het scrollwiel, en
// werken de pijltjestoetsen en Escape. Stijlen: .z-zoom-* in ui/ui.css.

const MAX = 4
const DUBBEL = 2.5
const VEEG = 60

const begrens = (v, min, max) => Math.min(max, Math.max(min, v))

export default function FotoZoom({ fotos, start = 0, naam, onSluit }) {
  const [index, setIndex] = useState(start)
  const vlak = useRef(null)
  const beeld = useRef(null)
  // Huidige stand: schaal s en verschuiving x, y (vanuit het midden)
  const stand = useRef({ s: 1, x: 0, y: 0 })
  const vingers = useRef(new Map())
  const gebaar = useRef(null)
  const laatsteTik = useRef(null)

  function zet(nieuw, vloeiend = false) {
    const el = vlak.current
    const { s } = nieuw
    // Niet verder schuiven dan de rand van de foto
    const mx = el ? (el.clientWidth * (s - 1)) / 2 : 0
    const my = el ? (el.clientHeight * (s - 1)) / 2 : 0
    stand.current = { s, x: s === 1 ? nieuw.x : begrens(nieuw.x, -mx, mx), y: s === 1 ? 0 : begrens(nieuw.y, -my, my) }
    const b = beeld.current
    if (!b) return
    b.style.transition = vloeiend ? 'transform 0.25s ease' : 'none'
    b.style.transform = `translate(${stand.current.x}px, ${stand.current.y}px) scale(${stand.current.s})`
  }

  // Een punt op het scherm, gemeten vanuit het midden van het vlak
  function punt(e) {
    const r = vlak.current.getBoundingClientRect()
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }
  }

  // Zoomen rond een punt: dat punt blijft onder je vinger of muis staan
  function zoomRond(p, s, van = stand.current, vloeiend = false) {
    s = begrens(s, 1, MAX)
    const f = s / van.s
    zet({ s, x: p.x - (p.x - van.x) * f, y: p.y - (p.y - van.y) * f }, vloeiend)
  }

  function ga(stap) {
    const nieuw = index + stap
    if (nieuw < 0 || nieuw >= fotos.length) return zet({ s: 1, x: 0, y: 0 }, true)
    setIndex(nieuw)
  }

  // Nieuwe foto: weer uitgezoomd
  useEffect(() => { zet({ s: 1, x: 0, y: 0 }) }, [index])

  useEffect(() => {
    const toets = e => {
      if (e.key === 'Escape') { e.stopPropagation(); onSluit() }
      if (e.key === 'ArrowLeft') ga(-1)
      if (e.key === 'ArrowRight') ga(1)
    }
    window.addEventListener('keydown', toets, true)
    return () => window.removeEventListener('keydown', toets, true)
  })

  // Scrollwiel: passief luisteren kan niet, want de pagina mag niet scrollen
  useEffect(() => {
    const el = vlak.current
    const wiel = e => {
      e.preventDefault()
      zoomRond(punt(e), stand.current.s * Math.exp(-e.deltaY * 0.0025))
    }
    el.addEventListener('wheel', wiel, { passive: false })
    return () => el.removeEventListener('wheel', wiel)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function neer(e) {
    try { vlak.current.setPointerCapture(e.pointerId) } catch { /* geen echte aanraking */ }
    vingers.current.set(e.pointerId, punt(e))
    const v = [...vingers.current.values()]
    if (v.length === 2) {
      gebaar.current = { soort: 'knijp', afstand: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), midden: { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2 }, van: { ...stand.current } }
    } else if (v.length === 1) {
      gebaar.current = { soort: 'sleep', begin: v[0], van: { ...stand.current }, bewogen: false }
    }
  }

  function beweeg(e) {
    if (!vingers.current.has(e.pointerId)) return
    vingers.current.set(e.pointerId, punt(e))
    const g = gebaar.current
    const v = [...vingers.current.values()]
    if (g?.soort === 'knijp' && v.length === 2) {
      const afstand = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y)
      const midden = { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2 }
      const s = begrens(g.van.s * (afstand / g.afstand), 1, MAX)
      const f = s / g.van.s
      zet({ s, x: midden.x - (g.midden.x - g.van.x) * f, y: midden.y - (g.midden.y - g.van.y) * f })
    } else if (g?.soort === 'sleep') {
      const dx = v[0].x - g.begin.x
      const dy = v[0].y - g.begin.y
      if (Math.hypot(dx, dy) > 6) g.bewogen = true
      // Uitgezoomd sleep je de foto opzij om naar de volgende te vegen
      zet({ s: g.van.s, x: g.van.x + dx, y: g.van.y + dy })
    }
  }

  function op(e) {
    if (!vingers.current.has(e.pointerId)) return
    vingers.current.delete(e.pointerId)
    const g = gebaar.current
    const rest = [...vingers.current.values()]

    if (g?.soort === 'knijp') {
      // Eén vinger blijft staan: verder slepen vanaf hier
      gebaar.current = rest.length === 1 ? { soort: 'sleep', begin: rest[0], van: { ...stand.current }, bewogen: true } : null
      if (stand.current.s < 1.05) zet({ s: 1, x: 0, y: 0 }, true)
      return
    }
    gebaar.current = null
    if (g?.soort !== 'sleep') return

    if (g.van.s === 1) {
      const dx = stand.current.x
      if (dx < -VEEG) return ga(1)
      if (dx > VEEG) return ga(-1)
      zet({ s: 1, x: 0, y: 0 }, true)
    }

    // Dubbel tikken: in- of uitzoomen
    if (!g.bewogen) {
      const nu = Date.now()
      const p = punt(e)
      const vorige = laatsteTik.current
      if (vorige && nu - vorige.tijd < 300 && Math.hypot(p.x - vorige.x, p.y - vorige.y) < 30) {
        laatsteTik.current = null
        if (stand.current.s > 1) zet({ s: 1, x: 0, y: 0 }, true)
        else zoomRond(p, DUBBEL, stand.current, true)
      } else {
        laatsteTik.current = { tijd: nu, ...p }
      }
    }
  }

  return createPortal(
    <div className="z-zoom" role="dialog" aria-modal="true" aria-label={`Foto's van ${naam}`}>
      <div
        ref={vlak}
        className="z-zoom-vlak"
        onPointerDown={neer}
        onPointerMove={beweeg}
        onPointerUp={op}
        onPointerCancel={op}
      >
        <img
          key={fotos[index]}
          ref={beeld}
          src={fotos[index]}
          alt={fotos.length > 1 ? `${naam}, foto ${index + 1} van ${fotos.length}` : naam}
          draggable={false}
        />
      </div>

      <button type="button" className="z-zoom-knop z-zoom-sluit" onClick={onSluit} aria-label="Sluiten">
        <Icoon naam="sluit" grootte={20} dikte={2.2} />
      </button>
      {fotos.length > 1 && (
        <>
          <span className="z-zoom-teller">{index + 1} / {fotos.length}</span>
          {index > 0 && (
            <button type="button" className="z-zoom-knop z-zoom-pijl links" onClick={() => ga(-1)} aria-label="Vorige foto">
              <Icoon naam="chevron" grootte={20} dikte={2.4} />
            </button>
          )}
          {index < fotos.length - 1 && (
            <button type="button" className="z-zoom-knop z-zoom-pijl rechts" onClick={() => ga(1)} aria-label="Volgende foto">
              <Icoon naam="chevron" grootte={20} dikte={2.4} />
            </button>
          )}
        </>
      )}
      <span className="z-zoom-tip">Knijp of tik twee keer om in te zoomen</span>
    </div>,
    document.body,
  )
}
