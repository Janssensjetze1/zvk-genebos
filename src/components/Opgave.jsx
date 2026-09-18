import { useState } from 'react'
import { MAX_MEE, OPGAVE_STATUSSEN, opgaveIsOpen, useOpgave } from '../hooks/useOpgave'

// Opgave voor een aankomende wedstrijd: elke speler duidt zelf aan of hij meedoet.
// Dezelfde compacte opmaak op mobiel en desktop.
export default function Opgave({ wedstrijd }) {
  const { perStatus, mijnStatus, zetStatus, loading, bezig, gebruikerId, magMeedoen, aantalMee, vol, fout } = useOpgave(wedstrijd.id)
  const [toonLijst, setToonLijst] = useState(false)

  // De ouder verbergt dit blok al, dit is enkel een vangnet
  if (!opgaveIsOpen(wedstrijd)) return null

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '10px 0' }}>
        Opgave laden...
      </div>
    )
  }

  const volzet = aantalMee >= MAX_MEE
  const niemand = OPGAVE_STATUSSEN.every(s => perStatus[s.id].length === 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Kop met teller */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontSize: '11px', fontWeight: '700', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          ✋ Wie doet mee?
        </span>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          padding: '3px 9px', borderRadius: '20px',
          background: volzet ? '#fef2f2' : aantalMee > 0 ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${volzet ? '#fecaca' : aantalMee > 0 ? '#bbf7d0' : '#e2e8f0'}`,
          color: volzet ? '#ef4444' : aantalMee > 0 ? '#16a34a' : '#94a3b8',
        }}>
          {aantalMee}/{MAX_MEE}{volzet ? ' · volzet' : ''}
        </span>
      </div>

      {/* Bezettingsbalk */}
      <div style={{ height: '5px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, (aantalMee / MAX_MEE) * 100)}%`,
          height: '100%',
          background: volzet ? '#ef4444' : '#16a34a',
          transition: 'width 0.25s',
        }} />
      </div>

      {/* Keuzeknoppen: enkel het icoon, altijd naast elkaar. Zonder
          spelersfiche blijft enkel "Ik kom zien" over. */}
      {gebruikerId ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          {OPGAVE_STATUSSEN.filter(s => magMeedoen || s.id === 'kijken').map(s => {
            const actief = mijnStatus === s.id
            const geblokkeerd = s.id === 'mee' && vol
            const uit = bezig || geblokkeerd
            return (
              <button
                key={s.id}
                type="button"
                disabled={uit}
                aria-label={s.label}
                aria-pressed={actief}
                title={geblokkeerd ? `Volzet, er kunnen maar ${MAX_MEE} spelers meedoen` : s.label}
                onClick={e => { e.stopPropagation(); zetStatus(s.id) }}
                style={{
                  flex: 1,
                  height: '44px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px',
                  border: `1.5px solid ${actief ? s.rand : '#e2e8f0'}`,
                  background: actief ? s.bg : geblokkeerd ? '#f8fafc' : 'white',
                  boxShadow: actief ? `inset 0 0 0 1px ${s.rand}` : 'none',
                  cursor: uit ? 'not-allowed' : 'pointer',
                  opacity: bezig ? 0.6 : geblokkeerd ? 0.45 : 1,
                  transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
                  fontSize: '20px', lineHeight: 1,
                  filter: actief ? 'none' : 'grayscale(0.55)',
                }}
                onPointerDown={e => { if (!uit) e.currentTarget.style.transform = 'scale(0.95)' }}
                onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {s.emoji}
              </button>
            )
          })}
        </div>
      ) : null}

      {gebruikerId && !magMeedoen && (
        <div style={{
          fontSize: '12px', color: '#94a3b8', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px',
        }}>
          Je hangt nog niet aan een spelersfiche. Vraag een admin om je te koppelen.
        </div>
      )}

      {/* Foutmelding */}
      {fout && (
        <div style={{
          fontSize: '12px', color: '#b91c1c', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px',
        }}>
          {fout}
        </div>
      )}

      {/* Overzicht per status: uitklapbaar */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); if (!niemand) setToonLijst(o => !o) }}
          disabled={niemand}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            background: 'none', border: 'none', padding: '2px 0',
            cursor: niemand ? 'default' : 'pointer', textAlign: 'left',
          }}
        >
          <span style={{
            fontSize: '11px', fontWeight: '700', color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Wie gaf zich op
          </span>

          {/* Samenvatting blijft ook dichtgeklapt zichtbaar */}
          {niemand ? (
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>
              nog niemand
            </span>
          ) : (
            <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {OPGAVE_STATUSSEN.map(st => (
                <span key={st.id} style={{ fontSize: '12px', color: st.kleur, fontWeight: '600' }}>
                  {st.emoji} {perStatus[st.id].length}
                </span>
              ))}
            </span>
          )}

          {!niemand && (
            <svg width="13" height="13" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"
              style={{ marginLeft: 'auto', flexShrink: 0, transform: toonLijst ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {toonLijst && !niemand && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {OPGAVE_STATUSSEN.map(st => {
              const lijst = perStatus[st.id]
              if (lijst.length === 0) return null
              return (
                <div key={st.id}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: st.kleur, marginBottom: '6px' }}>
                    {st.emoji} {st.kort} ({lijst.length}{st.id === 'mee' ? `/${MAX_MEE}` : ''})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {lijst
                      .slice()
                      .sort((x, y) => (x.naam ?? '').localeCompare(y.naam ?? ''))
                      .map(o => (
                        <span key={o.user_id} style={{
                          fontSize: '12px', color: '#475569', background: st.bg,
                          border: `1px solid ${st.rand}`, borderRadius: '20px', padding: '3px 10px',
                        }}>
                          {o.naam ?? 'Onbekend'}
                        </span>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
