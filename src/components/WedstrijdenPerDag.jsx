import { useNavigate } from 'react-router-dom'
import { isGespeeld, perWeekend } from '../lib/wedstrijd'
import PloegLogo from './PloegLogo'
import { useMvpWinnaars } from '../hooks/useMvp'
import { Icoon } from '../ui'

// Compacte lijst van wedstrijden, gegroepeerd per dag. Bedoeld voor alles wat
// niet enkel over ZVK gaat: het weekendprogramma en de uitslagen van de andere
// ploegen. De volgorde van de lijst blijft behouden, elke regel opent de
// detailpagina. DagLabel en WedstrijdRijen zijn ook los te gebruiken.
// variant: 'pwa' of 'desktop' (bepaalt enkel de route)

const TYPE_LABELS = { beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  beker: { background: 'var(--z-paars-bg)', color: 'var(--z-paars)' },
  vriendschappelijk: { background: 'var(--z-lijn-zacht)', color: 'var(--z-tekst-2)' },
}

function dagLabel(iso) {
  const t = new Date(`${iso}T00:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function Ploeg({ team, score, sterk, dof }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <PloegLogo team={team} grootte={22} />
      <span style={{
        flex: 1, minWidth: 0, fontSize: '14px',
        fontWeight: sterk || team?.is_zvk ? '700' : '500',
        color: team?.is_zvk ? 'var(--z-blauw)' : dof ? 'var(--z-tekst-3)' : 'var(--z-tekst)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{team?.name}</span>
      {score != null && (
        <span style={{
          flexShrink: 0, minWidth: '18px', textAlign: 'right',
          fontSize: '15px', fontWeight: sterk ? '800' : '600',
          color: dof ? 'var(--z-tekst-4)' : 'var(--z-tekst)',
          fontVariantNumeric: 'tabular-nums',
        }}>{score}</span>
      )}
    </div>
  )
}

function Rij({ w, laatste, onOpen, onder, mvps }) {
  const gespeeld = isGespeeld(w)
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  const thuisWint = gespeeld && w.home_score > w.away_score
  const uitWint = gespeeld && w.away_score > w.home_score
  const extra = onder?.(w)

  return (
    <div style={{
      background: onze ? 'var(--z-blauw-50)' : undefined,
      boxShadow: onze ? 'inset 3px 0 0 var(--z-blauw)' : undefined,
      borderBottom: laatste ? 'none' : '1px solid var(--z-lijn-zacht)',
    }}>
      <div
        onClick={onOpen}
        className="z-rij-klik"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Ploeg team={w.home_team} score={gespeeld ? w.home_score : null} sterk={thuisWint} dof={uitWint} />
          <Ploeg team={w.away_team} score={gespeeld ? w.away_score : null} sterk={uitWint} dof={thuisWint} />
          {TYPE_LABELS[w.type] && (
            <span style={{
              alignSelf: 'flex-start', marginLeft: '32px',
              fontSize: '11px', fontWeight: '600', padding: '1px 8px', borderRadius: '99px',
              ...TYPE_COLORS[w.type],
            }}>{TYPE_LABELS[w.type]}</span>
          )}
          {gespeeld && mvps?.length > 0 && (
            <span className="z-mvp-lijn">
              <Icoon naam="kroon" grootte={13} dikte={2.4} />
              MVP: {mvps.map(s => s.name).join(' & ')}
            </span>
          )}
        </div>

        {!gespeeld && w.time && (
          <span style={{
            flexShrink: 0, fontSize: '13px', fontWeight: '600', color: 'var(--z-tekst-2)',
            fontVariantNumeric: 'tabular-nums',
          }}>{w.time.slice(0, 5)}</span>
        )}

        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="z-chevron" strokeWidth="3" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      {extra && <div style={{ padding: '0 16px 12px 48px' }}>{extra}</div>}
    </div>
  )
}

export function DagLabel({ datum }) {
  return (
    <div style={{
      fontSize: '12px', fontWeight: '600', color: 'var(--z-tekst-3)',
      margin: '0 2px 8px',
    }}>{dagLabel(datum)}</div>
  )
}

// Eén kaart met een regel per wedstrijd, zonder daglabel.
// onder: optionele functie (w) => inhoud onder een regel, bv. reacties
export function WedstrijdRijen({ wedstrijden, variant = 'pwa', onder }) {
  const navigate = useNavigate()
  const mvpWinnaars = useMvpWinnaars()
  return (
    <div className="z-kaart" style={{ overflow: 'hidden' }}>
      {wedstrijden.map((w, i) => (
        <Rij
          key={w.id}
          w={w}
          laatste={i === wedstrijden.length - 1}
          onder={onder}
          mvps={mvpWinnaars[w.id]}
          onOpen={() => navigate(`${variant === 'pwa' ? '/app' : ''}/wedstrijd/${w.id}`)}
        />
      ))}
    </div>
  )
}

export default function WedstrijdenPerDag({ wedstrijden, variant = 'pwa', onder }) {
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
          <WedstrijdRijen wedstrijden={dag.lijst} variant={variant} onder={onder} />
        </div>
      ))}
    </div>
  )
}

// Per weekend een kop, daaronder de dagen. Voor het volledige programma en de
// uitslagen van de competitie.
export function WedstrijdenPerWeekend({ wedstrijden, variant = 'pwa', nieuwsteEerst = false, onder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {perWeekend(wedstrijden, { nieuwsteEerst }).map(weekend => (
        <section key={weekend.sleutel}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--z-tekst)', margin: '0 0 12px' }}>
            {weekend.titel}
          </h2>
          <WedstrijdenPerDag wedstrijden={weekend.lijst} variant={variant} onder={onder} />
        </section>
      ))}
    </div>
  )
}
