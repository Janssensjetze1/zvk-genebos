import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { vandaagISO } from '../lib/wedstrijd'
import { Icoon, Segment } from '../ui'

// Eén formulier om elke wedstrijd te plannen of te bewerken, van ZVK of van
// twee andere ploegen. Op telefoon een bottom sheet, op desktop een venster.
// Met "Opslaan en nog één" blijven datum, uur en type staan, zodat een hele
// speeldag snel ingegeven is. Er wordt op zondag gespeeld, dus de datum staat
// standaard op de eerstvolgende zondag.
//
// Props:
//   wedstrijd     bestaande wedstrijd om te bewerken (leeg = nieuwe). Zonder id
//                 is het een voorstel: een nieuwe wedstrijd met die velden al
//                 ingevuld (bv. een bekerkoppel vanuit het beheer)
//   onSluiten     paneel dicht
//   onOpgeslagen  na elke opslag of ongedaan maken, om lijsten te verversen

const THUISZAAL = 'De Voordijcker'
const STANDAARD_UREN = ['18:00', '19:00', '20:00']
const TYPES = [
  { waarde: 'competitie', label: 'Competitie' },
  { waarde: 'beker', label: 'Beker' },
  { waarde: 'vriendschappelijk', label: 'Vriendschappelijk' },
]
const BEKER_RONDES = [
  { waarde: 'poule', label: 'Poule' },
  { waarde: 'kwart', label: '1/4' },
  { waarde: 'halve', label: '1/2' },
  { waarde: 'finale', label: 'Finale' },
]

function isoDag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Er wordt altijd op zondag gespeeld: de komende zondagen, vandaag inbegrepen
// als het zondag is
const AANTAL_ZONDAGEN = 6

function komendeZondagen(aantal = AANTAL_ZONDAGEN) {
  const nu = new Date()
  const eerste = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + ((7 - nu.getDay()) % 7))
  return Array.from({ length: aantal }, (_, i) =>
    isoDag(new Date(eerste.getFullYear(), eerste.getMonth(), eerste.getDate() + i * 7)))
}

function kortLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${d.toLocaleDateString('nl-BE', { month: 'short' }).replace('.', '')}`
}

function langLabel(iso) {
  const t = new Date(`${iso}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export default function WedstrijdFormulier({ wedstrijd, onSluiten, onOpgeslagen }) {
  const { actief: seizoen } = useSeason()
  const isBewerk = !!wedstrijd?.id

  const [teams, setTeams] = useState([])
  const [seizoenWedstrijden, setSeizoenWedstrijden] = useState([])
  const [laden, setLaden] = useState(true)

  const [thuisId, setThuisId] = useState(wedstrijd?.home_team_id ?? '')
  const [uitId, setUitId] = useState(wedstrijd?.away_team_id ?? '')
  const [datum, setDatum] = useState(wedstrijd?.date ?? komendeZondagen(1)[0])
  const [uur, setUur] = useState(wedstrijd?.time?.slice(0, 5) ?? '')
  const [anderUur, setAnderUur] = useState(false)
  const [type, setType] = useState(wedstrijd?.type ?? 'competitie')
  const [ronde, setRonde] = useState(wedstrijd?.beker_ronde ?? 'poule')
  const [locatie, setLocatie] = useState(wedstrijd?.location ?? '')
  const [locatieAangeraakt, setLocatieAangeraakt] = useState(isBewerk)
  const [thuisScore, setThuisScore] = useState(wedstrijd?.home_score ?? 0)
  const [uitScore, setUitScore] = useState(wedstrijd?.away_score ?? 0)

  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [toast, setToast] = useState(null) // { tekst, id }
  const [aantalToegevoegd, setAantalToegevoegd] = useState(0)
  // Na het kiezen van de thuisploeg meteen de uitploeg openen
  const [uitSignaal, setUitSignaal] = useState(0)

  const seizoenId = seizoen?.id
  useEffect(() => {
    let levend = true
    Promise.all([
      supabase.from('teams').select('id, name, is_zvk').order('name'),
      seizoenId
        ? supabase.from('matches').select('id, date, time, location, home_team_id, away_team_id').eq('season_id', seizoenId)
        : Promise.resolve({ data: [] }),
    ]).then(([{ data: t }, { data: w }]) => {
      if (!levend) return
      setTeams(t ?? [])
      setSeizoenWedstrijden(w ?? [])
      setLaden(false)
    })
    return () => { levend = false }
  }, [seizoenId])

  // Escape sluit, en de pagina eronder scrollt niet mee
  useEffect(() => {
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toets = e => { if (e.key === 'Escape') onSluiten() }
    window.addEventListener('keydown', toets)
    return () => { document.body.style.overflow = vorige; window.removeEventListener('keydown', toets) }
  }, [onSluiten])

  const zvk = teams.find(t => t.is_zvk)
  const thuis = teams.find(t => t.id === thuisId)
  const uit = teams.find(t => t.id === uitId)
  const isZvkMatch = !!(thuis?.is_zvk || uit?.is_zvk)

  // Thuiszaal invullen zolang de admin zelf niets typte
  const locatieWaarde = locatieAangeraakt ? locatie : (thuis?.is_zvk ? THUISZAAL : '')

  // De uren die dit seizoen het meest voorkomen, aangevuld met de standaard
  const uren = useMemo(() => {
    const telling = {}
    for (const w of seizoenWedstrijden) if (w.time) telling[w.time.slice(0, 5)] = (telling[w.time.slice(0, 5)] ?? 0) + 1
    const populair = Object.keys(telling).sort((a, b) => telling[b] - telling[a]).slice(0, 3)
    return [...new Set([...populair, ...STANDAARD_UREN])].slice(0, 4).sort()
  }, [seizoenWedstrijden])

  const locaties = useMemo(
    () => [...new Set(seizoenWedstrijden.map(w => w.location).filter(Boolean))],
    [seizoenWedstrijden],
  )

  const dagen = komendeZondagen()
  const gespeeld = datum && datum <= vandaagISO()

  // Speelt een van beide ploegen die dag al?
  const botsing = datum && seizoenWedstrijden.find(w =>
    w.id !== wedstrijd?.id && w.date === datum &&
    [w.home_team_id, w.away_team_id].some(id => id && (id === thuisId || id === uitId)))
  // Ploegen die op de gekozen dag al ingepland zijn (behalve deze wedstrijd)
  const bezet = new Set(datum ? seizoenWedstrijden
    .filter(w => w.date === datum && w.id !== wedstrijd?.id)
    .flatMap(w => [w.home_team_id, w.away_team_id]) : [])

  const botsingPloeg = botsing && teams.find(t => [botsing.home_team_id, botsing.away_team_id].includes(t.id) && (t.id === thuisId || t.id === uitId))

  async function nieuwePloeg(naam) {
    const { data, error } = await supabase.from('teams').insert({ name: naam.trim(), is_zvk: false }).select('id, name, is_zvk').single()
    if (error) { setFout('Ploeg aanmaken mislukt: ' + error.message); return null }
    setTeams(t => [...t, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  function wissel() {
    setThuisId(uitId)
    setUitId(thuisId)
    setThuisScore(uitScore)
    setUitScore(thuisScore)
  }

  async function opslaan(nogEen) {
    if (!thuisId || !uitId) { setFout('Kies beide ploegen.'); return }
    if (thuisId === uitId) { setFout('Een ploeg kan niet tegen zichzelf spelen.'); return }
    if (!datum) { setFout('Kies een datum.'); return }
    setFout(''); setBezig(true)

    const velden = {
      date: datum,
      time: uur || null,
      type,
      beker_ronde: type === 'beker' ? ronde : null,
      location: locatieWaarde.trim() || null,
      home_team_id: thuisId,
      away_team_id: uitId,
    }
    // De score van een ZVK-match komt uit het wedstrijdblad, die raken we hier niet aan
    if (!isZvkMatch) {
      velden.home_score = gespeeld ? thuisScore : 0
      velden.away_score = gespeeld ? uitScore : 0
    }

    let resultaat
    if (isBewerk) {
      resultaat = await supabase.from('matches').update(velden).eq('id', wedstrijd.id)
    } else {
      resultaat = await supabase.from('matches')
        .insert({ season_id: seizoen.id, home_score: 0, away_score: 0, ...velden })
        .select('id, date, time, location, home_team_id, away_team_id')
        .single()
    }
    setBezig(false)
    if (resultaat.error) { setFout('Opslaan mislukt: ' + resultaat.error.message); return }

    onOpgeslagen?.()
    if (!nogEen) { onSluiten(); return }

    // Klaar voor de volgende match van dezelfde speeldag
    setSeizoenWedstrijden(w => [...w, resultaat.data])
    setAantalToegevoegd(n => n + 1)
    setToast({ tekst: `${thuis.name} – ${uit.name} toegevoegd`, id: resultaat.data.id })
    setThuisId(''); setUitId(''); setThuisScore(0); setUitScore(0); setUitSignaal(0)
    setLocatie(''); setLocatieAangeraakt(false)
  }

  async function ongedaanMaken() {
    if (!toast) return
    const id = toast.id
    setToast(null)
    await supabase.from('matches').delete().eq('id', id)
    setSeizoenWedstrijden(w => w.filter(x => x.id !== id))
    setAantalToegevoegd(n => Math.max(0, n - 1))
    onOpgeslagen?.()
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <div className="z-sheet-achter" onClick={onSluiten} />
      <div className="z-paneel" role="dialog" aria-label={isBewerk ? 'Wedstrijd bewerken' : 'Wedstrijd toevoegen'}>
        <div className="z-paneel-kop">
          <h2>{isBewerk ? 'Wedstrijd bewerken' : 'Wedstrijd toevoegen'}</h2>
          {aantalToegevoegd > 0 && (
            <span className="z-chip z-chip-winst">{aantalToegevoegd} toegevoegd</span>
          )}
          <button type="button" className="z-knop z-knop-stil" onClick={onSluiten} aria-label="Sluiten" style={{ width: '36px', padding: 0 }}>
            <Icoon naam="sluit" grootte={18} dikte={2} />
          </button>
        </div>

        <div className="z-paneel-inhoud">
          {laden ? (
            <div className="z-skelet" style={{ height: '200px', borderRadius: 'var(--z-r)' }} />
          ) : (
            <>
              {/* Ploegen */}
              <section>
                <span className="z-veldlabel">Ploegen</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <PloegKiezer
                    key={`thuis-${aantalToegevoegd}`}
                    label="Thuis"
                    waarde={thuisId}
                    teams={teams}
                    uitsluiten={uitId}
                    zvk={zvk}
                    onKies={id => { setThuisId(id); if (!uitId) setUitSignaal(n => n + 1) }}
                    onNieuw={nieuwePloeg}
                    bezet={bezet}
                    autoOpen={!isBewerk}
                  />
                  {thuisId && uitId && (
                    <button
                      type="button"
                      onClick={wissel}
                      className="z-knop z-knop-klein"
                      style={{ alignSelf: 'center', margin: '-4px 0' }}
                    >
                      <Icoon naam="wissel" grootte={14} dikte={2} />
                      Thuis en uit wisselen
                    </button>
                  )}
                  <PloegKiezer
                    key={`uit-${aantalToegevoegd}-${uitSignaal}`}
                    label="Uit"
                    waarde={uitId}
                    teams={teams}
                    uitsluiten={thuisId}
                    zvk={zvk}
                    onKies={setUitId}
                    onNieuw={nieuwePloeg}
                    bezet={bezet}
                    autoOpen={uitSignaal > 0}
                  />
                </div>
              </section>

              {/* Datum */}
              <section>
                <span className="z-veldlabel">Zondag</span>
                <div className="z-keuzes">
                  {dagen.map(d => (
                    <button key={d} type="button" className="z-keuze" aria-pressed={datum === d} onClick={() => setDatum(d)}>
                      {kortLabel(d)}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={datum}
                  onChange={e => setDatum(e.target.value)}
                  style={{ marginTop: '8px', width: '100%' }}
                  aria-label="Andere datum, bijvoorbeeld voor een uitgestelde wedstrijd"
                  title="Andere datum, bijvoorbeeld voor een uitgestelde wedstrijd"
                />
                {datum && (
                  <p style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginTop: '6px' }}>
                    {langLabel(datum)}
                    {new Date(`${datum}T00:00:00`).getDay() !== 0 && (
                      <span style={{ color: 'var(--z-gelijk)', fontWeight: 600 }}> · geen zondag</span>
                    )}
                  </p>
                )}
              </section>

              {/* Uur */}
              <section>
                <span className="z-veldlabel">Aftrap</span>
                <div className="z-keuzes">
                  {uren.map(u => (
                    <button key={u} type="button" className="z-keuze" aria-pressed={!anderUur && uur === u}
                      onClick={() => { setUur(u); setAnderUur(false) }}>
                      {u}
                    </button>
                  ))}
                  <button type="button" className="z-keuze" aria-pressed={anderUur || (!!uur && !uren.includes(uur))}
                    onClick={() => setAnderUur(true)}>
                    Ander uur
                  </button>
                  <button type="button" className="z-keuze" aria-pressed={!uur && !anderUur}
                    onClick={() => { setUur(''); setAnderUur(false) }}>
                    Nog niet bekend
                  </button>
                </div>
                {(anderUur || (!!uur && !uren.includes(uur))) && (
                  <input type="time" value={uur} onChange={e => setUur(e.target.value)} style={{ marginTop: '8px', width: '140px' }} autoFocus />
                )}
                {!uur && (
                  <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '6px' }}>
                    Zonder uur sluit de pronostiek om 19:00.
                  </p>
                )}
              </section>

              {/* Type en locatie */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span className="z-veldlabel">Soort</span>
                  <Segment vol waarde={type} onChange={setType} opties={TYPES} />
                </div>
                {type === 'beker' && (
                  <div>
                    <span className="z-veldlabel">Ronde</span>
                    <Segment vol waarde={ronde} onChange={setRonde} opties={BEKER_RONDES} />
                  </div>
                )}
                <div>
                  <label className="z-veldlabel" htmlFor="wf-locatie">Locatie</label>
                  <input
                    id="wf-locatie"
                    list="wf-locaties"
                    value={locatieWaarde}
                    onChange={e => { setLocatie(e.target.value); setLocatieAangeraakt(true) }}
                    placeholder={isZvkMatch ? THUISZAAL : 'Optioneel'}
                    style={{ width: '100%' }}
                  />
                  <datalist id="wf-locaties">
                    {locaties.map(l => <option key={l} value={l} />)}
                  </datalist>
                </div>
              </section>

              {/* Score: enkel als de wedstrijd al gespeeld is */}
              {gespeeld && thuis && uit && (
                isZvkMatch ? (
                  <Melding>
                    Deze datum ligt in het verleden. De score, doelpunten en spelers vul je in via het wedstrijdblad.
                  </Melding>
                ) : (
                  <section>
                    <span className="z-veldlabel">Uitslag</span>
                    <div className="z-kaart" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <ScoreRij naam={thuis.name} waarde={thuisScore} onChange={setThuisScore} />
                      <ScoreRij naam={uit.name} waarde={uitScore} onChange={setUitScore} />
                    </div>
                  </section>
                )
              )}

              {botsing && botsingPloeg && (
                <Melding toon="let">
                  {botsingPloeg.name} speelt op {langLabel(datum).toLowerCase()} al een andere wedstrijd. Klopt dat?
                </Melding>
              )}

              {fout && <Melding toon="fout">{fout}</Melding>}
            </>
          )}
        </div>

        <div className="z-paneel-voet">
          {!isBewerk && (
            <button type="button" className="z-knop" disabled={bezig || laden} onClick={() => opslaan(true)} style={{ flex: 1, height: '44px' }}>
              Opslaan en nog één
            </button>
          )}
          <button type="button" className="z-knop z-knop-primair" disabled={bezig || laden} onClick={() => opslaan(false)} style={{ flex: 1, height: '44px' }}>
            {bezig ? 'Opslaan…' : isBewerk ? 'Wijzigingen opslaan' : 'Opslaan'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="z-toast" role="status">
          <Icoon naam="vink" grootte={16} dikte={2.4} style={{ color: '#86efac', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.tekst}</span>
          <button type="button" onClick={ongedaanMaken} style={{
            flexShrink: 0, border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', fontWeight: 600,
          }}>
            Ongedaan maken
          </button>
        </div>
      )}
    </>
  )
}

// ─── Ploeg kiezen, met zoeken en ter plekke een nieuwe ploeg aanmaken ─────────

function PloegKiezer({ label, waarde, teams, uitsluiten, zvk, onKies, onNieuw, bezet, autoOpen = false }) {
  const [open, setOpen] = useState(autoOpen && !waarde)
  const [zoek, setZoek] = useState('')
  const [bezig, setBezig] = useState(false)
  const zoekRef = useRef(null)
  const gekozen = teams.find(t => t.id === waarde)

  useEffect(() => { if (open) zoekRef.current?.focus() }, [open])

  const term = zoek.trim().toLowerCase()
  const lijst = teams
    .filter(t => t.id !== uitsluiten)
    .filter(t => !term || t.name.toLowerCase().includes(term))
    .sort((a, b) =>
      Number(bezet?.has(a.id)) - Number(bezet?.has(b.id)) ||
      Number(b.is_zvk) - Number(a.is_zvk) ||
      a.name.localeCompare(b.name))
  const bestaatExact = teams.some(t => t.name.toLowerCase() === term)

  function kies(id) {
    onKies(id)
    setZoek('')
    setOpen(false)
  }

  async function maakAan() {
    setBezig(true)
    const team = await onNieuw(zoek)
    setBezig(false)
    if (team) kies(team.id)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="z-kaart"
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minHeight: '52px',
          padding: '8px 14px', cursor: 'pointer', textAlign: 'left', font: 'inherit',
          ...(gekozen?.is_zvk && { borderColor: 'var(--z-blauw-200)', background: 'var(--z-blauw-50)' }),
        }}
      >
        <span style={{ width: '34px', fontSize: '12px', fontWeight: 600, color: 'var(--z-tekst-4)', flexShrink: 0 }}>{label}</span>
        <span style={{
          flex: 1, minWidth: 0, fontSize: '15px', fontWeight: gekozen ? 600 : 400,
          color: gekozen ? (gekozen.is_zvk ? 'var(--z-blauw)' : 'var(--z-tekst)') : 'var(--z-tekst-4)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {gekozen?.name ?? `Kies ${label.toLowerCase()}ploeg`}
        </span>
        <Icoon naam="chevronOmlaag" grootte={16} dikte={2} style={{ color: 'var(--z-tekst-4)', flexShrink: 0 }} />
      </button>
    )
  }

  return (
    <div className="z-kaart" style={{ overflow: 'hidden', borderColor: 'var(--z-blauw-200)', boxShadow: '0 0 0 3px var(--z-blauw-50)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px 8px 14px', borderBottom: '1px solid var(--z-lijn-zacht)' }}>
        <span style={{ width: '34px', fontSize: '12px', fontWeight: 600, color: 'var(--z-tekst-4)', flexShrink: 0 }}>{label}</span>
        <input
          ref={zoekRef}
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); if (lijst[0]) kies(lijst[0].id); else if (term) maakAan() }
            if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
          }}
          placeholder="Zoek of typ een nieuwe ploeg"
          style={{ flex: 1, minWidth: 0, height: '36px', border: 'none', boxShadow: 'none', padding: 0, fontSize: '16px' }}
        />
        {gekozen && (
          <button type="button" className="z-knop z-knop-stil z-knop-klein" onClick={() => setOpen(false)}>Klaar</button>
        )}
      </div>
      <div className="z-lijst" style={{ maxHeight: '232px', overflowY: 'auto' }}>
        {lijst.map(t => (
          <button
            key={t.id}
            type="button"
            className="z-rij-klik"
            onClick={() => kies(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '44px',
              padding: '0 14px', border: 'none', background: t.id === waarde ? 'var(--z-blauw-50)' : 'transparent',
              font: 'inherit', fontSize: '15px', textAlign: 'left', cursor: 'pointer',
              color: t.is_zvk ? 'var(--z-blauw)' : 'var(--z-tekst)', fontWeight: t.is_zvk ? 600 : 400,
            }}
          >
            <span style={{ flex: 1, opacity: bezet?.has(t.id) ? 0.5 : 1 }}>{t.name}</span>
            {bezet?.has(t.id) && <span className="z-chip">speelt al</span>}
            {t.id === zvk?.id && <span className="z-chip z-chip-blauw">Wij</span>}
            {t.id === waarde && <Icoon naam="vink" grootte={16} dikte={2.4} />}
          </button>
        ))}
        {term && !bestaatExact && (
          <button
            type="button"
            className="z-rij-klik"
            onClick={maakAan}
            disabled={bezig}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '44px',
              padding: '0 14px', border: 'none', background: 'transparent', font: 'inherit',
              fontSize: '15px', textAlign: 'left', cursor: 'pointer', color: 'var(--z-blauw)', fontWeight: 600,
            }}
          >
            <Icoon naam="plus" grootte={16} dikte={2.2} />
            {bezig ? 'Aanmaken…' : `Nieuwe ploeg "${zoek.trim()}"`}
          </button>
        )}
        {!term && lijst.length === 0 && (
          <div style={{ padding: '14px', fontSize: '13px', color: 'var(--z-tekst-4)' }}>Typ de naam van een ploeg.</div>
        )}
      </div>
    </div>
  )
}

export function ScoreRij({ naam, waarde, onChange }) {
  const knop = {
    width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--z-lijn)',
    background: 'var(--z-kaart)', cursor: 'pointer', fontSize: '18px', color: 'var(--z-tekst-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 500, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{naam}</span>
      <button type="button" style={knop} onClick={() => onChange(Math.max(0, waarde - 1))} aria-label={`Doelpunt minder voor ${naam}`}>−</button>
      <span className="z-tab-nums" style={{ width: '28px', textAlign: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--z-tekst)' }}>{waarde}</span>
      <button type="button" style={knop} onClick={() => onChange(waarde + 1)} aria-label={`Doelpunt meer voor ${naam}`}>+</button>
    </div>
  )
}

const MELDING = {
  info: { background: 'var(--z-vlak)', borderColor: 'var(--z-lijn)', color: 'var(--z-tekst-2)' },
  let: { background: 'var(--z-gelijk-bg)', borderColor: 'var(--z-gelijk-rand)', color: 'var(--z-gelijk)' },
  fout: { background: 'var(--z-verlies-bg)', borderColor: 'var(--z-verlies-rand)', color: 'var(--z-verlies)' },
}

function Melding({ toon = 'info', children }) {
  return (
    <div style={{ border: '1px solid', borderRadius: 'var(--z-r-s)', padding: '10px 14px', fontSize: '13px', lineHeight: 1.5, ...MELDING[toon] }}>
      {children}
    </div>
  )
}
