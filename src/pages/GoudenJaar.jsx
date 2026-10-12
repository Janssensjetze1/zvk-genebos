import { LegeStaat, PaginaKop } from '../ui'

export default function GoudenJaar() {
  return (
    <div style={{ maxWidth: '760px' }}>
      <PaginaKop titel="Het gouden jaar" />
      <LegeStaat titel="Komt eraan" tekst="Hier verschijnt binnenkort het gouden jaar." icoon="badge" />
    </div>
  )
}
