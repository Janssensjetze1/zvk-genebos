import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useSeason } from '../../../context/SeasonContext'
import { isGespeeld } from '../../../lib/wedstrijd'
import {
  RONDE_LABEL, knockoutRondes, naPenaltys, pouleStanden, voorstelEersteRonde, voorstelVolgendeRonde, winnaar,
} from '../../../lib/beker'
import WedstrijdFormulier from '../../../components/WedstrijdFormulier'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Knop, Kaart, TabKop, Melding, LegeStaat } from '../ui'
import { inputStijl } from '../stijlen'

// De beker in het beheer: poules indelen, de knock-out inplannen (met een
// voorstel voor de koppels) en strafschoppen invullen bij een gelijkspel.
// De rekenregels staan in src/lib/beker.js.

const LETTERS = 'ABCDEFGH'

export default function TabBeker() {
  const { actief: seizoen } = useSeason()
  const [teams, setTeams] = useState([])
  const [poules, setPoules] = useState([])
  const [indeling, setIndeling] = useState([])
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [formulier, setFormulier] = useState(null)
  const [teVerwijderen, setTeVerwijderen] = useState(null)
  const [fout, setFout] = useState('')

  const seizoenId = seizoen?.id
  useEffect(() => { if (seizoenId) laden() }, [seizoenId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function laden() {
    const [t, p, i, w] = await Promise.all([
      supabase.from('teams').select('id, name, is_zvk').order('name'),
      supabase.from('beker_poules').select('*').eq('season_id', seizoenId),
      supabase.from('beker_poule_ploegen').select('poule_id, team_id').eq('season_id', seizoenId),
      supabase.from('matches')
        .select('*, home_team:home_team_id(id, name, is_zvk), away_team:away_team_id(id, name, is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoenId)
        .eq('type', 'beker'),
    ])
    setTeams(t.data ?? [])
    setPoules(p.data ?? [])
    setIndeling(i.data ?? [])
    setWedstrijden(w.data ?? [])
    setLoading(false)
  }

  async function voerUit(belofte) {
    setFout('')
    const { error } = await belofte
    if (error) setFout('Dat lukte niet: ' + error.message)
    await laden()
  }

  const nieuwePoule = () => {
    const bezet = new Set(poules.map(p => p.naam))
    const naam = [...LETTERS].find(l => !bezet.has(l)) ?? String(poules.length + 1)
    voerUit(supabase.from('beker_poules').insert({ season_id: seizoenId, naam, volgorde: poules.length }))
  }

  if (!seizoen) return <LegeStaat emoji="📅" titel="Geen seizoen" tekst="Maak eerst een seizoen aan." />
  if (loading) return <p style={{ fontSize: '14px', color: 'var(--z-tekst-4)' }}>Laden...</p>

  const standen = pouleStanden(poules, indeling, teams, wedstrijden)
  const rondes = knockoutRondes(wedstrijden)
  const ingedeeld = new Set(indeling.map(i => i.team_id))
  const vrij = teams.filter(t => !ingedeeld.has(t.id))
  const naam = id => teams.find(t => t.id === id)?.name ?? '?'

  const eerste = rondes.length === 0 ? voorstelEersteRonde(standen) : null
  const volgende = voorstelVolgendeRonde(rondes)
  const allesGespeeld = standen.length > 0 && standen.every(p => p.klaar)

  function plan(ronde, thuis, uit) {
    setFormulier({ type: 'beker', beker_ronde: ronde, home_team_id: thuis, away_team_id: uit })
  }

  return (
    <div>
      <TabKop titel="Beker" subtitel={`Seizoen ${seizoen.name} · poules en knock-out`}>
        <Knop soort="vol" onClick={nieuwePoule}>+ Poule</Knop>
      </TabKop>

      {fout && <Melding soort="fout" style={{ marginBottom: '12px' }}>{fout}</Melding>}

      {/* Poules */}
      {standen.length === 0 ? (
        <LegeStaat emoji="🏆" titel="Nog geen poules" tekst="Maak een poule aan en deel de ploegen in." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {standen.map(p => (
            <Kaart key={p.id} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <strong style={{ flex: 1, fontSize: '15px', color: 'var(--z-tekst)' }}>Poule {p.naam}</strong>
                <label style={{ fontSize: '12px', color: 'var(--z-tekst-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Gaan door
                  <input
                    type="number" min="0" max="16" value={p.doorgaan}
                    onChange={e => voerUit(supabase.from('beker_poules').update({ doorgaan: Math.max(0, Math.min(16, Number(e.target.value) || 0)) }).eq('id', p.id))}
                    style={{ ...inputStijl, width: '56px', padding: '5px 8px' }}
                  />
                </label>
                <Knop soort="stil" klein onClick={() => setTeVerwijderen(p)} aria-label={`Poule ${p.naam} verwijderen`} title="Poule verwijderen">✕</Knop>
              </div>

              {p.stand.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', margin: '0 0 10px' }}>Nog geen ploegen.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  {p.stand.map((t, i) => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                      padding: '6px 8px', borderRadius: 'var(--z-r-s)', background: 'var(--z-vlak)',
                      boxShadow: i < p.doorgaan ? 'inset 3px 0 0 var(--z-winst)' : undefined,
                    }}>
                      <span style={{ width: '16px', color: 'var(--z-tekst-4)', fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ flex: 1, color: t.is_zvk ? 'var(--z-blauw)' : 'var(--z-tekst)', fontWeight: t.is_zvk ? 700 : 500 }}>{t.name}</span>
                      <span style={{ color: 'var(--z-tekst-3)' }}>{t.gespeeld} m · {t.punten} ptn</span>
                      <button
                        type="button"
                        onClick={() => voerUit(supabase.from('beker_poule_ploegen').delete().eq('poule_id', p.id).eq('team_id', t.id))}
                        aria-label={`${t.name} uit poule ${p.naam} halen`}
                        style={{ border: 'none', background: 'none', color: 'var(--z-tekst-4)', cursor: 'pointer', padding: '0 2px' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {vrij.length > 0 && (
                <select
                  value=""
                  onChange={e => e.target.value && voerUit(supabase.from('beker_poule_ploegen').insert({ poule_id: p.id, team_id: e.target.value }))}
                  style={{ ...inputStijl, padding: '7px 10px' }}
                  aria-label={`Ploeg toevoegen aan poule ${p.naam}`}
                >
                  <option value="">+ Ploeg toevoegen</option>
                  {vrij.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </Kaart>
          ))}
        </div>
      )}

      {/* Voorstel voor de volgende ronde */}
      {(eerste || volgende) && (
        <Kaart style={{ padding: '14px 16px', marginTop: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--z-tekst)', marginBottom: '4px' }}>
            Voorstel: {RONDE_LABEL[(eerste ?? volgende).ronde].toLowerCase()}
          </div>
          {eerste && !allesGespeeld && (
            <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', margin: '0 0 8px' }}>
              Op basis van de huidige stand; niet alle poulewedstrijden zijn al gespeeld.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {eerste?.koppels.map(([x, y]) => (
              <Koppel
                key={x.label + y.label}
                links={`${x.label} · ${x.team?.name ?? '?'}`}
                rechts={`${y.label} · ${y.team?.name ?? '?'}`}
                kan={!!(x.team && y.team)}
                onPlan={() => plan(eerste.ronde, x.team.id, y.team.id)}
              />
            ))}
            {volgende?.koppels.map(([x, y]) => (
              <Koppel key={x + y} links={naam(x)} rechts={naam(y)} kan onPlan={() => plan(volgende.ronde, x, y)} />
            ))}
          </div>
        </Kaart>
      )}

      {/* Knock-outwedstrijden */}
      {rondes.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {rondes.map(r => (
            <div key={r.id}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--z-tekst-3)', marginBottom: '6px' }}>{r.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {r.matchen.map(w => <KnockoutRij key={w.id} w={w} onBewerk={() => setFormulier(w)} onOpgeslagen={laden} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {formulier && (
        <WedstrijdFormulier wedstrijd={formulier} onSluiten={() => setFormulier(null)} onOpgeslagen={laden} />
      )}

      {teVerwijderen && (
        <ConfirmDialog
          bericht={`Poule ${teVerwijderen.naam} verwijderen? De ploegen worden uit de poule gehaald, de wedstrijden blijven bestaan.`}
          bevestigLabel="Verwijderen"
          gevaar
          onBevestig={() => { const p = teVerwijderen; setTeVerwijderen(null); voerUit(supabase.from('beker_poules').delete().eq('id', p.id)) }}
          onAnnuleer={() => setTeVerwijderen(null)}
        />
      )}
    </div>
  )
}

function Koppel({ links, rechts, kan, onPlan }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', padding: '8px 10px', borderRadius: 'var(--z-r-s)', background: 'var(--z-vlak)' }}>
      <span style={{ flex: 1, color: 'var(--z-tekst)' }}>{links} <span style={{ color: 'var(--z-tekst-4)' }}>–</span> {rechts}</span>
      <Knop klein disabled={!kan} onClick={onPlan}>Inplannen</Knop>
    </div>
  )
}

// Eén knock-outwedstrijd, met strafschoppen bij een gelijkspel
function KnockoutRij({ w, onBewerk, onOpgeslagen }) {
  const gespeeld = isGespeeld(w)
  const gelijk = gespeeld && w.home_score === w.away_score
  const [thuisPen, setThuisPen] = useState(w.home_pen ?? '')
  const [uitPen, setUitPen] = useState(w.away_pen ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const w8 = winnaar(w)

  async function bewaarPens() {
    setFout('')
    const h = Number(thuisPen), a = Number(uitPen)
    if (thuisPen === '' || uitPen === '' || h === a) { setFout('Vul twee verschillende scores in.'); return }
    setBezig(true)
    const { error } = await supabase.from('matches').update({ home_pen: h, away_pen: a }).eq('id', w.id)
    setBezig(false)
    if (error) { setFout('Opslaan mislukt.'); return }
    onOpgeslagen()
  }

  const ploeg = (team, score) => (
    <span style={{ fontWeight: w8 === team?.id ? 700 : 500, color: w8 && w8 !== team?.id ? 'var(--z-tekst-4)' : team?.is_zvk ? 'var(--z-blauw)' : 'var(--z-tekst)' }}>
      {team?.name}{gespeeld && <span style={{ marginLeft: '6px' }}>{score}</span>}
    </span>
  )

  return (
    <Kaart style={{ padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '14px' }}>
        <span style={{ flex: 1, minWidth: '200px' }}>
          {ploeg(w.home_team, w.home_score)}
          <span style={{ color: 'var(--z-tekst-4)', margin: '0 8px' }}>–</span>
          {ploeg(w.away_team, w.away_score)}
          {naPenaltys(w) && <span style={{ fontSize: '12px', color: 'var(--z-tekst-3)', marginLeft: '8px' }}>(pen. {w.home_pen}-{w.away_pen})</span>}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>
          {new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
        </span>
        <Knop klein soort="stil" onClick={onBewerk}>Bewerken</Knop>
      </div>
      {gelijk && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--z-tekst-2)' }}>
          Strafschoppen:
          <input inputMode="numeric" value={thuisPen} onChange={e => setThuisPen(e.target.value.replace(/\D/g, ''))} aria-label={`Strafschoppen ${w.home_team?.name}`} style={{ ...inputStijl, width: '52px', padding: '5px 8px', textAlign: 'center' }} />
          –
          <input inputMode="numeric" value={uitPen} onChange={e => setUitPen(e.target.value.replace(/\D/g, ''))} aria-label={`Strafschoppen ${w.away_team?.name}`} style={{ ...inputStijl, width: '52px', padding: '5px 8px', textAlign: 'center' }} />
          <Knop klein soort="vol" disabled={bezig} onClick={bewaarPens}>Bewaren</Knop>
          {fout && <span style={{ color: 'var(--z-verlies)', fontSize: '12px' }}>{fout}</span>}
        </div>
      )}
    </Kaart>
  )
}
