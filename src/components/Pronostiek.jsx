import { useState } from 'react'
import { usePronostiek, pronostiekSluit, pronostiekOpent, tijdTotLabel } from '../hooks/usePronostiek'

// Pronostiek van één wedstrijd. Standaard ingeklapt tot één regel, het blok
// hangt onder elke wedstrijdkaart, dus het mag niet de halve kaart innemen.
// Tik op de regel om te openen. `standaardOpen` zet hem meteen open (gebruikt
// op de pronostiekpagina bij wedstrijden die nú te voorspellen zijn).
// Dezelfde compacte opmaak op mobiel en desktop.

const ACCENT = 'var(--z-blauw)'

function Stepper({ label, waarde, zet, disabled }) {
  const knop = (teken, onClick, uit) => (
    <button
      onClick={onClick}
      disabled={disabled || uit}
      aria-label={`${label} ${teken === '−' ? 'minder' : 'meer'}`}
      style={{
        width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
        border: '1px solid var(--z-lijn)', background: 'white',
        color: uit ? 'var(--z-lijn-sterk)' : 'var(--z-tekst-2)',
        fontSize: '16px', fontWeight: '700', lineHeight: 1,
        cursor: disabled || uit ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', padding: 0,
      }}
    >{teken}</button>
  )

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '10px', fontWeight: '600', color: 'var(--z-tekst-4)', marginBottom: '5px',
        textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        {knop('−', () => zet(Math.max(0, waarde - 1)), waarde <= 0)}
        <span style={{
          fontSize: '21px', fontWeight: '800', color: 'var(--z-tekst)',
          minWidth: '22px', textAlign: 'center', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{waarde}</span>
        {knop('+', () => zet(Math.min(50, waarde + 1)), waarde >= 50)}
      </div>
    </div>
  )
}

function Voorspellingenlijst({ lijst, metPunten, gebruikerId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {lijst.map((v, i) => {
        const ikzelf = v.user_id === gebruikerId
        const vThuis = metPunten ? v.voorspeld_thuis : v.home_score
        const vUit   = metPunten ? v.voorspeld_uit   : v.away_score
        return (
          <div key={v.user_id ?? i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 9px', borderRadius: '8px',
            background: ikzelf ? 'var(--z-blauw-50)' : 'var(--z-vlak)',
          }}>
            <span style={{
              flex: 1, minWidth: 0, fontSize: '12px',
              fontWeight: ikzelf ? '700' : '500',
              color: ikzelf ? ACCENT : 'var(--z-tekst-2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{v.naam ?? 'Onbekend'}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--z-tekst)', fontVariantNumeric: 'tabular-nums' }}>
              {vThuis}–{vUit}
            </span>
            {metPunten && (
              <span style={{
                fontSize: '12px', fontWeight: '800', minWidth: '30px', textAlign: 'right',
                color: v.punten >= 5 ? 'var(--z-winst)' : v.punten > 0 ? '#d97706' : 'var(--z-lijn-sterk)',
              }}>{v.punten > 0 ? `+${v.punten}` : '0'}{v.durfbonus ? '🎯' : ''}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Pronostiek({ wedstrijd, standaardOpen = false }) {
  const { mijn, alle, scores, aantal, loading, bezig, fout, opslaan, status, gebruikerId } = usePronostiek(wedstrijd)
  const [uit_geklapt, setUitgeklapt] = useState(standaardOpen)
  const [invoer, setInvoer] = useState(null)   // null = toon wat opgeslagen staat
  const [bewaard, setBewaard] = useState(false)

  if (status === 'geen') return null

  const thuis = invoer ? invoer.thuis : (mijn?.home_score ?? 0)
  const uit   = invoer ? invoer.uit   : (mijn?.away_score ?? 0)
  const setThuis = v => setInvoer({ thuis: v, uit })
  const setUit   = v => setInvoer({ thuis, uit: v })

  const thuisNaam = wedstrijd.home_team?.name ?? 'Thuis'
  const uitNaam   = wedstrijd.away_team?.name ?? 'Uit'
  const metPunten = scores.length > 0
  const mijnScore = metPunten ? scores.find(s => s.user_id === gebruikerId) : null

  // ── De samenvattingsregel (altijd zichtbaar) ───────────────────────────────
  let samenvatting, chip
  if (status === 'nog-niet') {
    samenvatting = 'Opent later'
    chip = { tekst: tijdTotLabel(pronostiekOpent(wedstrijd)).replace('nog ', 'over '), kleur: 'var(--z-tekst-4)', bg: 'var(--z-vlak)', rand: 'var(--z-lijn)' }
  } else if (status === 'open') {
    samenvatting = mijn ? `Jouw gok: ${mijn.home_score}–${mijn.away_score}` : 'Nog niet ingevuld'
    chip = mijn
      ? { tekst: tijdTotLabel(pronostiekSluit(wedstrijd)), kleur: 'var(--z-winst)', bg: 'var(--z-winst-bg)', rand: 'var(--z-winst-rand)' }
      : { tekst: tijdTotLabel(pronostiekSluit(wedstrijd)), kleur: '#d97706', bg: 'var(--z-gelijk-bg)', rand: 'var(--z-gelijk-rand)' }
  } else if (metPunten) {
    samenvatting = mijnScore
      ? `Jouw gok: ${mijnScore.voorspeld_thuis}–${mijnScore.voorspeld_uit}`
      : 'Je gokte niet mee'
    chip = mijnScore
      ? { tekst: `+${mijnScore.punten}${mijnScore.durfbonus ? ' 🎯' : ''}`, kleur: mijnScore.punten > 0 ? 'var(--z-winst)' : 'var(--z-tekst-4)', bg: mijnScore.punten > 0 ? 'var(--z-winst-bg)' : 'var(--z-vlak)', rand: mijnScore.punten > 0 ? 'var(--z-winst-rand)' : 'var(--z-lijn)' }
      : { tekst: `${scores.length} gokten`, kleur: 'var(--z-tekst-4)', bg: 'var(--z-vlak)', rand: 'var(--z-lijn)' }
  } else {
    samenvatting = mijn ? `Jouw gok: ${mijn.home_score}–${mijn.away_score}` : 'Je gokte niet mee'
    chip = { tekst: 'gesloten', kleur: 'var(--z-tekst-3)', bg: 'var(--z-lijn-zacht)', rand: 'var(--z-lijn)' }
  }

  const anderen = alle
    .filter(v => v.user_id !== gebruikerId)
    .sort((a, b) => (a.naam ?? '').localeCompare(b.naam ?? ''))

  const lijst = metPunten
    ? [...scores].sort((a, b) => b.punten - a.punten || (a.naam ?? '').localeCompare(b.naam ?? ''))
    : [...alle].sort((a, b) => (a.naam ?? '').localeCompare(b.naam ?? ''))

  // Op de detailpagina (standaardOpen) valt er niets te vouwen: alles staat open.
  const uitklapbaar = !standaardOpen && status !== 'nog-niet'
  const gewijzigd = !mijn || mijn.home_score !== thuis || mijn.away_score !== uit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: uit_geklapt ? '10px' : 0 }}>

      {/* Samenvattingsregel */}
      <div
        onClick={() => uitklapbaar && setUitgeklapt(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: uitklapbaar ? 'pointer' : 'default', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '13px', flexShrink: 0 }}>🔮</span>
        <span style={{
          flex: 1, minWidth: 0, fontSize: '12px', fontWeight: '600', color: 'var(--z-tekst-3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{loading ? 'Pronostiek laden...' : samenvatting}</span>

        {!loading && (
          <span style={{
            flexShrink: 0, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
            padding: '2px 8px', borderRadius: '20px',
            background: chip.bg, color: chip.kleur, border: `1px solid ${chip.rand}`,
          }}>{chip.tekst}</span>
        )}

        {uitklapbaar && !loading && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3"
            style={{ flexShrink: 0, transform: uit_geklapt ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {!uit_geklapt || loading ? null : status === 'open' ? (
        // ── Invoeren ───────────────────────────────────────────────────────
        <>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '6px',
            background: 'var(--z-vlak)', border: '1px solid var(--z-lijn)', borderRadius: '12px',
            padding: '10px 8px',
          }}>
            <Stepper label={thuisNaam} waarde={thuis} zet={setThuis} disabled={bezig} />
            <span style={{ fontSize: '16px', color: 'var(--z-lijn-sterk)', fontWeight: '700', paddingTop: '22px' }}>–</span>
            <Stepper label={uitNaam} waarde={uit} zet={setUit} disabled={bezig} />

            <button
              onClick={async () => {
                const ok = await opslaan(thuis, uit)
                if (ok) { setInvoer(null); setBewaard(true); setTimeout(() => setBewaard(false), 2000) }
              }}
              disabled={bezig || !gewijzigd || !gebruikerId}
              style={{
                alignSelf: 'flex-end', flexShrink: 0,
                height: '30px', padding: '0 14px', borderRadius: '9px', border: 'none',
                background: bewaard ? 'var(--z-winst)' : gewijzigd ? ACCENT : 'var(--z-lijn)',
                color: bewaard || gewijzigd ? 'white' : 'var(--z-tekst-4)',
                fontSize: '13px', fontWeight: '700',
                cursor: bezig || !gewijzigd ? 'default' : 'pointer',
                transition: 'background 0.15s',
              }}
            >{bezig ? '...' : bewaard ? '✓' : mijn ? 'Wijzig' : 'Opslaan'}</button>
          </div>

          {fout && <p style={{ fontSize: '12px', color: 'var(--z-verlies)', margin: 0 }}>{fout}</p>}

          {/* Wat gokten de anderen? Zichtbaar zodra je zelf ingevuld hebt. */}
          {mijn && anderen.length > 0 && (
            <>
              <div style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--z-tekst-4)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px',
              }}>De rest gokte</div>
              <Voorspellingenlijst lijst={anderen} metPunten={false} gebruikerId={gebruikerId} />
            </>
          )}

          <p style={{ fontSize: '11px', color: 'var(--z-lijn-sterk)', margin: 0, lineHeight: 1.4 }}>
            {aantal === 0
              ? 'Nog niemand voorspelde deze wedstrijd.'
              : `${aantal} ${aantal === 1 ? 'lid gokte' : 'leden gokten'} al.`}
            {!mijn && aantal > 0 ? ' Vul in om hun gok te zien.' : ''}
          </p>
        </>
      ) : (
        // ── Gesloten: ieders gok ───────────────────────────────────────────
        lijst.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', margin: 0 }}>Niemand had een voorspelling ingediend.</p>
        ) : (
          <Voorspellingenlijst lijst={lijst} metPunten={metPunten} gebruikerId={gebruikerId} />
        )
      )}

      {uit_geklapt && metPunten && lijst.some(v => v.durfbonus) && (
        <p style={{ fontSize: '11px', color: 'var(--z-tekst-4)', margin: 0 }}>
          🎯 als enige de exacte score juist.
        </p>
      )}
    </div>
  )
}
