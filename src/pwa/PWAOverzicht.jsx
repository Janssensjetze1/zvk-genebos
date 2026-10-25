import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isGespeeld, weekendWedstrijden } from '../lib/wedstrijd'
import { opgaveIsOpen } from '../hooks/useOpgave'
import Opgave from '../components/Opgave'
import VolgendeWedstrijdKaart from '../components/VolgendeWedstrijdKaart'
import VorigeWedstrijdKaart from '../components/VorigeWedstrijdKaart'
import WedstrijdenPerDag from '../components/WedstrijdenPerDag'
import Ranglijst from '../components/Ranglijst'
import { LegeStaat, Sectie, Stat } from '../ui'

// Tab Overzicht op het startscherm van de app: hetzelfde als het
// desktopoverzicht (Dashboard), onder elkaar. Werkt met de wedstrijden die
// PWAWedstrijden al ophaalde, dus zonder extra verzoeken.

const isZvk = w => !!(w.home_team?.is_zvk || w.away_team?.is_zvk)

export default function PWAOverzicht({ wedstrijden }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const chronologisch = [...wedstrijden].sort((x, y) =>
    x.date.localeCompare(y.date) || (x.time ?? '99').localeCompare(y.time ?? '99'))
  const gespeeld = chronologisch.filter(w => isGespeeld(w))
  const volgende = chronologisch.find(w => isZvk(w) && !isGespeeld(w))
  const vorige = gespeeld.filter(isZvk).at(-1)
  const weekend = weekendWedstrijden(wedstrijden)

  // Doelpunten en assists van dit seizoen
  const goals = gespeeld.flatMap(w => w.goals ?? [])
  const telling = (sleutel, persoon) => {
    const map = {}
    for (const g of goals) {
      const id = g[sleutel]
      if (!id || !g[persoon]) continue
      map[id] ??= { id, ...g[persoon], aantal: 0 }
      map[id].aantal++
    }
    return Object.values(map).sort((a, b) => b.aantal - a.aantal).slice(0, 3)
  }
  const topscorers = telling('scorer_id', 'scorer').map(s => ({ ...s, goals: s.aantal }))
  const topassists = telling('assist_id', 'assist').map(s => ({ ...s, assists: s.aantal }))

  const mijnId = profile?.player_id
  const mijn = mijnId && {
    gespeeld: gespeeld.filter(w => w.match_players?.some(mp => mp.player_id === mijnId)).length,
    goals: goals.filter(g => g.scorer_id === mijnId).length,
    assists: goals.filter(g => g.assist_id === mijnId).length,
  }

  const alleStats = (
    <button type="button" onClick={() => navigate('/app/stats')} className="z-knop z-knop-stil z-knop-klein">
      Alles
    </button>
  )

  return (
    <>
      <Sectie titel="Volgende wedstrijd">
        {volgende ? (
          <VolgendeWedstrijdKaart wedstrijd={volgende} variant="pwa">
            {opgaveIsOpen(volgende) ? <Opgave wedstrijd={volgende} /> : null}
          </VolgendeWedstrijdKaart>
        ) : (
          <LegeStaat titel="Geen wedstrijd gepland" tekst="Onze volgende wedstrijd staat nog niet op de kalender." icoon="kalender" />
        )}
      </Sectie>

      {vorige && (
        <Sectie titel="Laatste uitslag">
          <VorigeWedstrijdKaart wedstrijd={vorige} variant="pwa" />
        </Sectie>
      )}

      {mijn && (
        <Sectie titel="Jouw seizoen">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
            <Stat label="Matchen" waarde={mijn.gespeeld} />
            <Stat label="Goals" waarde={mijn.goals} />
            <Stat label="Assists" waarde={mijn.assists} />
          </div>
        </Sectie>
      )}

      {weekend.lijst.length > 0 && (
        <Sectie titel={weekend.titel} meta="Alle ploegen">
          <WedstrijdenPerDag wedstrijden={weekend.lijst} variant="pwa" />
        </Sectie>
      )}

      <Sectie titel="De Gouden Stier" actie={alleStats}>
        <Ranglijst spelers={topscorers} sleutel="goals" eenheid={['goal', 'goals']} leeg="Nog geen doelpunten gescoord." />
      </Sectie>

      <Sectie titel="Assistenkoning" actie={alleStats}>
        <Ranglijst spelers={topassists} sleutel="assists" eenheid={['assist', 'assists']} leeg="Nog geen assists geregistreerd." />
      </Sectie>
    </>
  )
}
