import { useSeason } from '../context/SeasonContext'
import KlassementTabel from '../components/KlassementTabel'
import { LegeStaat, PaginaKop } from '../ui'

export default function Klassement() {
  const { actief: seizoen } = useSeason()

  return (
    <div style={{ maxWidth: '980px' }}>
      <PaginaKop
        bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
        titel="Klassement"
        ondertitel="Competitie · 3 punten voor winst, 1 voor een gelijkspel"
      />
      {seizoen
        ? <KlassementTabel />
        : <LegeStaat titel="Geen seizoen" tekst="Maak eerst een seizoen aan via Beheer → Seizoenen." icoon="klassement" />}
    </div>
  )
}
