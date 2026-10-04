import { useNavigate } from 'react-router-dom'
import { isGespeeld } from '../lib/wedstrijd'

// Compacte lijst van wedstrijden, gegroepeerd per dag. Bedoeld voor alles wat
// niet enkel over ZVK gaat: het weekendprogramma en de uitslagen van de andere
// ploegen. De volgorde van de lijst blijft behouden, elke regel opent de
// detailpagina. DagLabel en WedstrijdRijen zijn ook los te gebruiken.
// variant: 'pwa' of 'desktop' (bepaalt enkel de route)

const TYPE_LABELS = { beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  beker: { background: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { background: '#f0fdf4', color: '#16a34a' },
}

function dagLabel(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function Ploeg({ team, score, sterk, dof }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: '14px',
        fontWeight: sterk || team?.is_zvk ? '700' : '500',
        color: team?.is_zvk ? '#1d4ed8' : dof ? '#64748b' : '#0f172a',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{team?.name}</span>
      {score != null && (
        <span style={{
          flexShrink: 0, minWidth: '18px', textAlign: 'right',
          fontSize: '15px', fontWeight: sterk ? '800' : '600',
          color: dof ? '#94a3b8' : '#0f172a',
          fontVariantNumeric: 'tabular-nums',
        }}>{score}</span>
      )}
    </div>
  )
}

function Rij({ w, laatste, onOpen }) {
  const gespeeld = isGespeeld(w)
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  const thuisWint = gespeeld && w.home_score > w.away_score
  const uitWint = gespeeld && w.away_score > w.home_score

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px', cursor: 'pointer',
        background: onze ? '#eff6ff' : 'white',
        borderBottom: laatste ? 'none' : '1px solid #f1f5f9',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <Ploeg team={w.home_team} score={gespeeld ? w.home_score : null} sterk={thuisWint} dof={uitWint} />
        <Ploeg team={w.away_team} score={gespeeld ? w.away_score : null} sterk={uitWint} dof={thuisWint} />
        {TYPE_LABELS[w.type] && (
          <span style={{
            alignSelf: 'flex-start', marginTop: '2px',
            fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '20px',
            ...TYPE_COLORS[w.type],
          }}>{TYPE_LABELS[w.type]}</span>
        )}
      </div>

      {!gespeeld && w.time && (
        <span style={{
          flexShrink: 0, fontSize: '13px', fontWeight: '700', color: '#475569',
          fontVariantNumeric: 'tabular-nums',
        }}>{w.time.slice(0, 5)}</span>
      )}

      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

export function DagLabel({ datum }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: '700', color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 2px 6px',
    }}>{dagLabel(datum)}</div>
  )
}

// Eén kaart met een regel per wedstrijd, zonder daglabel.
export function WedstrijdRijen({ wedstrijden, variant = 'pwa' }) {
  const navigate = useNavigate()
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
      {wedstrijden.map((w, i) => (
        <Rij
          key={w.id}
          w={w}
          laatste={i === wedstrijden.length - 1}
          onOpen={() => navigate(`${variant === 'pwa' ? '/app' : ''}/wedstrijd/${w.id}`)}
        />
      ))}
    </div>
  )
}

export default function WedstrijdenPerDag({ wedstrijden, variant = 'pwa' }) {
  const dagen = []
  for (const w of wedstrijden ?? []) {
    const vorige = dagen[dagen.length - 1]
    if (vorige?.datum === w.date) vorige.lijst.push(w)
    else dagen.push({ datum: w.date, lijst: [w] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {dagen.map(dag => (
        <div key={dag.datum}>
          <DagLabel datum={dag.datum} />
          <WedstrijdRijen wedstrijden={dag.lijst} variant={variant} />
        </div>
      ))}
    </div>
  )
}
