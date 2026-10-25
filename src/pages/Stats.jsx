import { useSeason } from '../context/SeasonContext'
import StatsOverzicht from '../components/StatsOverzicht'
import { PaginaKop } from '../ui'

export default function Stats() {
  const { actief: seizoen } = useSeason()
  return (
    <div>
      <PaginaKop
        bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
        titel="Statistieken"
        ondertitel="De Gouden Stier, de Assistenkoning en de MVP’s van het seizoen"
      />
      <StatsOverzicht naastElkaar />
    </div>
  )
}
