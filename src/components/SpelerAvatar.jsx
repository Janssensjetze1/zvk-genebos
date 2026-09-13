import { useTopscorer } from '../context/TopscorerContext'
import EerKronen from './EerKronen'
import { RING_KLASSE } from '../lib/eer'

// Ronde spelersfoto. De topscorer (goud) en de assistenkoning (paars) krijgen
// een glanzende ring en een kroontje, overal in de app op dezelfde manier.

export default function SpelerAvatar({
  speler,
  size = 44,
  achtergrond = '#eff6ff',
  rand = '2px solid #bfdbfe',
  letterKleur = '#3b82f6',
  letterGrootte,
  kroon = true,
  style,
}) {
  const { eer } = useTopscorer()
  const eretitel = eer(speler?.id)
  const letter = speler?.name?.charAt(0)?.toUpperCase() ?? '?'

  const cirkel = (
    <div style={{
      width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: achtergrond,
      border: eretitel ? 'none' : rand,
      boxSizing: 'border-box',
    }}>
      {speler?.photo_url
        ? <img src={speler.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{
            fontSize: letterGrootte ?? Math.round(size * 0.38),
            fontWeight: '700', color: letterKleur,
          }}>{letter}</span>
      }
    </div>
  )

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {eretitel ? (
        // Glansring (zie .topscorer-ring / .assistkoning-ring in index.css)
        <div className={RING_KLASSE[eretitel]} style={{ width: '100%', height: '100%' }}>
          {cirkel}
        </div>
      ) : cirkel}

      {eretitel && kroon && (
        <EerKronen
          eer={eretitel}
          grootte={Math.round(size * 0.32)}
          style={{
            position: 'absolute',
            top: -Math.round(size * 0.13),
            right: -Math.round(size * 0.06),
            transform: 'rotate(18deg)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}
