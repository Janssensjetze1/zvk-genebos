import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Icoon } from '../ui'

// De Hall of Fame, gedeeld door de app (PWAHallOfFame) en desktop
// (HallOfFamePagina). Voorlopig enkel de quotes: je blijft op dezelfde plaats
// staan en elke scroll brengt de volgende quote in beeld. De woorden vliegen
// uit de diepte op hun plaats, de vorige quote vliegt langs je heen.
// Stijlen: .z-hof-* in ui/ui.css.

// De aanhalingstekens tekenen we zelf; die uit de tekst vallen dus weg
const zonderAanhaling = tekst => tekst.trim().replace(/^["“”„]+|["“”„]+$/g, '').trim()
const norm = naam => (naam ?? '').trim().toLowerCase()

export default function HallOfFame() {
  const [quotes, setQuotes] = useState(null)
  const [fout, setFout] = useState(false)

  useEffect(() => {
    let actief = true
    Promise.all([
      supabase.from('quotes')
        .select('id, tekst, auteur')
        .eq('actief', true)
        .order('created_at', { ascending: false })
        .order('id'),
      supabase.from('players').select('name, nickname, photo_url'),
    ]).then(([q, s]) => {
      if (!actief) return
      // Een foto komt erbij als de auteur de naam of bijnaam van een speler is
      const fotos = new Map()
      for (const p of s.data ?? []) {
        if (!p.photo_url) continue
        for (const naam of [p.name, p.nickname]) if (norm(naam)) fotos.set(norm(naam), p.photo_url)
      }
      setFout(!!q.error)
      setQuotes((q.data ?? []).map(x => ({ ...x, tekst: zonderAanhaling(x.tekst), foto: fotos.get(norm(x.auteur)) })))
    })
    return () => { actief = false }
  }, [])

  return <Podium quotes={quotes} fout={fout} />
}

// ─── Podium ──────────────────────────────────────────────────────────────────

const klem = v => Math.min(1, Math.max(0, v))
const zacht = t => 1 - (1 - t) ** 3

// Vaste, schijnbaar willekeurige waarde tussen -1 en 1 per woord
const toeval = n => { const x = Math.sin(n * 127.1) * 43758.5453; return (x - Math.floor(x)) * 2 - 1 }

// Scène i op afstand d van het midden: d > 0 moet nog komen, d < 0 is voorbij
function toonScene(el, d, rustig) {
  const zichtbaar = d > -0.6 && d < 0.75
  el.style.visibility = zichtbaar ? 'visible' : 'hidden'
  if (!zichtbaar) return
  el.style.pointerEvents = Math.abs(d) < 0.3 ? 'auto' : 'none'

  // Weg: recht op je af, langs je heen
  const weg = klem((-d - 0.08) / 0.45)
  el.style.opacity = rustig ? 1 - klem(Math.abs(d) / 0.4) : 1 - weg
  if (rustig) return
  el.style.transform = `translateZ(${weg * weg * 620}px) rotateX(${weg * -14}deg)`

  const t = klem((0.72 - d) / 0.66)
  const woorden = el._woorden
  const n = woorden.length
  for (let k = 0; k < n; k++) {
    const l = zacht(klem((t - 0.1 - 0.4 * (k / n)) / 0.45))
    const r = 1 - l
    woorden[k].style.opacity = l
    woorden[k].style.transform = r < 0.001 ? 'none'
      : `translate3d(${toeval(k + 1) * 260 * r}px, ${toeval(k + 50) * 180 * r}px, ${-700 * r}px) rotateX(${toeval(k + 9) * 80 * r}deg) rotateZ(${toeval(k + 30) * 30 * r}deg)`
  }
  if (el._auteur) {
    const l = zacht(klem((t - 0.55) / 0.45))
    el._auteur.style.opacity = l
    el._auteur.style.transform = `translateY(${(1 - l) * 50}px)`
  }
  if (el._foto) {
    const l = zacht(klem((t - 0.15) / 0.7))
    el._foto.style.opacity = klem(l * 1.4)
    el._foto.style.transform = `rotateY(${(1 - l) * 200}deg) scale(${0.3 + 0.7 * l})`
  }
}

function Podium({ quotes, fout }) {
  const baan = useRef(null)
  const podium = useRef(null)
  const doek = useRef(null)
  const stralen = useRef(null)
  const teken = useRef(null)
  const balk = useRef(null)
  const teller = useRef(null)
  const aantal = quotes?.length ?? 0

  useEffect(() => {
    const el = podium.current
    const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scenes = [...el.querySelectorAll('.z-hof-scene')]
    for (const s of scenes) {
      s._woorden = [...s.querySelectorAll('.z-hof-woord')]
      s._auteur = s.querySelector('.z-hof-auteur')
      s._foto = s.querySelector('.z-hof-foto')
    }
    const ctx = doek.current.getContext('2d')
    let breed = 0, hoog = 0, stap = 1, raf = 0
    let pos = null, vorige = null

    // Elke quote zo groot als er plaats is
    function pasMaten() {
      breed = el.clientWidth
      hoog = el.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      doek.current.width = breed * dpr
      doek.current.height = hoog * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stap = Math.max(1, (baan.current.offsetHeight - hoog) / Math.max(1, scenes.length - 1))
      for (const s of scenes) {
        // Rondvliegende woorden tellen mee als overloop: eerst alles op zijn plaats
        for (const w of [...s._woorden, s._auteur, s._foto]) if (w) w.style.transform = 'none'
        const tekst = s.querySelector('blockquote')
        if (!tekst) continue
        const binnen = s.firstElementChild
        let maat = Math.min(68, Math.max(34, breed * 0.058))
        do { tekst.style.fontSize = `${maat}px`; maat -= 2 }
        while (maat > 12 && (binnen.scrollHeight > binnen.clientHeight || tekst.scrollWidth > tekst.clientWidth + 1))
      }
    }

    // Gouden stof: zweeft traag, en schiet in strepen voorbij als je scrollt
    const stof = Array.from({ length: rustig ? 0 : 110 }, (_, i) => ({ x: toeval(i + 200), y: toeval(i + 400), z: (toeval(i + 600) + 1) / 2 }))
    function tekenStof(snelheid) {
      ctx.clearRect(0, 0, breed, hoog)
      const mx = breed / 2, my = hoog / 2, schaal = Math.max(breed, hoog) * 0.5
      ctx.lineCap = 'round'
      for (const p of stof) {
        p.z -= 0.0006 + snelheid * 0.55
        if (p.z <= 0.06) p.z += 0.94
        if (p.z > 1) p.z -= 0.94
        const x = mx + (p.x / p.z) * schaal * 0.5, y = my + (p.y / p.z) * schaal * 0.5
        const z2 = Math.max(0.05, p.z + snelheid * 1.6)
        const x2 = mx + (p.x / z2) * schaal * 0.5, y2 = my + (p.y / z2) * schaal * 0.5
        ctx.globalAlpha = klem((1 - p.z) * 1.1) * 0.75
        ctx.strokeStyle = '#fcd34d'
        ctx.lineWidth = 0.6 + (1 - p.z) * 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x2 + 0.1, y2)
        ctx.stroke()
      }
    }

    function lus() {
      raf = requestAnimationFrame(lus)
      const boven = parseFloat(getComputedStyle(el).top) || 0
      const doel = Math.min(scenes.length - 1, Math.max(0, (boven - baan.current.getBoundingClientRect().top) / stap))
      // Zacht achter de scrollpositie aan, zodat ook een muiswiel vloeiend is
      pos = pos === null || rustig ? doel : pos + (doel - pos) * 0.14
      if (Math.abs(doel - pos) < 0.0005) pos = doel
      const snelheid = vorige === null ? 0 : pos - vorige
      const bewogen = pos !== vorige
      vorige = pos
      if (!rustig) tekenStof(Math.max(-0.08, Math.min(0.08, snelheid)))
      if (!bewogen) return

      scenes.forEach((s, i) => toonScene(s, i - pos, rustig))
      if (!rustig) {
        stralen.current.style.transform = `translate(-50%, -50%) rotate(${pos * 38}deg)`
        teken.current.style.transform = `translate(-50%, -50%) rotate(${Math.sin(pos * Math.PI) * 10}deg) scale(${1 + Math.sin(pos * Math.PI) ** 2 * 0.35})`
      }
      teken.current.style.opacity = klem(pos * 2) * 0.07
      balk.current.style.transform = `scaleX(${scenes.length > 1 ? pos / (scenes.length - 1) : 0})`
      const nr = Math.round(pos)
      teller.current.textContent = nr > 0 ? `${nr} / ${scenes.length - 1}` : ''
    }

    // Muiswiel en trackpad: één beweging is één quote, ook een klein tikje. De
    // uitloop van een trackpad telt niet mee.
    let aanvaard = 0, laatste = 0, vorigeDelta = 0
    function wiel(e) {
      if (e.ctrlKey || scenes.length < 2) return
      e.preventDefault()
      const nu = performance.now(), kracht = Math.abs(e.deltaY)
      const nieuw = nu - laatste > 110 || kracht > vorigeDelta + 4 || (kracht === vorigeDelta && kracht >= 80)
      laatste = nu
      vorigeDelta = kracht
      if (!nieuw || kracht < 3 || nu - aanvaard < 650) return
      aanvaard = nu
      const naar = Math.min(scenes.length - 1, Math.max(0, Math.round(window.scrollY / stap) + Math.sign(e.deltaY)))
      window.scrollTo({ top: naar * stap, behavior: rustig ? 'instant' : 'smooth' })
    }
    el.addEventListener('wheel', wiel, { passive: false })

    const herstel = () => { pasMaten(); vorige = null }
    herstel()
    const waarnemer = new ResizeObserver(herstel)
    waarnemer.observe(el)
    document.fonts?.ready.then(herstel)
    lus()
    return () => { cancelAnimationFrame(raf); el.removeEventListener('wheel', wiel); waarnemer.disconnect() }
  }, [quotes])

  // Altijd vooraan beginnen, en de volgende pagina niet halfweg openen
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div ref={baan} className="z-hof" style={{ '--scenes': aantal }}>
      {/* Onzichtbare haltes: elke scroll stopt netjes bij één quote */}
      {Array.from({ length: aantal + 1 }, (_, i) => <span key={i} className="z-hof-halte" style={{ '--i': i }} aria-hidden="true" />)}

      <div ref={podium} className="z-hof-podium">
        <div ref={stralen} className="z-hof-stralen" aria-hidden="true" />
        <canvas ref={doek} className="z-hof-stof" aria-hidden="true" />
        <div ref={teken} className="z-hof-teken" aria-hidden="true">“</div>

        <section className="z-hof-scene">
          <div className="z-hof-binnen z-hof-intro">
            <img src="/logo.png" alt="" className="z-hof-foto z-hof-logo" />
            <h1><span className="z-hof-woord">Hall</span> <span className="z-hof-woord">of</span> <span className="z-hof-woord goud">Fame</span></h1>
            <div className="z-hof-auteur">
              <p>
                {fout ? 'De quotes konden niet geladen worden. Probeer het straks nog eens.'
                  : quotes === null ? 'Even geduld...'
                    : aantal === 0 ? 'De eerste legendarische uitspraak moet nog komen.'
                      : 'Woorden die ZVK Genebos nooit meer vergeet.'}
              </p>
              {aantal > 0 && <span className="z-hof-hint">Scroll<Icoon naam="chevronOmlaag" grootte={20} dikte={2.4} /></span>}
            </div>
          </div>
        </section>

        {(quotes ?? []).map(q => (
          <section key={q.id} className="z-hof-scene">
            <figure className="z-hof-binnen">
              {q.foto && <span className="z-hof-foto z-hof-portret"><img src={q.foto} alt="" /></span>}
              <blockquote>
                <span className="z-hof-lees">{q.tekst}</span>
                <span aria-hidden="true">
                  {q.tekst.split(/\s+/).map((w, i) => [i > 0 && ' ', <span key={i} className="z-hof-woord">{w}</span>])}
                </span>
              </blockquote>
              <figcaption className="z-hof-auteur">{q.auteur}</figcaption>
            </figure>
          </section>
        ))}

        <div className="z-hof-voet" aria-hidden="true">
          <span ref={teller} />
          <div><i ref={balk} /></div>
        </div>
      </div>
    </div>
  )
}
