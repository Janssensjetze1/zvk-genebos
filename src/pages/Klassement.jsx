import { useSearchParams } from 'react-router-dom'
import { useSeason } from '../context/SeasonContext'
import KlassementTabel from '../components/KlassementTabel'
import BekerOverzicht from '../components/BekerOverzicht'
import { LegeStaat, PaginaKop, Segment } from '../ui'

const SOORTEN = [{ waarde: 'competitie', label: 'Competitie' }, { waarde: 'beker', label: 'Beker' }]

export default function Klassement() {
  const { actief: seizoen } = useSeason()
  const [params, setParams] = useSearchParams()
  const soort = params.get('soort') === 'beker' ? 'beker' : 'competitie'

  return (
    <div style={{ maxWidth: '980px' }}>
      <PaginaKop
        bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
        titel="Klassement"
        ondertitel={soort === 'beker'
          ? 'Beker · poulefase en knock-out'
          : 'Competitie · 3 punten voor winst, 1 voor een gelijkspel'}
      >
        <Segment opties={SOORTEN} waarde={soort} onChange={w => setParams(w === 'beker' ? { soort: w } : {}, { replace: true })} />
      </PaginaKop>
      {!seizoen
        ? <LegeStaat titel="Geen seizoen" tekst="Maak eerst een seizoen aan via Beheer → Seizoenen." icoon="klassement" />
        : soort === 'beker' ? <BekerOverzicht variant="desktop" /> : <KlassementTabel />}
    </div>
  )
}
