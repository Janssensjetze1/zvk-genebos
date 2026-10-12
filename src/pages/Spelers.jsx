import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import SpelerDetail from '../components/SpelerDetail'
import { useTopscorer } from '../context/TopscorerContext'
import EerKronen from '../components/EerKronen'
import { VLAK_KLASSE } from '../lib/eer'
import { Icoon, Kaart, LegeStaat, PaginaKop } from '../ui'

export default function Spelers() {
  const { actief: seizoen } = useSeason()
  const { eer } = useTopscorer()
  const [spelers, setSpelers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')
  const [geselecteerdeSpeler, setGeselecteerdeSpeler] = useState(null)

  useEffect(() => { fetchSpelers() }, [])
  useEffect(() => { if (spelers.length > 0 && seizoen) fetchStats() }, [spelers, seizoen])

  async function fetchSpelers() {
    const { data: sData } = await supabase.from('players').select('*').order('name')
    setSpelers(sData ?? [])
    setLoading(false)
  }

  async function fetchStats() {
    const { data: goals } = await supabase
      .from('goals')
      .select('scorer_id, assist_id, matches!inner(season_id)')
      .eq('matches.season_id', seizoen.id)

    const { data: matchPlayers } = await supabase
      .from('match_players')
      .select('player_id, matches!inner(season_id)')
      .eq('matches.season_id', seizoen.id)

    const berekend = {}
    spelers.forEach(s => { berekend[s.id] = { goals: 0, assists: 0, matches: 0 } })
    goals?.forEach(g => {
      if (berekend[g.scorer_id]) berekend[g.scorer_id].goals++
      if (g.assist_id && berekend[g.assist_id]) berekend[g.assist_id].assists++
    })
    matchPlayers?.forEach(mp => {
      if (berekend[mp.player_id]) berekend[mp.player_id].matches++
    })
    setStats(berekend)
  }

  const gefilterd = spelers.filter(s =>
    s.name.toLowerCase().includes(zoek.toLowerCase())
  )

  // Sorteer op doelpunten desc
  const gesorteerd = [...gefilterd].sort((a, b) => {
    const sa = stats[a.id] ?? { goals: 0 }
    const sb = stats[b.id] ?? { goals: 0 }
    return sb.goals - sa.goals
  })

  return (
    <div>
      <PaginaKop
        bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
        titel="Spelers"
        ondertitel={`${spelers.length} spelers in de selectie · gesorteerd op doelpunten`}
      >
        <div style={{ position: 'relative', width: '260px' }}>
          <Icoon naam="zoek" grootte={16} dikte={2} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--z-tekst-4)',
          }} />
          <input
            type="text"
            placeholder="Zoek speler"
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>
      </PaginaKop>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="z-skelet" style={{ height: '250px', borderRadius: 'var(--z-r)' }} />)}
        </div>
      ) : gesorteerd.length === 0 ? (
        <LegeStaat tekst={zoek ? `Geen speler gevonden voor "${zoek}".` : 'Nog geen spelers.'} icoon="spelers" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: '16px',
        }}>
          {gesorteerd.map(speler => (
            <SpelerKaart
              key={speler.id}
              speler={speler}
              stats={stats[speler.id] ?? { goals: 0, assists: 0, matches: 0 }}
              eretitel={eer(speler.id)}
              onClick={() => setGeselecteerdeSpeler(speler)}
            />
          ))}
        </div>
      )}

      {geselecteerdeSpeler && (
        <SpelerDetail
          speler={geselecteerdeSpeler}
          seizoenId={seizoen?.id}
          onClose={() => setGeselecteerdeSpeler(null)}
          variant="modal"
        />
      )}
    </div>
  )
}

const EER_LABEL = { topscorer: 'Topscorer', assistkoning: 'Assistenkoning', beide: 'Topscorer & assists' }

function SpelerKaart({ speler, stats, eretitel, onClick }) {
  return (
    <Kaart onClick={onClick} style={{ overflow: 'hidden' }}>
      <div
        className={eretitel ? VLAK_KLASSE[eretitel] : undefined}
        style={{
          position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden',
          background: 'linear-gradient(160deg, var(--z-blauw-100), var(--z-blauw-50))',
        }}
      >
        {speler.photo_url ? (
          <img src={speler.photo_url} alt={speler.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '56px', fontWeight: 700, color: 'var(--z-blauw-200)' }}>
              {speler.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {eretitel && (
          <span style={{
            position: 'absolute', left: '10px', bottom: '10px',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            height: '22px', padding: '0 8px', borderRadius: '99px',
            background: 'rgba(12,26,61,0.78)', backdropFilter: 'blur(6px)',
            color: 'white', fontSize: '11px', fontWeight: 600,
          }}>
            <EerKronen eer={eretitel} grootte={11} /> {EER_LABEL[eretitel]}
          </span>
        )}
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{
          fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {speler.name}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '12px' }}>
          <StatPil waarde={stats.goals} label="Goals" />
          <StatPil waarde={stats.assists} label="Assists" />
          <StatPil waarde={stats.matches} label="Matchen" />
        </div>
      </div>
    </Kaart>
  )
}

function StatPil({ waarde, label }) {
  return (
    <div>
      <div className="z-tab-nums" style={{ fontSize: '17px', fontWeight: 700, color: waarde ? 'var(--z-tekst)' : 'var(--z-tekst-4)' }}>{waarde}</div>
      <div style={{ fontSize: '12px', color: 'var(--z-tekst-3)' }}>{label}</div>
    </div>
  )
}
