import { useTopscorer } from '../context/TopscorerContext'
import EerKronen from './EerKronen'
import { RING_KLASSE } from '../lib/eer'
import { Avatar, Kaart } from '../ui'

// Podium met de top 3: tweede links, winnaar in het midden, derde rechts.
// spelers: al gesorteerd, enkel de eerste drie worden getoond.

const PLAATSEN = [
  { plaats: 1, hoogte: 92, avatar: 64, medaille: '#d4a017' },
  { plaats: 2, hoogte: 68, avatar: 52, medaille: '#9aa5b5' },
  { plaats: 3, hoogte: 52, avatar: 52, medaille: '#b8733a' },
]
const VOLGORDE = [1, 0, 2]

export default function Podium({ spelers, sleutel, eenheid }) {
  const { eer } = useTopscorer()
  const top = spelers.slice(0, 3)

  return (
    <Kaart style={{ padding: '20px 14px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        {VOLGORDE.map(idx => {
          const speler = top[idx]
          const p = PLAATSEN[idx]
          const winnaar = idx === 0

          if (!speler) return <div key={idx} style={{ flex: 1 }} />

          const eretitel = eer(speler.id)
          const aantal = speler[sleutel]
          return (
            <div key={speler.id} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                {eretitel && (
                  <EerKronen eer={eretitel} grootte={winnaar ? 18 : 15} style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
                  }} />
                )}
                <div
                  className={eretitel ? RING_KLASSE[eretitel] : undefined}
                  style={{ width: p.avatar, height: p.avatar, borderRadius: '50%', padding: eretitel ? '3px' : 0 }}
                >
                  <Avatar
                    naam={speler.name}
                    foto={speler.photo_url}
                    grootte={eretitel ? p.avatar - 6 : p.avatar}
                    style={eretitel ? undefined : { boxShadow: `0 0 0 3px white, 0 0 0 5px ${p.medaille}` }}
                  />
                </div>
              </div>

              <div style={{
                maxWidth: '100%', fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {speler.name.split(' ')[0]}
              </div>
              <div className="z-tab-nums" style={{ margin: '2px 0 10px', lineHeight: 1 }}>
                <span style={{ fontSize: winnaar ? '26px' : '20px', fontWeight: 800, color: 'var(--z-tekst)' }}>{aantal}</span>
                <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginLeft: '3px' }}>
                  {aantal === 1 ? eenheid[0] : eenheid[1]}
                </span>
              </div>

              {/* Trede */}
              <div style={{
                width: '100%', height: p.hoogte, borderRadius: '10px 10px 0 0',
                display: 'flex', justifyContent: 'center', paddingTop: '10px',
                borderTop: `3px solid ${p.medaille}`,
                background: winnaar
                  ? 'linear-gradient(180deg, #2a4fb8 0%, #13234d 100%)'
                  : 'linear-gradient(180deg, var(--z-blauw-100) 0%, var(--z-blauw-50) 100%)',
                transformOrigin: 'bottom',
                animation: `z-trede 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 0.08}s both`,
              }}>
                <span className="z-tab-nums" style={{
                  fontFamily: 'var(--z-font-merk)', fontSize: winnaar ? '24px' : '18px', fontWeight: 700,
                  color: winnaar ? 'white' : 'var(--z-blauw)',
                }}>
                  {p.plaats}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Kaart>
  )
}
