import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import SpelerDetail from '../components/SpelerDetail'
import SpelerAvatar from '../components/SpelerAvatar'
import { isGespeeld } from '../lib/wedstrijd'
import { AppPagina, Icoon, Kaart, Laden, LegeStaat } from '../ui'

export default function PWASpelers() {
  const { actief: seizoen } = useSeason()
  const [spelers, setSpelers] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoek, setZoek] = useState('')
  const [geselecteerdeSpeler, setGeselecteerdeSpeler] = useState(null)

  useEffect(() => { if (seizoen) fetchData() }, [seizoen])

  async function fetchData() {
    setLoading(true)
    const [{ data: sData }, { data: gData }] = await Promise.all([
      supabase.from('players').select('*').order('name'),
      supabase.from('goals').select('scorer_id, match:match_id(date, season_id)')
        .eq('match.season_id', seizoen.id),
    ])
    setSpelers(sData ?? [])
    setGoals((gData ?? []).filter(g => isGespeeld({ ...g.match, goals: [g] })))
    setLoading(false)
  }

  const doelpuntenMap = {}
  for (const g of goals) {
    if (g.scorer_id) doelpuntenMap[g.scorer_id] = (doelpuntenMap[g.scorer_id] || 0) + 1
  }

  const gefilterd = spelers
    .filter(s => s.name.toLowerCase().includes(zoek.toLowerCase()))
    .map(s => ({ ...s, goals: doelpuntenMap[s.id] || 0 }))
    .sort((a, b) => b.goals - a.goals)

  return (
    <AppPagina
      bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
      titel="Spelers"
      ondertitel={loading ? null : `${spelers.length} spelers · gesorteerd op doelpunten`}
    >
      <div style={{ position: 'relative' }}>
        <Icoon naam="zoek" grootte={17} dikte={2} style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--z-tekst-4)',
        }} />
        <input
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          placeholder="Zoek speler"
          style={{ width: '100%', height: '44px', paddingLeft: '42px', fontSize: '16px' }}
        />
      </div>

      {loading ? (
        <Laden regels={6} />
      ) : gefilterd.length === 0 ? (
        <LegeStaat tekst={zoek ? `Geen speler gevonden voor "${zoek}".` : 'Nog geen spelers.'} icoon="spelers" />
      ) : (
        <Kaart style={{ overflow: 'hidden' }}>
          <div className="z-lijst">
            {gefilterd.map((speler, i) => (
              <div
                key={speler.id}
                className="z-rij z-rij-klik"
                onClick={() => setGeselecteerdeSpeler(speler)}
                style={{ padding: '10px 16px', gap: '12px' }}
              >
                <span className="z-tab-nums" style={{ width: '20px', textAlign: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst-4)' }}>
                  {i + 1}
                </span>
                <SpelerAvatar speler={speler} size={40} letterGrootte={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {speler.name}
                  </div>
                  {speler.position && (
                    <div style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginTop: '1px' }}>{speler.position}</div>
                  )}
                </div>
                {speler.goals > 0 && (
                  <div className="z-tab-nums" style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--z-tekst)' }}>{speler.goals}</span>
                    <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginLeft: '4px' }}>{speler.goals === 1 ? 'goal' : 'goals'}</span>
                  </div>
                )}
                <Icoon naam="chevron" grootte={16} dikte={2} className="z-chevron" />
              </div>
            ))}
          </div>
        </Kaart>
      )}

      {geselecteerdeSpeler && (
        <SpelerDetail
          speler={geselecteerdeSpeler}
          seizoenId={seizoen?.id}
          onClose={() => setGeselecteerdeSpeler(null)}
          variant="sheet"
        />
      )}
    </AppPagina>
  )
}
