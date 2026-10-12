import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { berekenKlassement } from '../lib/klassement'
import PloegLogo from './PloegLogo'
import { Kaart, Laden, LegeStaat } from '../ui'

// De competitiestand, gedeeld door desktop en app.
// compact: smalle versie voor de app (minder kolommen, vorm onder de naam)

const MEDAILLE = ['#d4a017', '#9aa5b5', '#b8733a']
const VORM_KLEUR = {
  W: { background: 'var(--z-winst)', color: 'white' },
  G: { background: 'var(--z-tekst-4)', color: 'white' },
  V: { background: 'var(--z-verlies)', color: 'white' },
}

function saldoTekst(n) {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'
}

function Vorm({ vorm, klein }) {
  if (vorm.length === 0) return <span style={{ color: 'var(--z-tekst-4)', fontSize: '12px' }}>–</span>
  const maat = klein ? 14 : 20
  return (
    <span style={{ display: 'inline-flex', gap: klein ? '3px' : '4px' }}>
      {vorm.map((u, i) => (
        <span key={i} title={{ W: 'Gewonnen', G: 'Gelijk', V: 'Verloren' }[u]} style={{
          width: maat, height: maat, borderRadius: klein ? '4px' : '5px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: klein ? '9px' : '11px', fontWeight: 700, ...VORM_KLEUR[u],
          opacity: i === vorm.length - 1 ? 1 : 0.85,
        }}>{klein ? '' : u}</span>
      ))}
    </span>
  )
}

export default function KlassementTabel({ compact = false }) {
  const { actief: seizoen } = useSeason()
  const [teams, setTeams] = useState([])
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)

  const seizoenId = seizoen?.id
  useEffect(() => {
    if (!seizoenId) return
    let levend = true
    Promise.all([
      supabase.from('teams').select('id, name, is_zvk').order('name'),
      supabase.from('matches')
        .select('*, home_team:home_team_id(id, name, is_zvk), away_team:away_team_id(id, name, is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoenId),
    ]).then(([{ data: t }, { data: w }]) => {
      if (!levend) return
      setTeams(t ?? [])
      setWedstrijden(w ?? [])
      setLoading(false)
    })
    return () => { levend = false }
  }, [seizoenId])

  if (loading) return <Laden regels={8} />

  const stand = berekenKlassement(teams, wedstrijden)
  if (stand.length === 0) return <LegeStaat tekst="Nog geen ploegen in de competitie." icoon="klassement" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '16px' : '20px' }}>
      <Kaart style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className={`z-stand${compact ? ' z-stand-compact' : ''}`}>
            <thead>
              <tr>
                <th className="z-stand-pos">#</th>
                <th className="links">Ploeg</th>
                {!compact && <th title="Gespeeld">GS</th>}
                <th title="Gewonnen">W</th>
                <th title="Gelijk">G</th>
                <th title="Verloren">V</th>
                <th title="Doelpunten voor en tegen">{compact ? 'DV–DT' : 'Doelp.'}</th>
                {!compact && <th title="Doelsaldo">+/−</th>}
                {!compact && <th className="links">Vorm</th>}
                <th className="z-stand-ptn" title="Punten">Ptn</th>
              </tr>
            </thead>
            <tbody>
              {stand.map((t, i) => (
                <tr key={t.id} className={t.is_zvk ? 'z-stand-wij' : undefined}>
                  <td className="z-stand-pos">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: compact ? '24px' : '28px', height: compact ? '24px' : '28px', borderRadius: '50%',
                      fontSize: compact ? '12px' : '13px', fontWeight: 700,
                      color: i < 3 && t.gespeeld > 0 ? 'white' : 'var(--z-tekst-3)',
                      background: i < 3 && t.gespeeld > 0 ? MEDAILLE[i] : 'transparent',
                    }}>{i + 1}</span>
                  </td>
                  <td className="links z-stand-ploeg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <PloegLogo team={t} grootte={compact ? 24 : 28} />
                      <div style={{ minWidth: 0 }}>
                        <div className="z-stand-naam">{t.name}</div>
                        {compact && t.vorm.length > 0 && <div style={{ marginTop: '4px' }}><Vorm vorm={t.vorm} klein /></div>}
                      </div>
                    </div>
                  </td>
                  {!compact && <td>{t.gespeeld}</td>}
                  <td>{t.gewonnen}</td>
                  <td>{t.gelijk}</td>
                  <td>{t.verloren}</td>
                  <td style={{ color: 'var(--z-tekst-3)', whiteSpace: 'nowrap' }}>{t.voor}–{t.tegen}</td>
                  {!compact && (
                    <td style={{ fontWeight: 600, color: t.saldo > 0 ? 'var(--z-winst)' : t.saldo < 0 ? 'var(--z-verlies)' : 'var(--z-tekst-4)' }}>
                      {saldoTekst(t.saldo)}
                    </td>
                  )}
                  {!compact && <td className="links z-stand-vorm"><Vorm vorm={t.vorm} /></td>}
                  <td className="z-stand-ptn"><span>{t.punten}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kaart>

      <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', lineHeight: 1.5 }}>
        {compact
          ? 'W gewonnen · G gelijk · V verloren · DV–DT doelpunten voor en tegen · Blokjes: de laatste vijf uitslagen, de meest recente rechts.'
          : 'GS gespeeld · W gewonnen · G gelijk · V verloren · Vorm: de laatste vijf uitslagen, de meest recente rechts. Bij gelijke punten telt eerst het doelsaldo, dan het aantal gemaakte doelpunten.'}
      </p>
    </div>
  )
}
