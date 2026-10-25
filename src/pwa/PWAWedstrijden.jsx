import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'
import Opgave from '../components/Opgave'
import { opgaveIsOpen } from '../hooks/useOpgave'
import { isGespeeld } from '../lib/wedstrijd'
import { WedstrijdenPerWeekend } from '../components/WedstrijdenPerDag'
import VolgendeWedstrijdKaart from '../components/VolgendeWedstrijdKaart'
import Reacties from '../components/Reacties'
import WedstrijdFormulier from '../components/WedstrijdFormulier'
import PWAOverzicht from './PWAOverzicht'
import { AppPagina, Knop, Laden, LegeStaat } from '../ui'

const TABS = [['overzicht', 'Overzicht'], ['aankomend', 'Aankomend'], ['gespeeld', 'Gespeeld']]
const isZvk = w => !!(w.home_team?.is_zvk || w.away_team?.is_zvk)

export default function PWAWedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [formulierOpen, setFormulierOpen] = useState(false)
  const { isAdmin } = useAuth()
  // De tab zit in de URL, zodat je na een detailpagina terugkomt waar je was.
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'overzicht'
  const setTab = id => setParams(id === 'overzicht' ? {} : { tab: id }, { replace: true })

  useEffect(() => { if (seizoen) fetchWedstrijden() }, [seizoen])

  // Ook verversen als er via het Meer-menu een wedstrijd bijkwam
  useEffect(() => {
    const ververs = () => { if (seizoen) fetchWedstrijden() }
    window.addEventListener('zvk:wedstrijden-gewijzigd', ververs)
    return () => window.removeEventListener('zvk:wedstrijden-gewijzigd', ververs)
  }, [seizoen])

  async function fetchWedstrijden() {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id,name,is_zvk),
        away_team:away_team_id(id,name,is_zvk),
        goals(id,scorer_id,assist_id,scorer:scorer_id(name,photo_url),assist:assist_id(name,photo_url)),
        match_players(player_id, player:player_id(name))
      `)
      .eq('season_id', seizoen.id)
      .order('date', { ascending: true })
    setWedstrijden(data ?? [])
    setLoading(false)
  }

  // Aankomend: onze eerstvolgende match groot bovenaan, daaronder het hele
  // programma van de competitie per weekend, onze wedstrijden inbegrepen
  const aankomend = wedstrijden
    .filter(w => !isGespeeld(w))
    .sort((x, y) => x.date.localeCompare(y.date) || (x.time ?? '99').localeCompare(y.time ?? '99'))
  const volgende = aankomend.find(isZvk)
  const gespeeld = wedstrijden.filter(w => isGespeeld(w))

  return (
    <AppPagina
      bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
      titel="Wedstrijden"
      actie={isAdmin && (
        <Knop soort="primair" icoon="plus" onClick={() => setFormulierOpen(true)} style={{ height: '38px' }}>Nieuw</Knop>
      )}
    >
      {formulierOpen && (
        <WedstrijdFormulier onSluiten={() => setFormulierOpen(false)} onOpgeslagen={fetchWedstrijden} />
      )}
      <div className="z-segment z-segment-vol" role="group">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <Laden regels={4} />
      ) : tab === 'overzicht' ? (
        <PWAOverzicht wedstrijden={wedstrijden} />
      ) : tab === 'gespeeld' ? (
        gespeeld.length === 0
          ? <LegeStaat tekst="Nog geen gespeelde wedstrijden." icoon="bal" />
          : (
            <WedstrijdenPerWeekend
              wedstrijden={gespeeld}
              variant="pwa"
              nieuwsteEerst
              onder={w => isZvk(w) ? <Reacties wedstrijdId={w.id} /> : null}
            />
          )
      ) : (
        <>
          {volgende ? (
            <VolgendeWedstrijdKaart wedstrijd={volgende} variant="pwa">
              {opgaveIsOpen(volgende) ? <Opgave wedstrijd={volgende} /> : null}
            </VolgendeWedstrijdKaart>
          ) : (
            <LegeStaat titel="Geen wedstrijd gepland" tekst="Onze volgende wedstrijd staat nog niet op de kalender." icoon="kalender" />
          )}

          {aankomend.length > 0 && (
            <WedstrijdenPerWeekend wedstrijden={aankomend} variant="pwa" />
          )}
        </>
      )}
    </AppPagina>
  )
}
