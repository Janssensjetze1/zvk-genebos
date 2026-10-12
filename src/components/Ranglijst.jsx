import { useTopscorer } from '../context/TopscorerContext'
import EerKronen from './EerKronen'
import { RING_KLASSE } from '../lib/eer'
import { Avatar, Kaart, Laden, LegeStaat } from '../ui'

// Ranglijst van spelers met een balkje per aantal: topschutters, assists, ...
// Gebruikt op het desktopoverzicht en de statspagina van de app.
// spelers: [{ id, name, photo_url, [sleutel]: aantal }], al gesorteerd


const MEDAILLE = ['#d4a017', '#9aa5b5', '#b8733a']

// start: plaats van de eerste speler (bv. 4 onder een podium), max: hoogste aantal voor de balkjes
export default function Ranglijst({ spelers, sleutel, eenheid, loading, leeg = 'Nog geen data dit seizoen.', start = 1, max: maxAantal }) {
  const { eer } = useTopscorer()
  if (loading) return <Laden regels={3} />
  if (spelers.length === 0) return <LegeStaat tekst={leeg} />

  const max = maxAantal ?? Math.max(...spelers.map(s => s[sleutel]), 1)

  return (
    <Kaart>
      <div className="z-lijst">
        {spelers.map((speler, i) => {
          const eretitel = eer(speler.id)
          const aantal = speler[sleutel]
          return (
            <div key={speler.id} className="z-rij" style={{ gap: '12px' }}>
              <span className="z-tab-nums" style={{
                width: '22px', textAlign: 'center', flexShrink: 0,
                fontSize: '13px', fontWeight: 700,
                color: start + i <= 3 ? MEDAILLE[start + i - 1] : 'var(--z-tekst-4)',
              }}>{start + i}</span>

              <div
                className={eretitel ? RING_KLASSE[eretitel] : undefined}
                style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', padding: eretitel ? '2px' : 0 }}
              >
                <Avatar naam={speler.name} foto={speler.photo_url} grootte={eretitel ? 32 : 36} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{speler.name}</span>
                  {eretitel && <EerKronen eer={eretitel} grootte={12} />}
                </div>
                <div style={{ marginTop: '6px', height: '4px', borderRadius: '99px', background: 'var(--z-lijn-zacht)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(aantal / max) * 100}%`, height: '100%', borderRadius: '99px',
                    background: start + i === 1 ? 'var(--z-blauw)' : 'var(--z-blauw-200)',
                  }} />
                </div>
              </div>

              <div className="z-tab-nums" style={{ textAlign: 'right', flexShrink: 0, minWidth: '48px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--z-tekst)' }}>{aantal}</span>
                <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginLeft: '4px' }}>
                  {aantal === 1 ? eenheid[0] : eenheid[1]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Kaart>
  )
}
