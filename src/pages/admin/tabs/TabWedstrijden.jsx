import { useEffect, useMemo, useRef, useState } from 'react'
import { useConfirm } from '../../../components/ConfirmDialog'
import { supabase } from '../../../lib/supabase'
import { useSeason } from '../../../context/SeasonContext'
import { opgaveNatuurlijkOpen, opgaveOpentOp } from '../../../hooks/useOpgave'
import { useVerslag } from '../../../hooks/useVerslag'
import { heeftResultaat, isGespeeld, perWeekend } from '../../../lib/wedstrijd'
import VerslagPaneel from '../../../components/VerslagPaneel'
import WedstrijdFormulier, { ScoreRij } from '../../../components/WedstrijdFormulier'
import ScoreInvullen from '../../../components/ScoreInvullen'
import PloegLogo from '../../../components/PloegLogo'
import { Chip, Icoon, Knop, LegeStaat, Laden, Segment, TypeChip, UitslagLetter, hoofdletter } from '../../../ui'

// Beheer van alle wedstrijden van het seizoen, van ZVK en van de andere
// ploegen, in één lijst per speelweek. Bovenaan staat wat nog moet gebeuren
// (wedstrijdblad, uitslag, aftrapuur), zodat je niet hoeft te zoeken. Elke
// regel heeft één duidelijke actie; de rest zit in het menu (⋯).

const OPGAVE_KLEUR = { mee: 'var(--z-winst)', niet: 'var(--z-verlies)', kijken: 'var(--z-tekst-4)' }
const OPGAVE_TITEL = { mee: 'Gaf zich op: doet mee', niet: 'Gaf zich op: doet niet mee', kijken: 'Gaf zich op: komt kijken' }

const isZvk = w => !!(w.home_team?.is_zvk || w.away_team?.is_zvk)

// Wat moet er nog gebeuren met deze wedstrijd? null = niets
function teDoen(w) {
  const gespeeld = isGespeeld(w)
  if (isZvk(w)) {
    if (gespeeld && !(w.match_players?.length > 0 || w.goals?.length > 0)) return 'Wedstrijdblad invullen'
  } else if (gespeeld && !heeftResultaat(w)) {
    return 'Uitslag invullen'
  }
  if (!gespeeld && !w.time) return 'Aftrapuur ontbreekt'
  return null
}

export default function TabWedstrijden() {
  const { bevestig, ConfirmUI } = useConfirm()
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null) // null = nog kiezen na het laden
  const [zoek, setZoek] = useState('')
  // Vensters: formulier { wedstrijd? }, wedstrijdblad, uitslag van andere ploegen
  const [formulier, setFormulier] = useState(null)
  const [blad, setBlad] = useState(null)
  const [score, setScore] = useState(null)

  useEffect(() => { fetchAlles() }, [seizoen]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAlles() {
    const [{ data: wData }, { data: sData }] = await Promise.all([
      seizoen
        ? supabase.from('matches').select(`
            *,
            home_team:home_team_id(id, name, is_zvk),
            away_team:away_team_id(id, name, is_zvk),
            match_players(player_id),
            goals(id, scorer_id, assist_id, minute, scorer:scorer_id(name), assist:assist_id(name)),
            report
          `).eq('season_id', seizoen.id).order('date', { ascending: false })
        : { data: [] },
      supabase.from('players').select('*').order('name'),
    ])
    setWedstrijden(wData ?? [])
    setSpelers(sData ?? [])
    setLoading(false)
  }

  async function verwijder(w) {
    const naam = `${w.home_team?.name ?? '?'} – ${w.away_team?.name ?? '?'}`
    if (!await bevestig(`${naam} verwijderen? Doelpunten en spelers van deze wedstrijd verdwijnen mee.`, { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    await supabase.from('matches').delete().eq('id', w.id)
    fetchAlles()
  }

  const todo = useMemo(() => wedstrijden.filter(teDoen), [wedstrijden])
  const actieveFilter = filter ?? (todo.length > 0 ? 'todo' : 'aankomend')

  const groepen = useMemo(() => {
    const term = zoek.trim().toLowerCase()
    const lijst = wedstrijden.filter(w => {
      if (term && !`${w.home_team?.name} ${w.away_team?.name} ${w.location ?? ''}`.toLowerCase().includes(term)) return false
      if (actieveFilter === 'todo') return !!teDoen(w)
      if (actieveFilter === 'aankomend') return !isGespeeld(w)
      if (actieveFilter === 'gespeeld') return isGespeeld(w)
      return true
    })
    return perWeekend(lijst, { nieuwsteEerst: actieveFilter !== 'aankomend' })
  }, [wedstrijden, zoek, actieveFilter])

  if (!seizoen) return <LegeStaat titel="Geen seizoen" tekst="Maak eerst een seizoen aan via Beheer → Seizoenen." icoon="kalender" />
  if (loading) return <Laden regels={6} />

  const aantalAankomend = wedstrijden.filter(w => !isGespeeld(w)).length
  const opties = [
    { waarde: 'todo', label: <>Te doen{todo.length > 0 && <span className="z-teller">{todo.length}</span>}</> },
    { waarde: 'aankomend', label: <>Aankomend<span className="z-teller z-teller-stil">{aantalAankomend}</span></> },
    { waarde: 'gespeeld', label: 'Gespeeld' },
    { waarde: 'alles', label: 'Alles' },
  ]

  return (
    <>
      {ConfirmUI}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Segment opties={opties} waarde={actieveFilter} onChange={setFilter} />
        <div className="z-zoekveld">
          <Icoon naam="zoek" grootte={16} dikte={2} />
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een ploeg" aria-label="Zoek een ploeg" />
        </div>
        <Knop icoon="plus" soort="primair" onClick={() => setFormulier({})} style={{ marginLeft: 'auto' }}>
          Wedstrijd toevoegen
        </Knop>
      </div>

      {groepen.length === 0 ? (
        actieveFilter === 'todo' && !zoek ? (
          <LegeStaat icoon="vink" titel="Alles is bij" tekst="Elk wedstrijdblad en elke uitslag is ingevuld." />
        ) : (
          <LegeStaat titel="Geen wedstrijden" tekst={zoek ? `Niets gevonden voor "${zoek}".` : 'Voeg een wedstrijd toe met de knop hierboven.'} />
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {groepen.map(g => (
            <section key={g.sleutel}>
              <div className="z-sectiekop" style={{ marginBottom: '8px' }}>
                <h2 className="z-titel" style={{ fontSize: '14px' }}>{g.titel}</h2>
                <span className="z-sectiekop-meta">{g.lijst.length} wedstrijd{g.lijst.length === 1 ? '' : 'en'}</span>
              </div>
              <div className="z-kaart z-lijst" style={{ overflow: 'visible' }}>
                {g.lijst.map(w => isZvk(w) ? (
                  <ZvkRij
                    key={w.id}
                    wedstrijd={w}
                    spelers={spelers}
                    onBewerken={() => setFormulier({ wedstrijd: w })}
                    onBlad={() => setBlad(w)}
                    onVerwijderen={() => verwijder(w)}
                  />
                ) : (
                  <AndereRij
                    key={w.id}
                    wedstrijd={w}
                    onBewerken={() => setFormulier({ wedstrijd: w })}
                    onScore={() => setScore(w)}
                    onVerwijderen={() => verwijder(w)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {formulier && (
        <WedstrijdFormulier wedstrijd={formulier.wedstrijd} onSluiten={() => setFormulier(null)} onOpgeslagen={fetchAlles} />
      )}
      {blad && (
        <Wedstrijdblad
          wedstrijd={blad}
          spelers={spelers}
          onSluiten={() => setBlad(null)}
          onOpgeslagen={() => { setBlad(null); fetchAlles() }}
        />
      )}
      {score && <ScoreInvullen wedstrijd={score} onSluiten={() => setScore(null)} onOpgeslagen={fetchAlles} />}
    </>
  )
}

// ─── Gedeelde bouwstenen van een regel ───────────────────────────────────────

function DatumBlok({ datum }) {
  const d = new Date(`${datum}T00:00:00`)
  return (
    <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--z-tekst-4)', textTransform: 'uppercase' }}>
        {d.toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '')}
      </div>
      <div className="z-tab-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--z-tekst)', lineHeight: 1.1 }}>{d.getDate()}</div>
      <div style={{ fontSize: '11px', color: 'var(--z-tekst-4)' }}>
        {d.toLocaleDateString('nl-BE', { month: 'short' }).replace('.', '')}
      </div>
    </div>
  )
}

function Ploegen({ wedstrijd: w, metScore }) {
  const rij = (team, score) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
      <PloegLogo team={team} grootte={20} />
      <span style={{
        flex: 1, minWidth: 0, fontSize: '14px',
        fontWeight: team?.is_zvk ? 700 : 500,
        color: team?.is_zvk ? 'var(--z-blauw)' : 'var(--z-tekst)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{team?.name ?? '?'}</span>
      {metScore && (
        <span className="z-tab-nums" style={{ width: '22px', textAlign: 'right', fontSize: '15px', fontWeight: 700, color: 'var(--z-tekst)' }}>{score}</span>
      )}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
      {rij(w.home_team, w.home_score)}
      {rij(w.away_team, w.away_score)}
    </div>
  )
}

function Meta({ wedstrijd: w }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--z-tekst-4)' }}>
      {w.type !== 'competitie' && <TypeChip type={w.type} />}
      {w.time
        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icoon naam="klok" grootte={13} /> {w.time.slice(0, 5)}</span>
        : !isGespeeld(w) && <Chip toon="gelijk">Geen aftrapuur</Chip>}
      {w.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icoon naam="locatie" grootte={13} /> {w.location}</span>}
    </div>
  )
}

// Menu met de minder gebruikte acties
function Menu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const dicht = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const toets = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', dicht)
    window.addEventListener('keydown', toets)
    return () => { document.removeEventListener('mousedown', dicht); window.removeEventListener('keydown', toets) }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button type="button" className="z-knop z-knop-stil z-knop-klein" aria-label="Meer acties" aria-expanded={open}
        onClick={() => setOpen(o => !o)} style={{ width: '32px', padding: 0 }}>
        <Icoon naam="meer" grootte={18} dikte={3} />
      </button>
      {open && (
        <div className="z-menu" role="menu">
          {items.filter(Boolean).map(it => (
            <button key={it.label} type="button" role="menuitem" className={it.gevaar ? 'z-menu-gevaar' : ''}
              disabled={it.disabled} onClick={() => { setOpen(false); it.actie() }}>
              <Icoon naam={it.icoon} grootte={16} />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ZVK-wedstrijd ───────────────────────────────────────────────────────────

function ZvkRij({ wedstrijd: w, spelers, onBewerken, onBlad, onVerwijderen }) {
  const [open, setOpen] = useState(false)
  const verslagState = useVerslag(w)
  const gespeeld = isGespeeld(w)
  const bladIngevuld = w.match_players?.length > 0 || w.goals?.length > 0
  const isThuis = w.home_team?.is_zvk
  const wij = isThuis ? w.home_score : w.away_score
  const zij = isThuis ? w.away_score : w.home_score
  const uitslag = wij > zij ? 'W' : wij < zij ? 'V' : 'G'

  // Opgave: gaat standaard woensdag van de matchweek open, admin kan vervroegen
  const [opgaveVervroegd, setOpgaveVervroegd] = useState(w.availability_opens_at ?? null)
  const [opgaveBezig, setOpgaveBezig] = useState(false)
  const natuurlijkOpen = opgaveNatuurlijkOpen(w)
  const opentOp = opgaveOpentOp({ date: w.date })?.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  async function wisselOpgave() {
    setOpgaveBezig(true)
    const nieuw = opgaveVervroegd ? null : new Date().toISOString()
    setOpgaveVervroegd(nieuw)
    await supabase.from('matches').update({ availability_opens_at: nieuw }).eq('id', w.id)
    setOpgaveBezig(false)
  }

  function genereerVerslag() {
    setOpen(true)
    verslagState.genereer()
  }

  let actie
  if (gespeeld && !bladIngevuld) {
    actie = <Knop soort="primair" klein icoon="invullen" onClick={onBlad}>Wedstrijdblad invullen</Knop>
  } else if (gespeeld) {
    actie = (
      <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', whiteSpace: 'nowrap' }}>
        {w.match_players?.length ?? 0} spelers · {w.goals?.length ?? 0} goals
        {verslagState.verslag && ' · verslag'}
      </span>
    )
  } else if (natuurlijkOpen) {
    actie = <Chip toon="winst" style={{ height: '28px', padding: '0 10px' }}><Icoon naam="vink" grootte={13} dikte={2.4} /> Opgave open</Chip>
  } else {
    actie = (
      <Knop klein icoon={opgaveVervroegd ? 'vink' : 'slot'} disabled={opgaveBezig} onClick={wisselOpgave}
        title={opgaveVervroegd ? `Terug naar de vaste regel: opent dan op ${opentOp}` : `Gaat vanzelf open op ${opentOp}`}
        className={opgaveVervroegd ? 'z-knop-winst' : ''}>
        {opgaveVervroegd ? 'Opgave vervroegd open' : 'Opgave nu openen'}
      </Knop>
    )
  }

  return (
    <div>
      <div className="z-beheer-rij z-rij-klik" onClick={() => (gespeeld ? setOpen(o => !o) : onBewerken())}>
        <DatumBlok datum={w.date} />
        <div className="z-beheer-info">
          <Ploegen wedstrijd={w} metScore={gespeeld && heeftResultaat(w)} />
          <Meta wedstrijd={w} />
        </div>
        <div className="z-beheer-acties" onClick={e => e.stopPropagation()}>
          {gespeeld && bladIngevuld && <UitslagLetter uitslag={uitslag} />}
          {actie}
          <Menu items={[
            { label: bladIngevuld ? 'Wedstrijdblad aanpassen' : 'Wedstrijdblad invullen', icoon: 'invullen', actie: onBlad },
            { label: 'Datum of ploegen wijzigen', icoon: 'kalender', actie: onBewerken },
            gespeeld && { label: verslagState.verslag ? 'Verslag opnieuw genereren' : 'Verslag genereren', icoon: 'vonk', actie: genereerVerslag, disabled: verslagState.genereert },
            !gespeeld && !natuurlijkOpen && { label: opgaveVervroegd ? 'Opgave terug dicht' : 'Opgave nu openen', icoon: 'slot', actie: wisselOpgave },
            { label: 'Verwijderen', icoon: 'prullenbak', actie: onVerwijderen, gevaar: true },
          ]} />
        </div>
        <Icoon naam="chevronOmlaag" grootte={16} className="z-chevron" style={{
          visibility: gespeeld ? 'visible' : 'hidden',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
        }} />
      </div>

      {open && gespeeld && (
        <div style={{ background: 'var(--z-vlak)', borderTop: '1px solid var(--z-lijn-zacht)' }}>
          <div style={{ padding: '16px 20px 16px 74px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div className="z-veldlabel">Doelpunten</div>
              {w.goals?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {w.goals.map(g => (
                    <div key={g.id} style={{ fontSize: '13px', color: 'var(--z-tekst-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icoon naam="bal" grootte={14} style={{ color: 'var(--z-tekst-4)' }} />
                      <span style={{ fontWeight: 600 }}>{g.scorer?.name}</span>
                      {g.assist && <span style={{ color: 'var(--z-tekst-4)' }}>assist {g.assist.name}</span>}
                      {g.minute && <span style={{ color: 'var(--z-tekst-4)', marginLeft: 'auto' }}>{g.minute}'</span>}
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)' }}>Geen doelpunten ingevuld.</p>}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div className="z-veldlabel">Speelden mee</div>
              {w.match_players?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {w.match_players.map(mp => {
                    const s = spelers.find(x => x.id === mp.player_id)
                    return s ? <Chip key={mp.player_id}>{s.name}</Chip> : null
                  })}
                </div>
              ) : <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)' }}>Nog niet ingevuld.</p>}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--z-lijn-zacht)' }}>
            <VerslagPaneel verslagState={verslagState} variant="admin" toonGenereren={false} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Wedstrijd van twee andere ploegen ───────────────────────────────────────

function AndereRij({ wedstrijd: w, onBewerken, onScore, onVerwijderen }) {
  const gespeeld = isGespeeld(w)
  const metUitslag = gespeeld && heeftResultaat(w)

  return (
    <div className="z-beheer-rij z-rij-klik" onClick={gespeeld ? onScore : onBewerken}>
      <DatumBlok datum={w.date} />
      <div className="z-beheer-info">
        <Ploegen wedstrijd={w} metScore={metUitslag} />
        <Meta wedstrijd={w} />
      </div>
      <div className="z-beheer-acties" onClick={e => e.stopPropagation()}>
        {gespeeld && !metUitslag && <Knop soort="primair" klein icoon="invullen" onClick={onScore}>Uitslag invullen</Knop>}
        <Menu items={[
          gespeeld && { label: metUitslag ? 'Uitslag aanpassen' : 'Uitslag invullen', icoon: 'invullen', actie: onScore },
          { label: 'Datum of ploegen wijzigen', icoon: 'kalender', actie: onBewerken },
          { label: 'Verwijderen', icoon: 'prullenbak', actie: onVerwijderen, gevaar: true },
        ]} />
      </div>
      <span style={{ width: '16px', flexShrink: 0 }} />
    </div>
  )
}

// ─── Wedstrijdblad: uitslag, spelers en doelpunten op één blad ──────────────

function Wedstrijdblad({ wedstrijd: w, spelers, onSluiten, onOpgeslagen }) {
  const isThuis = w.home_team?.is_zvk
  const wij = isThuis ? w.home_team : w.away_team
  const tegenstander = isThuis ? w.away_team : w.home_team

  const [thuisScore, setThuisScore] = useState(w.home_score ?? 0)
  const [uitScore, setUitScore] = useState(w.away_score ?? 0)
  const [aanwezig, setAanwezig] = useState(new Set(w.match_players.map(mp => mp.player_id)))
  const [doelpunten, setDoelpunten] = useState(
    w.goals.map(g => ({ scorerId: g.scorer_id, assistId: g.assist_id ?? '', minuut: g.minute ?? '' }))
  )
  const [opgaves, setOpgaves] = useState([])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  const zvkScore = isThuis ? thuisScore : uitScore

  useEffect(() => {
    let levend = true
    supabase.from('match_availability').select('player_id, status').eq('match_id', w.id).then(({ data }) => {
      if (!levend) return
      const rijen = data ?? []
      setOpgaves(rijen)
      // Voorvullen met de opgave, zolang er nog niemand geregistreerd is
      if (w.match_players.length === 0) {
        const mee = rijen.filter(o => o.status === 'mee' && o.player_id).map(o => o.player_id)
        if (mee.length > 0) setAanwezig(new Set(mee))
      }
    })
    return () => { levend = false }
  }, [w.id, w.match_players.length])

  useEffect(() => {
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toets = e => { if (e.key === 'Escape') onSluiten() }
    window.addEventListener('keydown', toets)
    return () => { document.body.style.overflow = vorige; window.removeEventListener('keydown', toets) }
  }, [onSluiten])

  // Kijkers zonder spelersfiche hebben geen player_id, die horen hier niet
  const opgaveMap = Object.fromEntries(opgaves.filter(o => o.player_id).map(o => [o.player_id, o.status]))
  const meeIds = opgaves.filter(o => o.status === 'mee' && o.player_id).map(o => o.player_id)
  const aanwezigen = spelers.filter(s => aanwezig.has(s.id))
  const kiesbaar = aanwezigen.length > 0 ? aanwezigen : spelers
  const naam = id => spelers.find(s => s.id === id)?.name ?? '?'

  function wisselSpeler(id) {
    setAanwezig(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function zetDoelpunt(idx, veld, waarde) {
    setDoelpunten(prev => prev.map((d, i) => i === idx ? { ...d, [veld]: waarde } : d))
  }

  async function opslaan() {
    setFout(''); setBezig(true)
    const { error } = await supabase.from('matches').update({ home_score: thuisScore, away_score: uitScore }).eq('id', w.id)
    if (error) { setFout('Opslaan mislukt: ' + error.message); setBezig(false); return }

    await supabase.from('match_players').delete().eq('match_id', w.id)
    if (aanwezig.size > 0) {
      await supabase.from('match_players').insert([...aanwezig].map(pid => ({ match_id: w.id, player_id: pid })))
    }

    await supabase.from('goals').delete().eq('match_id', w.id)
    const geldig = doelpunten.filter(d => d.scorerId)
    if (geldig.length > 0) {
      await supabase.from('goals').insert(geldig.map(d => ({
        match_id: w.id,
        scorer_id: d.scorerId,
        assist_id: d.assistId || null,
        minute: d.minuut ? parseInt(d.minuut) : null,
      })))
    }
    setBezig(false)
    onOpgeslagen()
  }

  const datum = hoofdletter(new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))
  const verschil = zvkScore - doelpunten.length

  return (
    <>
      <div className="z-sheet-achter" onClick={onSluiten} />
      <div className="z-paneel z-paneel-breed" role="dialog" aria-label="Wedstrijdblad">
        <div className="z-paneel-kop">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>Wedstrijdblad</h2>
            <div style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginTop: '2px' }}>
              {wij?.name} tegen {tegenstander?.name} · {datum} · {isThuis ? 'thuis' : 'uit'}
            </div>
          </div>
          <button type="button" className="z-knop z-knop-stil" onClick={onSluiten} aria-label="Sluiten" style={{ width: '36px', padding: 0 }}>
            <Icoon naam="sluit" grootte={18} dikte={2} />
          </button>
        </div>

        <div className="z-paneel-inhoud">
          {/* 1. Uitslag */}
          <section>
            <span className="z-veldlabel">Uitslag</span>
            <div className="z-kaart" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ScoreRij naam={w.home_team?.name} waarde={thuisScore} onChange={setThuisScore} />
              <ScoreRij naam={w.away_team?.name} waarde={uitScore} onChange={setUitScore} />
            </div>
          </section>

          {/* 2. Spelers */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span className="z-veldlabel" style={{ margin: 0 }}>Wie speelde mee?</span>
              <span style={{ fontSize: '13px', color: 'var(--z-tekst-4)' }}>{aanwezig.size} geselecteerd</span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                {meeIds.length > 0 && (
                  <Knop klein soort="stil" onClick={() => setAanwezig(new Set(meeIds))}>Opgave overnemen ({meeIds.length})</Knop>
                )}
                {aanwezig.size > 0 && <Knop klein soort="stil" onClick={() => setAanwezig(new Set())}>Wissen</Knop>}
              </span>
            </div>
            <div className="z-keuzes">
              {spelers.map(s => {
                const status = opgaveMap[s.id]
                return (
                  <button key={s.id} type="button" className="z-keuze" aria-pressed={aanwezig.has(s.id)} onClick={() => wisselSpeler(s.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {status && (
                      <span title={OPGAVE_TITEL[status]} style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: OPGAVE_KLEUR[status],
                        boxShadow: aanwezig.has(s.id) ? '0 0 0 1.5px white' : 'none',
                      }} />
                    )}
                    {s.name}
                  </button>
                )
              })}
            </div>
            {opgaves.length > 0 && (
              <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '12px', color: 'var(--z-tekst-4)' }}>
                {Object.entries(OPGAVE_KLEUR).map(([k, kleur]) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: kleur }} />
                    {k === 'mee' ? 'gaf zich op' : k === 'niet' ? 'meldde zich af' : 'komt kijken'}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 3. Doelpunten */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span className="z-veldlabel" style={{ margin: 0 }}>Doelpunten van {wij?.name ?? 'ZVK'}</span>
              <span style={{ fontSize: '13px', color: verschil === 0 ? 'var(--z-winst)' : 'var(--z-tekst-4)' }}>
                {doelpunten.length} van {zvkScore}
              </span>
            </div>

            {doelpunten.length > 0 && (
              <div className="z-kaart z-lijst" style={{ marginBottom: '12px' }}>
                {doelpunten.map((d, idx) => (
                  <div key={idx} className="z-doelpunt">
                    <span className="z-tab-nums" style={{ width: '18px', fontSize: '13px', fontWeight: 700, color: 'var(--z-tekst-4)' }}>{idx + 1}</span>
                    <select value={d.scorerId} onChange={e => zetDoelpunt(idx, 'scorerId', e.target.value)} aria-label="Doelpuntenmaker" style={{ flex: 2 }}>
                      <option value="">Kies de scorer</option>
                      {d.scorerId && !kiesbaar.some(s => s.id === d.scorerId) && <option value={d.scorerId}>{naam(d.scorerId)}</option>}
                      {kiesbaar.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <Icoon naam="assist" grootte={14} style={{ color: 'var(--z-tekst-4)', flexShrink: 0 }} />
                    <select value={d.assistId} onChange={e => zetDoelpunt(idx, 'assistId', e.target.value)} aria-label="Assist" style={{ flex: 2 }}>
                      <option value="">Geen assist</option>
                      {d.assistId && !kiesbaar.some(s => s.id === d.assistId) && <option value={d.assistId}>{naam(d.assistId)}</option>}
                      {kiesbaar.filter(s => s.id !== d.scorerId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="number" min="1" max="60" inputMode="numeric" value={d.minuut} placeholder="min"
                      onChange={e => zetDoelpunt(idx, 'minuut', e.target.value)} aria-label="Minuut"
                      style={{ width: '64px', flex: 'none', textAlign: 'center' }} />
                    <button type="button" className="z-knop z-knop-stil z-knop-klein" aria-label="Doelpunt verwijderen"
                      onClick={() => setDoelpunten(prev => prev.filter((_, i) => i !== idx))} style={{ width: '32px', padding: 0, color: 'var(--z-tekst-4)' }}>
                      <Icoon naam="sluit" grootte={16} dikte={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '12px', color: 'var(--z-tekst-3)', marginBottom: '8px' }}>
              {doelpunten.length === 0 ? 'Tik op wie scoorde, één keer per doelpunt.' : 'Nog een doelpunt? Tik op de scorer.'}
            </div>
            <div className="z-keuzes">
              {kiesbaar.map(s => (
                <button key={s.id} type="button" className="z-keuze" onClick={() => setDoelpunten(prev => [...prev, { scorerId: s.id, assistId: '', minuut: '' }])}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Icoon naam="plus" grootte={13} dikte={2.2} /> {s.name}
                </button>
              ))}
            </div>

            {verschil > 0 && doelpunten.length > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--z-gelijk)', marginTop: '10px' }}>
                Nog {verschil} doelpunt{verschil === 1 ? '' : 'en'} zonder scorer.
              </p>
            )}
            {verschil < 0 && (
              <p style={{ fontSize: '13px', color: 'var(--z-verlies)', marginTop: '10px' }}>
                Er staan meer doelpunten dan de score van {wij?.name ?? 'ZVK'} ({zvkScore}). Klopt de uitslag?
              </p>
            )}
          </section>

          {fout && <p style={{ fontSize: '13px', color: 'var(--z-verlies)' }}>{fout}</p>}
        </div>

        <div className="z-paneel-voet">
          <button type="button" className="z-knop" onClick={onSluiten} style={{ flex: 1, height: '44px' }}>Annuleren</button>
          <button type="button" className="z-knop z-knop-primair" disabled={bezig} onClick={opslaan} style={{ flex: 2, height: '44px' }}>
            {bezig ? 'Opslaan…' : 'Wedstrijdblad opslaan'}
          </button>
        </div>
      </div>
    </>
  )
}
