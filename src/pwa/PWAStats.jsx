import { useSeason } from '../context/SeasonContext'
import StatsOverzicht from '../components/StatsOverzicht'
import { AppPagina } from '../ui'

export default function PWAStats() {
  const { actief: seizoen } = useSeason()
  return (
    <AppPagina bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null} titel="Statistieken">
      <StatsOverzicht />
    </AppPagina>
  )
}
