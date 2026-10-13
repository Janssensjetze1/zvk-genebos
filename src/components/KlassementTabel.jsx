import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { berekenKlassement } from '../lib/klassement'
import PloegLogo from './PloegLogo'
import { Kaart, Laden, LegeStaat } from '../ui'

// De competitiestand, gedeeld door desktop en app.
// compact: klassieke, strakke tabel voor de app (één regel per ploeg)

const MEDAILLE = ['#d4a017', '#9aa5b5', '#b8733a']
const VORM_KLEUR = {
  W: { background: 'var(--z-winst)', color: 'white' },
  G: { background: 'var(--z-tekst-4)', color: 'white' },
  V: { background: 'var(--z-verlies)', color: 'white' },
}

function saldoTekst(n) {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'
}

function Vorm({ vorm }) {
  if (vorm.length === 0) return <span style={{ color: 'var(--z-tekst-4)', fontSize: '12px' }}>–</span>
  const maat = 20
  return (
    <span style={{ display: 'inline-flex', gap: '4px' }}>
      {vorm.map((u, i) => (
        <span key={i} title={{ W: 'Gewonnen', G: 'Gelijk', V: 'Verloren' }[u]} style={{
          width: maat, height: maat, borderRadius: '5px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, ...VORM_KLEUR[u],
          opacity: i === vorm.length - 1 ? 1 : 0.85,
        }}>{u}</span>
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
  if (compact) return <CompacteStand stand={stand} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Kaart style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="z-stand">
            <thead>
              <tr>
                <th className="z-stand-pos">#</th>
                <th className="links">Ploeg</th>
                <th title="Gespeeld">GS</th>
                <th title="Gewonnen">W</th>
                <th title="Gelijk">G</th>
                <th title="Verloren">V</th>
                <th title="Doelpunten voor en tegen">Doelp.</th>
                <th title="Doelsaldo">+/−</th>
                <th className="links">Vorm</th>
                <th className="z-stand-ptn" title="Punten">Ptn</th>
              </tr>
            </thead>
            <tbody>
              {stand.map((t, i) => (
                <tr key={t.id} className={t.is_zvk ? 'z-stand-wij' : undefined}>
                  <td className="z-stand-pos">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '50%',
                      fontSize: '13px', fontWeight: 700,
                      color: i < 3 && t.gespeeld > 0 ? 'white' : 'var(--z-tekst-3)',
                      background: i < 3 && t.gespeeld > 0 ? MEDAILLE[i] : 'transparent',
                    }}>{i + 1}</span>
                  </td>
                  <td className="links z-stand-ploeg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <PloegLogo team={t} grootte={28} />
                      <div style={{ minWidth: 0 }}>
                        <div className="z-stand-naam">{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.gespeeld}</td>
                  <td>{t.gewonnen}</td>
                  <td>{t.gelijk}</td>
                  <td>{t.verloren}</td>
                  <td style={{ color: 'var(--z-tekst-3)', whiteSpace: 'nowrap' }}>{t.voor}–{t.tegen}</td>
                  <td style={{ fontWeight: 600, color: t.saldo > 0 ? 'var(--z-winst)' : t.saldo < 0 ? 'var(--z-verlies)' : 'var(--z-tekst-4)' }}>
                    {saldoTekst(t.saldo)}
                  </td>
                  <td className="links z-stand-vorm"><Vorm vorm={t.vorm} /></td>
                  <td className="z-stand-ptn"><span>{t.punten}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kaart>

      <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', lineHeight: 1.5 }}>
        GS gespeeld · W gewonnen · G gelijk · V verloren · Vorm: de laatste vijf uitslagen, de meest recente rechts. Bij gelijke punten telt eerst het doelsaldo, dan het aantal gemaakte doelpunten.
      </p>
    </div>
  )
}

// Klassieke, strakke tabel voor de app: één regel per ploeg
function CompacteStand({ stand }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Kaart style={{ overflow: 'hidden' }}>
        <table className="z-mini">
          <thead>
            <tr>
              <th>#</th>
              <th className="links">Ploeg</th>
              <th title="Gespeeld">GS</th>
              <th title="Gewonnen">W</th>
              <th title="Gelijk">G</th>
              <th title="Verloren">V</th>
              <th title="Doelsaldo">+/−</th>
              <th title="Punten">Ptn</th>
            </tr>
          </thead>
          <tbody>
            {stand.map((t, i) => (
              <tr key={t.id} className={t.is_zvk ? 'z-mini-wij' : undefined}>
                <td style={{ fontWeight: 700, color: i < 3 && t.gespeeld > 0 ? MEDAILLE[i] : 'var(--z-tekst-4)' }}>{i + 1}</td>
                <td className="links z-mini-ploeg">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                    <PloegLogo team={t} grootte={18} />
                    <span className="z-mini-naam">{t.name}</span>
                  </span>
                </td>
                <td>{t.gespeeld}</td>
                <td>{t.gewonnen}</td>
                <td>{t.gelijk}</td>
                <td>{t.verloren}</td>
                <td style={{ color: t.saldo > 0 ? 'var(--z-winst)' : t.saldo < 0 ? 'var(--z-verlies)' : 'var(--z-tekst-4)' }}>
                  {saldoTekst(t.saldo)}
                </td>
                <td className="z-mini-ptn">{t.punten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kaart>
      <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', lineHeight: 1.5 }}>
        GS gespeeld · W gewonnen · G gelijk · V verloren · +/− doelsaldo
      </p>
    </div>
  )
}
