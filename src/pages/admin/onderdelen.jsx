import TabLeden from './tabs/TabLeden'
import TabSpelers from './tabs/TabSpelers'
import TabTeams from './tabs/TabTeams'
import TabWedstrijden from './tabs/TabWedstrijden'
import TabSeizoen from './tabs/TabSeizoen'
import TabMeldingen from './tabs/TabMeldingen'
import TabFeedback from './tabs/TabFeedback'
import TabQuotes from './tabs/TabQuotes'
import TabGebruik from './tabs/TabGebruik'
import TabDatabase from './tabs/TabDatabase'
import TabFanshop from './tabs/TabFanshop'

// Rendert één onderdeel van het beheer; de lijst staat in ./onderdelenLijst.js

export function OnderdeelInhoud({ id, tellers }) {
  switch (id) {
    case 'leden': return <TabLeden />
    case 'spelers': return <TabSpelers />
    case 'teams': return <TabTeams />
    case 'wedstrijden': return <TabWedstrijden />
    case 'seizoen': return <TabSeizoen />
    case 'meldingen': return <TabMeldingen />
    case 'quotes': return <TabQuotes />
    case 'gebruik': return <TabGebruik />
    case 'database': return <TabDatabase />
    case 'fanshop': return <TabFanshop onGewijzigd={tellers?.herlaad} />
    case 'feedback': return <TabFeedback onGelezen={() => tellers?.setTellers(t => ({ ...t, ongelezenFeedback: 0 }))} />
    default: return null
  }
}
