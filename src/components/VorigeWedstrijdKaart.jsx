import { useNavigate } from 'react-router-dom'
import { useMvpWinnaars } from '../hooks/useMvp'
import { Icoon, Kaart, Rij, TypeChip, UitslagLetter } from '../ui'

// Onze laatst gespeelde wedstrijd: W/G/V, de ploegen, de uitslag en de MVP.
// Gebruikt op het desktopoverzicht en op Overzicht in de app.
// variant: 'desktop' of 'pwa' (bepaalt de route en de maten)

export default function VorigeWedstrijdKaart({ wedstrijd: w, variant = 'desktop' }) {
  const navigate = useNavigate()
  const mvps = useMvpWinnaars()[w.id]
  const pwa = variant === 'pwa'
  const isThuis = w.home_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const uitslag = zvkScore > tegScore ? 'W' : zvkScore < tegScore ? 'V' : 'G'
  const datum = new Date(`${w.date}T00:00:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })

  return (
    <Kaart>
      <Rij onClick={() => navigate(`${pwa ? '/app' : ''}/wedstrijd/${w.id}`)} style={{ padding: pwa ? '14px 16px' : '16px 20px' }}>
        <UitslagLetter uitslag={uitslag} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {w.home_team?.name} – {w.away_team?.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13px', color: 'var(--z-tekst-3)' }}>
            {datum}
            <TypeChip type={w.type} />
          </div>
          {mvps?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--z-goud)' }}>
              <Icoon naam="kroon" grootte={13} dikte={2.4} />
              MVP: {mvps.map(s => s.name).join(' & ')}
            </div>
          )}
        </div>
        <div className="z-tab-nums" style={{ fontSize: pwa ? '20px' : '22px', fontWeight: 700, color: 'var(--z-tekst)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {w.home_score}<span style={{ color: 'var(--z-tekst-4)', margin: '0 6px' }}>–</span>{w.away_score}
        </div>
      </Rij>
    </Kaart>
  )
}
