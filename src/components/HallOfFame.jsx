import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Laden, LegeStaat } from '../ui'

// De Hall of Fame, gedeeld door de app (PWAHallOfFame) en desktop
// (HallOfFamePagina). Elke rubriek is een eigen sectie onder de hero; voorlopig
// zijn dat enkel de quotes. Stijlen: .z-hof-* in ui/ui.css.

export default function HallOfFame() {
  return (
    <div className="z-hof">
      <header className="z-hof-held">
        <img src="/logo.png" alt="" aria-hidden="true" className="z-hof-held-logo" />
        <div className="z-hof-bovenlabel">Voor de eeuwigheid</div>
        <h1>Hall of <span>Fame</span></h1>
        <p>De momenten en woorden die ZVK Genebos nooit meer vergeet.</p>
      </header>
      <Quotes />
    </div>
  )
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

// De kaart zet zelf aanhalingstekens; die uit de tekst vallen dus weg
const zonderAanhaling = tekst => tekst.trim().replace(/^["“”„]+|["“”„]+$/g, '').trim()

function Quotes() {
  const [quotes, setQuotes] = useState(null)
  const [fout, setFout] = useState(false)
  const [auteur, setAuteur] = useState(null)

  useEffect(() => {
    let actief = true
    supabase.from('quotes')
      .select('id, tekst, auteur')
      .eq('actief', true)
      .order('created_at', { ascending: false })
      .order('id')
      .then(({ data, error }) => {
        if (!actief) return
        setFout(!!error)
        setQuotes(data ?? [])
      })
    return () => { actief = false }
  }, [])

  // Een knop per auteur met meer dan één quote, de meest geciteerde eerst
  const perAuteur = {}
  for (const q of quotes ?? []) perAuteur[q.auteur] = (perAuteur[q.auteur] ?? 0) + 1
  const auteurs = Object.entries(perAuteur)
    .filter(([, aantal]) => aantal > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const getoond = (quotes ?? []).filter(q => !auteur || q.auteur === auteur)

  return (
    <section aria-labelledby="hof-quotes">
      <div className="z-hof-kop">
        <h2 id="hof-quotes">Quotes</h2>
        {getoond.length > 0 && <span>{getoond.length} {getoond.length === 1 ? 'quote' : 'quotes'}</span>}
      </div>

      {quotes === null ? <Laden regels={4} /> : fout ? (
        <LegeStaat titel="Laden mislukt" tekst="De quotes konden niet geladen worden. Probeer het straks nog eens." icoon="citaat" />
      ) : quotes.length === 0 ? (
        <LegeStaat titel="Nog geen quotes" tekst="De eerste legendarische uitspraak moet nog komen." icoon="citaat" />
      ) : (
        <>
          {auteurs.length > 1 && (
            <div className="z-hof-filters" role="group" aria-label="Filter op auteur">
              <button type="button" aria-pressed={!auteur} onClick={() => setAuteur(null)}>Iedereen</button>
              {auteurs.map(([naam, aantal]) => (
                <button key={naam} type="button" aria-pressed={auteur === naam} onClick={() => setAuteur(auteur === naam ? null : naam)}>
                  {naam}<small>{aantal}</small>
                </button>
              ))}
            </div>
          )}
          <div className="z-hof-quotes">
            {getoond.map(q => {
              const tekst = zonderAanhaling(q.tekst)
              const maat = tekst.length <= 45 ? ' groot' : tekst.length > 110 ? ' lang' : ''
              return (
                <figure key={q.id} className={`z-hof-quote${maat}`}>
                  <span className="z-hof-teken" aria-hidden="true">“</span>
                  <blockquote>{tekst}</blockquote>
                  <figcaption>{q.auteur}</figcaption>
                </figure>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
