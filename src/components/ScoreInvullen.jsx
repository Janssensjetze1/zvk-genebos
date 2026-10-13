import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ScoreRij } from './WedstrijdFormulier'
import PloegLogo from './PloegLogo'
import { Icoon } from '../ui'

// Klein venster om enkel de uitslag van een wedstrijd in te vullen, voor de
// wedstrijden van de andere ploegen. Op telefoon een bottom sheet.
export default function ScoreInvullen({ wedstrijd: w, onSluiten, onOpgeslagen }) {
  const [thuis, setThuis] = useState(w.home_score ?? 0)
  const [uit, setUit] = useState(w.away_score ?? 0)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toets = e => { if (e.key === 'Escape') onSluiten() }
    window.addEventListener('keydown', toets)
    return () => { document.body.style.overflow = vorige; window.removeEventListener('keydown', toets) }
  }, [onSluiten])

  async function opslaan() {
    setBezig(true); setFout('')
    const { error } = await supabase.from('matches').update({ home_score: thuis, away_score: uit }).eq('id', w.id)
    setBezig(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    onOpgeslagen?.()
    onSluiten()
  }

  const datum = new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <div className="z-sheet-achter" onClick={onSluiten} />
      <div className="z-paneel" role="dialog" aria-label="Uitslag invullen">
        <div className="z-paneel-kop">
          <h2>Uitslag invullen</h2>
          <button type="button" className="z-knop z-knop-stil" onClick={onSluiten} aria-label="Sluiten" style={{ width: '36px', padding: 0 }}>
            <Icoon naam="sluit" grootte={18} dikte={2} />
          </button>
        </div>

        <div className="z-paneel-inhoud">
          <p style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginBottom: '-8px' }}>
            {datum.charAt(0).toUpperCase() + datum.slice(1)}{w.time ? ` · ${w.time.slice(0, 5)}` : ''}
          </p>
          <div className="z-kaart" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[[w.home_team, thuis, setThuis], [w.away_team, uit, setUit]].map(([team, waarde, zet]) => (
              <div key={team?.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PloegLogo team={team} grootte={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ScoreRij naam={team?.name} waarde={waarde} onChange={zet} />
                </div>
              </div>
            ))}
          </div>
          {fout && <p style={{ fontSize: '13px', color: 'var(--z-verlies)' }}>{fout}</p>}
        </div>

        <div className="z-paneel-voet">
          <button type="button" className="z-knop" onClick={onSluiten} style={{ flex: 1, height: '48px' }}>Annuleren</button>
          <button type="button" className="z-knop z-knop-primair" onClick={opslaan} disabled={bezig} style={{ flex: 2, height: '48px', fontSize: '15px' }}>
            {bezig ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </>
  )
}
