import { useSearchParams } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import KlassementTabel from '../components/KlassementTabel'
import BekerOverzicht from '../components/BekerOverzicht'
import { AppPagina, Segment } from '../ui'

// Competitie of beker; de keuze zit in de URL, zodat je na een wedstrijd
// terugkomt waar je was
const SOORTEN = [{ waarde: 'competitie', label: 'Competitie' }, { waarde: 'beker', label: 'Beker' }]

export default function PWAKlassement() {
  const { actief: seizoen } = useSeason()
  const [params, setParams] = useSearchParams()
  const soort = params.get('soort') === 'beker' ? 'beker' : 'competitie'

  return (
    <AppPagina bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null} titel="Klassement">
      <Segment vol opties={SOORTEN} waarde={soort} onChange={w => setParams(w === 'beker' ? { soort: w } : {}, { replace: true })} />
      {soort === 'beker' ? <BekerOverzicht variant="pwa" /> : <KlassementTabel compact />}
    </AppPagina>
  )
}
