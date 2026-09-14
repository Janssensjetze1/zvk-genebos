import { useState } from 'react'
import { usePronostiek, pronostiekSluit, pronostiekOpent, tijdTotLabel } from '../hooks/usePronostiek'

// Pronostiek van één wedstrijd: score voorspellen, en na de deadline zien wat
// de rest gokte. variant: 'pwa' (compacter) of 'desktop'.
//
// De drie toestanden:
//   nog-niet  → opent pas over x dagen, enkel een regeltje
//   open      → invoer met + en −
//   gesloten  → ieders voorspelling, met punten zodra de uitslag bekend is

const ACCENT = '#6366f1'

function Stepper({ label, waarde, zet, disabled, compact }) {
  const knop = (teken, onClick, uit) => (
    <button
      onClick={onClick}
      disabled={disabled || uit}
      aria-label={teken === '−' ? `${label} minder` : `${label} meer`}
      style={{
        width: compact ? '34px' : '32px', height: compact ? '34px' : '32px',
        borderRadius: '10px', flexShrink: 0,
        border: '1px solid #e2e8f0', background: 'white',
        color: uit ? '#cbd5e1' : '#475569',
        fontSize: '18px', fontWeight: '700', lineHeight: 1,
        cursor: disabled || uit ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
      }}
    >{teken}</button>
  )

  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{
        fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {knop('−', () => zet(Math.max(0, waarde - 1)), waarde <= 0)}
        <span style={{
          fontSize: '26px', fontWeight: '800', color: '#0f172a',
          minWidth: '30px', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{waarde}</span>
        {knop('+', () => zet(Math.min(50, waarde + 1)), waarde >= 50)}
      </div>
    </div>
  )
}

function Chip({ kleur, bg, rand, children }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
      padding: '3px 9px', borderRadius: '20px',
      background: bg, color: kleur, border: `1px solid ${rand}`,
    }}>{children}</span>
  )
}

export default function Pronostiek({ wedstrijd, variant = 'pwa' }) {
  const compact = variant === 'pwa'
  const { mijn, alle, scores, aantal, loading, bezig, fout, opslaan, status, gebruikerId } = usePronostiek(wedstrijd)
  // null = nog niets aangeraakt, dus toon gewoon wat er opgeslagen staat.
  // Zo is er geen effect nodig om de invoer met de database gelijk te zetten.
  const [invoer, setInvoer] = useState(null)
  const [bewaard, setBewaard] = useState(false)

  const thuis = invoer ? invoer.thuis : (mijn?.home_score ?? 0)
  const uit   = invoer ? invoer.uit   : (mijn?.away_score ?? 0)
  const setThuis = v => setInvoer({ thuis: v, uit })
  const setUit   = v => setInvoer({ thuis, uit: v })

  if (status === 'geen') return null

  const thuisNaam = wedstrijd.home_team?.name ?? 'Thuis'
  const uitNaam   = wedstrijd.away_team?.name ?? 'Uit'

  const kop = (rechts) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <span style={{
        fontSize: '11px', fontWeight: '700', color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>🔮 Pronostiek</span>
      {rechts}
    </div>
  )

  // ── Opent nog niet ─────────────────────────────────────────────────────────
  if (status === 'nog-niet') {
    const opent = pronostiekOpent(wedstrijd)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {kop(<Chip kleur="#94a3b8" bg="#f8fafc" rand="#e2e8f0">{tijdTotLabel(opent)}</Chip>)}
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Voorspellen kan vanaf een week voor de wedstrijd, tot een uur voor de aftrap.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '8px 0' }}>Pronostiek laden...</div>
  }

  // ── Open: invoeren of aanpassen ────────────────────────────────────────────
  if (status === 'open') {
    const gewijzigd = !mijn || mijn.home_score !== thuis || mijn.away_score !== uit
    const sluit = pronostiekSluit(wedstrijd)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {kop(
          <Chip kleur={mijn ? '#16a34a' : '#d97706'} bg={mijn ? '#f0fdf4' : '#fffbeb'} rand={mijn ? '#bbf7d0' : '#fde68a'}>
            {mijn ? '✓ ingevuld' : 'nog niet ingevuld'} · {tijdTotLabel(sluit)}
          </Chip>
        )}

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: compact ? '4px' : '12px',
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
          padding: compact ? '14px 8px' : '16px 20px',
        }}>
          <Stepper label={thuisNaam} waarde={thuis} zet={setThuis} disabled={bezig} compact={compact} />
          <span style={{ fontSize: '20px', color: '#cbd5e1', fontWeight: '700', alignSelf: 'center', paddingTop: '18px' }}>–</span>
          <Stepper label={uitNaam} waarde={uit} zet={setUit} disabled={bezig} compact={compact} />
        </div>

        <button
          onClick={async () => {
            const ok = await opslaan(thuis, uit)
            if (ok) {
              setInvoer(null)          // volg voortaan weer wat er opgeslagen staat
              setBewaard(true)
              setTimeout(() => setBewaard(false), 2200)
            }
          }}
          disabled={bezig || !gewijzigd || !gebruikerId}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
            background: bewaard ? '#16a34a' : gewijzigd ? ACCENT : '#f1f5f9',
            color: bewaard || gewijzigd ? 'white' : '#94a3b8',
            fontSize: '14px', fontWeight: '700',
            cursor: bezig || !gewijzigd ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {bezig ? 'Bezig...' : bewaard ? '✓ Opgeslagen' : gewijzigd ? (mijn ? 'Voorspelling aanpassen' : 'Voorspelling opslaan') : 'Opgeslagen'}
        </button>

        {fout && (
          <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{fout}</p>
        )}

        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          {aantal === 0 ? 'Nog niemand voorspelde deze wedstrijd.'
            : `${aantal} ${aantal === 1 ? 'lid voorspelde' : 'leden voorspelden'} al.`}
          {' '}Je ziet ieders voorspelling zodra de pronostiek sluit.
        </p>
      </div>
    )
  }

  // ── Gesloten: ieders voorspelling, met punten als de uitslag er is ─────────
  const metPunten = scores.length > 0
  const lijst = metPunten
    ? [...scores].sort((a, b) => b.punten - a.punten || (a.naam ?? '').localeCompare(b.naam ?? ''))
    : [...alle].sort((a, b) => (a.naam ?? '').localeCompare(b.naam ?? ''))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {kop(<Chip kleur="#64748b" bg="#f1f5f9" rand="#e2e8f0">{metPunten ? 'uitgeteld' : 'gesloten'}</Chip>)}

      {lijst.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
          Niemand had een voorspelling ingediend.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {lijst.map((v, i) => {
            const ikzelf = v.user_id === gebruikerId
            const vThuis = metPunten ? v.voorspeld_thuis : v.home_score
            const vUit   = metPunten ? v.voorspeld_uit   : v.away_score
            return (
              <div key={v.user_id ?? i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '10px',
                background: ikzelf ? '#eef2ff' : '#f8fafc',
                border: `1px solid ${ikzelf ? '#c7d2fe' : '#f1f5f9'}`,
              }}>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: '13px',
                  fontWeight: ikzelf ? '700' : '500',
                  color: ikzelf ? ACCENT : '#0f172a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{v.naam ?? 'Onbekend'}{ikzelf ? ' (jij)' : ''}</span>

                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                  {vThuis}–{vUit}
                </span>

                {metPunten && (
                  <span style={{
                    fontSize: '12px', fontWeight: '800', minWidth: '34px', textAlign: 'right',
                    color: v.punten >= 5 ? '#16a34a' : v.punten > 0 ? '#d97706' : '#cbd5e1',
                  }}>
                    {v.punten > 0 ? `+${v.punten}` : '0'}
                    {v.durfbonus ? ' 🎯' : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {metPunten && lijst.some(v => v.durfbonus) && (
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
          🎯 durfbonus: als enige de exacte score juist.
        </p>
      )}
    </div>
  )
}
