import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { isGespeeld } from '../lib/wedstrijd'
import { knockoutRondes, naPenaltys, pouleStanden, winnaar, zvkStatus } from '../lib/beker'
import { Chip, Icoon, Laden, LegeStaat } from '../ui'

// De beker op het scherm Stand: status van ZVK, de poules met hun stand en
// de knock-outfase tot de finale. Op desktop staat de knock-out als schema van
// links naar rechts, in de app onder elkaar. Rekenregels: src/lib/beker.js.
// Stijlen: .z-beker-* in ui/ui.css.

export default function BekerOverzicht({ variant = 'pwa' }) {
  const { actief: seizoen } = useSeason()
  const [data, setData] = useState(null)

  const seizoenId = seizoen?.id
  useEffect(() => {
    if (!seizoenId) return
    let actief = true
    Promise.all([
      supabase.from('teams').select('id, name, is_zvk'),
      supabase.from('beker_poules').select('*').eq('season_id', seizoenId),
      supabase.from('beker_poule_ploegen').select('poule_id, team_id').eq('season_id', seizoenId),
      supabase.from('matches')
        .select('*, home_team:home_team_id(id, name, is_zvk), away_team:away_team_id(id, name, is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoenId)
        .eq('type', 'beker'),
    ]).then(([t, p, i, w]) => {
      if (!actief) return
      setData({ teams: t.data ?? [], poules: p.data ?? [], indeling: i.data ?? [], wedstrijden: w.data ?? [] })
    })
    return () => { actief = false }
  }, [seizoenId])

  if (!data) return <Laden regels={5} />

  const standen = pouleStanden(data.poules, data.indeling, data.teams, data.wedstrijden)
  const rondes = knockoutRondes(data.wedstrijden)
  if (standen.length === 0 && rondes.length === 0) {
    return <LegeStaat icoon="beker" titel="Nog geen beker" tekst="Zodra de poules ingedeeld zijn, verschijnt de beker hier." />
  }

  const zvkId = data.teams.find(t => t.is_zvk)?.id
  const status = zvkStatus(standen, rondes, zvkId)
  const finale = rondes.find(r => r.id === 'finale')?.matchen[0]
  const voorFinale = rondes.filter(r => r.id !== 'finale')
  const volgende = [...data.wedstrijden]
    .filter(w => (w.home_team_id === zvkId || w.away_team_id === zvkId) && !isGespeeld(w))
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div className="z-beker">
      <div className="z-kaart z-beker-status">
        <span className="z-beker-trofee"><Icoon naam="beker" grootte={22} dikte={2} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--z-tekst)' }}>Beker {seizoen?.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--z-tekst-3)', marginTop: '2px' }}>
            {volgende
              ? `Volgende: ${volgende.home_team?.name} – ${volgende.away_team?.name}, ${new Date(`${volgende.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}`
              : rondes.length ? 'Knock-outfase' : 'Poulefase'}
          </div>
        </div>
        {status && <Chip toon={status.toon}>{status.tekst}</Chip>}
      </div>

      {standen.length > 0 && (
        <section>
          <h2 className="z-beker-kop">Poulefase</h2>
          <div className="z-beker-poules">
            {standen.map(p => <PouleTabel key={p.id} poule={p} />)}
          </div>
          <div className="z-beker-legende"><i /> Plaats in de knock-outfase</div>
        </section>
      )}

      {rondes.length > 0 && (
        <section>
          <h2 className="z-beker-kop">Knock-outfase</h2>
          <div className={`z-beker-schema${variant === 'desktop' ? ' z-beker-schema-breed' : ''}`}>
            {voorFinale.map(r => (
              <div key={r.id} className="z-beker-ronde">
                <div className="z-beker-rondenaam">{r.label}</div>
                <div className="z-beker-matchen">
                  {r.matchen.map(w => <Duel key={w.id} w={w} variant={variant} />)}
                </div>
              </div>
            ))}
            {finale && <Finale w={finale} variant={variant} />}
          </div>
        </section>
      )}
    </div>
  )
}

function PouleTabel({ poule: p }) {
  return (
    <div className="z-kaart z-beker-poule">
      <div className="z-beker-poulenaam">Poule {p.naam}</div>
      <div className="z-beker-rij z-beker-rij-kop"><span>#</span><span>Ploeg</span><span>M</span><span>+/−</span><span>Ptn</span></div>
      {p.stand.map((t, i) => (
        <div key={t.id} className={`z-beker-rij${i < p.doorgaan ? ' door' : ''}${t.is_zvk ? ' zvk' : ''}`}>
          <span>{i + 1}</span>
          <span className="naam">{t.name}</span>
          <span>{t.gespeeld}</span>
          <span>{t.saldo > 0 ? `+${t.saldo}` : t.saldo < 0 ? `−${-t.saldo}` : '0'}</span>
          <strong>{t.punten}</strong>
        </div>
      ))}
    </div>
  )
}

function Duel({ w, variant }) {
  const navigate = useNavigate()
  const gespeeld = isGespeeld(w)
  const w8 = winnaar(w)
  const regel = (team, score, pen) => (
    <div className={`z-beker-team${w8 === team?.id ? ' win' : w8 ? ' uit' : ''}${team?.is_zvk ? ' zvk' : ''}`}>
      <span className="naam">{team?.name}</span>
      <span className="score">{gespeeld ? score : ''}{naPenaltys(w) && <sup>{pen}</sup>}</span>
    </div>
  )
  return (
    <button type="button" className="z-kaart z-beker-duel" onClick={() => navigate(`${variant === 'pwa' ? '/app' : ''}/wedstrijd/${w.id}`)}>
      {regel(w.home_team, w.home_score, w.home_pen)}
      {regel(w.away_team, w.away_score, w.away_pen)}
      {!gespeeld && (
        <div className="z-beker-wanneer">
          {new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
          {w.time ? ` · ${w.time.slice(0, 5)}` : ''}
        </div>
      )}
      {naPenaltys(w) && <div className="z-beker-wanneer">na strafschoppen ({w.home_pen}-{w.away_pen})</div>}
    </button>
  )
}

function Finale({ w, variant }) {
  const navigate = useNavigate()
  const gespeeld = isGespeeld(w)
  const w8 = winnaar(w)
  const kampioen = w8 && (w8 === w.home_team_id ? w.home_team : w.away_team)
  const ploeg = (team, score) => (
    <div className={`z-beker-finaleploeg${w8 && w8 !== team?.id ? ' uit' : ''}${team?.is_zvk ? ' zvk' : ''}`}>
      <span className="z-beker-letter">{team?.name?.charAt(0)}</span>
      <span className="naam">{team?.name}</span>
      {gespeeld && <span className="score">{score}</span>}
    </div>
  )
  return (
    <div className="z-beker-ronde z-beker-finaleronde">
      <div className="z-beker-rondenaam">Finale</div>
      <button type="button" className="z-kaart z-beker-finale" onClick={() => navigate(`${variant === 'pwa' ? '/app' : ''}/wedstrijd/${w.id}`)}>
        <div className="z-beker-wanneer" style={{ padding: '10px 14px 0' }}>
          <Icoon naam="kalender" grootte={13} />
          {new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          {w.time ? ` · ${w.time.slice(0, 5)}` : ''}
        </div>
        <div className="z-beker-finaleploegen">
          {ploeg(w.home_team, w.home_score)}
          <span className="vs">{gespeeld ? '–' : 'vs'}</span>
          {ploeg(w.away_team, w.away_score)}
        </div>
        {naPenaltys(w) && <div className="z-beker-wanneer" style={{ justifyContent: 'center', paddingBottom: '8px' }}>na strafschoppen ({w.home_pen}-{w.away_pen})</div>}
        <div className="z-beker-winnaar">
          <Icoon naam="beker" grootte={15} dikte={2.2} />
          {kampioen ? `${kampioen.name} wint de beker!` : 'Wie pakt de beker?'}
        </div>
      </button>
    </div>
  )
}
