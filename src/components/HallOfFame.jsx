import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar, Laden, LegeStaat } from '../ui'

// De Hall of Fame, gedeeld door de app (PWAHallOfFame) en desktop
// (HallOfFamePagina). Elke rubriek is een eigen sectie onder de hero; voorlopig
// zijn dat enkel de quotes, allemaal samen op een muur. Stijlen: .z-hof-* in
// ui/ui.css.

export default function HallOfFame() {
  return (
    <div className="z-hof">
      <header className="z-hof-held">
        <img src="/logo.png" alt="" aria-hidden="true" className="z-hof-held-logo" />
        <h1>Hall of <span>Fame</span></h1>
        <p>Woorden die ZVK Genebos nooit meer vergeet.</p>
      </header>
      <Quotes />
    </div>
  )
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

// De kaart zet zelf aanhalingstekens; die uit de tekst vallen dus weg
const zonderAanhaling = tekst => tekst.trim().replace(/^["“”„]+|["“”„]+$/g, '').trim()
const norm = naam => (naam ?? '').trim().toLowerCase()

function Quotes() {
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

  return (
    <section aria-labelledby="hof-quotes">
      <div className="z-hof-kop">
        <h2 id="hof-quotes">Quotes</h2>
        {quotes?.length > 0 && <span>{quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}</span>}
      </div>

      {quotes === null ? <Laden regels={4} /> : fout ? (
        <LegeStaat titel="Laden mislukt" tekst="De quotes konden niet geladen worden. Probeer het straks nog eens." icoon="citaat" />
      ) : quotes.length === 0 ? (
        <LegeStaat titel="Nog geen quotes" tekst="De eerste legendarische uitspraak moet nog komen." icoon="citaat" />
      ) : (
        <div className="z-hof-quotes">
          {quotes.map(q => (
            <figure key={q.id} className={`z-hof-quote${q.tekst.length <= 45 ? ' groot' : q.tekst.length > 110 ? ' lang' : ''}`}>
              <blockquote>“{q.tekst}”</blockquote>
              <figcaption>
                {q.foto && <Avatar naam={q.auteur} foto={q.foto} grootte={32} />}
                {q.auteur}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}
