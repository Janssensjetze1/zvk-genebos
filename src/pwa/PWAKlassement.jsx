import { useSeason } from '../context/SeasonContext'
import KlassementTabel from '../components/KlassementTabel'
import { AppPagina } from '../ui'

export default function PWAKlassement() {
  const { actief: seizoen } = useSeason()
  return (
    <AppPagina bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null} titel="Klassement" ondertitel="Competitie">
      <KlassementTabel compact />
    </AppPagina>
  )
}
