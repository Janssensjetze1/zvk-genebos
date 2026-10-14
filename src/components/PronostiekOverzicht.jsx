import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { isGespeeld } from '../lib/wedstrijd'
import { Laden, PaginaKop, Segment } from '../ui'
import { usePronostiekKlassement, pronostiekStatus, pronostiekSluit, pronostiekOpent, tijdTotLabel, PUNTEN_UITLEG } from '../hooks/usePronostiek'

// Pronostiekpagina: gedeeld door de PWA en de webapp.
// Bewust een pure lijst: niets klapt hier open, elke regel brengt je naar de
// detailpagina van die wedstrijd. Daar vul je in en zie je ieders gok.
// variant: 'pwa' (smallere marges) of 'desktop'

const ACCENT = 'var(--z-blauw)'

function Kaart({ children, style }) {
  return (
    <div style={{
      background: 'var(--z-kaart)', border: '1px solid var(--z-lijn)', borderRadius: 'var(--z-r)',
      boxShadow: 'var(--z-schaduw-s)', overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

function Chip({ tekst, kleur, bg, rand }) {
  return (
    <span style={{
      flexShrink: 0, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
      padding: '3px 9px', borderRadius: '20px',
      background: bg, color: kleur, border: `1px solid ${rand}`,
    }}>{tekst}</span>
  )
}

// Eén regel per wedstrijd: datum, ploegen, jouw stand van zaken, pijltje.
function WedstrijdRij({ w, chip, onOpen, laatste }) {
  const datum = new Date(w.date)
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  const gespeeld = isGespeeld(w)

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', cursor: 'pointer',
        borderBottom: laatste ? 'none' : '1px solid var(--z-vlak)',
      }}
    >
      <div style={{
        width: '40px', flexShrink: 0, textAlign: 'center',
        background: 'var(--z-vlak)', borderRadius: '9px', padding: '4px 0',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--z-tekst)', lineHeight: 1.1 }}>{datum.getDate()}</div>
        <div style={{ fontSize: '9px', color: 'var(--z-tekst-4)', textTransform: 'uppercase', fontWeight: '700' }}>
          {datum.toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: '700', color: 'var(--z-tekst)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {w.home_team?.name} – {w.away_team?.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--z-tekst-4)', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {gespeeld ? <span style={{ fontWeight: '700', color: 'var(--z-tekst-2)' }}>{w.home_score}–{w.away_score}</span> : null}
          {w.time ? <span>{w.time.slice(0, 5)}</span> : null}
          {onze && <span style={{ color: 'var(--z-blauw)', fontWeight: '700' }}>onze match</span>}
        </div>
      </div>

      {chip && <Chip {...chip} />}

      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

function Sectie({ titel, children }) {
  return (
    <section>
      <h2 style={{
        fontSize: '15px', fontWeight: '600', color: 'var(--z-tekst)', margin: '0 0 12px',
      }}>{titel}</h2>
      <Kaart>{children}</Kaart>
    </section>
  )
}

export default function PronostiekOverzicht({ variant = 'pwa' }) {
  const compact = variant === 'pwa'
  const { user } = useAuth()
  const { actief: seizoen } = useSeason()
  const { rijen, loading: klassementBezig } = usePronostiekKlassement(seizoen?.id)
  const navigate = useNavigate()

  const [wedstrijden, setWedstrijden] = useState([])
  const [mijnGok, setMijnGok] = useState({})     // match_id → voorspelling
  const [mijnPunten, setMijnPunten] = useState({}) // match_id → score
  const [laden, setLaden] = useState(true)
  const [tab, setTab] = useState('wedstrijden')
  const [uitlegOpen, setUitlegOpen] = useState(false)

  useEffect(() => {
    let actief = true

    async function haalAlles(seizoenId, userId) {
      setLaden(true)
      const [matches, voorspellingen, scores] = await Promise.all([
        supabase
          .from('matches')
          .select('id, date, time, home_score, away_score, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), match_players(player_id), goals(id)')
          .eq('season_id', seizoenId)
          .order('date', { ascending: true }),
        supabase.from('predictions').select('match_id, home_score, away_score').eq('user_id', userId),
        supabase.from('pronostiek_scores').select('match_id, punten, durfbonus').eq('user_id', userId),
      ])
      if (!actief) return
      setWedstrijden(matches.data ?? [])
      setMijnGok(Object.fromEntries((voorspellingen.data ?? []).map(v => [v.match_id, v])))
      setMijnPunten(Object.fromEntries((scores.data ?? []).map(s => [s.match_id, s])))
      setLaden(false)
    }

    if (seizoen?.id && user?.id) haalAlles(seizoen.id, user.id)
    return () => { actief = false }
  }, [seizoen?.id, user?.id])

  const naarDetail = w => navigate(`${compact ? '/app' : ''}/wedstrijd/${w.id}`)

  const open       = wedstrijden.filter(w => pronostiekStatus(w) === 'open' && !isGespeeld(w))
  const binnenkort = wedstrijden.filter(w => pronostiekStatus(w) === 'nog-niet' && !isGespeeld(w))
  const afgelopen  = wedstrijden.filter(w => isGespeeld(w)).slice().reverse().slice(0, 10)

  const mijnPlaats = rijen.findIndex(r => r.user_id === user?.id)
  const mijnRij    = mijnPlaats >= 0 ? rijen[mijnPlaats] : null

  function chipVoorOpen(w) {
    const gok = mijnGok[w.id]
    const tijd = tijdTotLabel(pronostiekSluit(w))
    return gok
      ? { tekst: `${gok.home_score}–${gok.away_score}`, kleur: 'var(--z-winst)', bg: 'var(--z-winst-bg)', rand: 'var(--z-winst-rand)' }
      : { tekst: tijd, kleur: '#d97706', bg: 'var(--z-gelijk-bg)', rand: 'var(--z-gelijk-rand)' }
  }

  function chipVoorAfgelopen(w) {
    const score = mijnPunten[w.id]
    if (!score) return { tekst: 'niet gegokt', kleur: 'var(--z-lijn-sterk)', bg: 'var(--z-vlak)', rand: 'var(--z-lijn-zacht)' }
    return {
      tekst: `+${score.punten}${score.durfbonus ? ' 🎯' : ''}`,
      kleur: score.punten > 0 ? 'var(--z-winst)' : 'var(--z-tekst-4)',
      bg: score.punten > 0 ? 'var(--z-winst-bg)' : 'var(--z-vlak)',
      rand: score.punten > 0 ? 'var(--z-winst-rand)' : 'var(--z-lijn)',
    }
  }

  return (
    <div style={{ padding: compact ? '28px 16px 24px' : '0', maxWidth: compact ? 'none' : '760px' }}>
      {compact ? (
        <>
          {seizoen && <div className="z-bovenlabel">Seizoen {seizoen.name}</div>}
          <h1 className="z-app-titel" style={{ marginBottom: '20px' }}>Pronostiek</h1>
        </>
      ) : (
        <PaginaKop
          bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
          titel="Pronostiek"
          ondertitel="Voorspel de uitslag en klim in het klassement"
        >
          <Segment
            waarde={tab}
            onChange={setTab}
            opties={[
              { waarde: 'wedstrijden', label: `Wedstrijden${open.length ? ` (${open.length})` : ''}` },
              { waarde: 'klassement', label: 'Klassement' },
            ]}
          />
        </PaginaKop>
      )}

      {/* Jouw stand */}
      {mijnRij && (
        <Kaart style={{ marginBottom: '16px', background: ACCENT, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '800', color: 'white',
            }}>{mijnPlaats + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Jouw plaats</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
                {mijnRij.punten} punten uit {mijnRij.voorspellingen} {mijnRij.voorspellingen === 1 ? 'voorspelling' : 'voorspellingen'}
              </div>
            </div>
            {mijnRij.exacte > 0 && (
              <span style={{
                flexShrink: 0, fontSize: '11px', fontWeight: '700', color: 'white',
                background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '20px', padding: '4px 10px',
              }}>{mijnRij.exacte}× exact</span>
            )}
          </div>
        </Kaart>
      )}

      {/* Tabs */}
      {compact && (
        <div style={{ marginBottom: '20px' }}>
          <Segment
            vol
            waarde={tab}
            onChange={setTab}
            opties={[
              { waarde: 'wedstrijden', label: `Wedstrijden${open.length ? ` (${open.length})` : ''}` },
              { waarde: 'klassement', label: 'Klassement' },
            ]}
          />
        </div>
      )}

      {/* ── Tab: wedstrijden ───────────────────────────────────────────────── */}
      {tab === 'wedstrijden' && (
        laden ? (
          compact
            ? <div style={{ textAlign: 'center', padding: '48px', color: 'var(--z-tekst-4)' }}>Laden...</div>
            : <Laden regels={5} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '22px' : '32px' }}>

            {open.length > 0 ? (
              <Sectie titel="Nu te voorspellen">
                {open.map((w, i) => (
                  <WedstrijdRij
                    key={w.id} w={w}
                    chip={chipVoorOpen(w)}
                    onOpen={() => naarDetail(w)}
                    laatste={i === open.length - 1}
                  />
                ))}
              </Sectie>
            ) : (
              <Kaart>
                <div style={{ padding: '30px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '30px', marginBottom: '8px' }}>🔮</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--z-tekst)', marginBottom: '5px' }}>
                    Momenteel niets te voorspellen
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', margin: 0, lineHeight: 1.6 }}>
                    Een pronostiek opent een week voor de wedstrijd en sluit een uur voor de aftrap.
                  </p>
                </div>
              </Kaart>
            )}

            {binnenkort.length > 0 && (
              <Sectie titel="Binnenkort">
                {binnenkort.slice(0, 5).map((w, i, arr) => (
                  <WedstrijdRij
                    key={w.id} w={w}
                    chip={{
                      tekst: tijdTotLabel(pronostiekOpent(w)).replace('nog ', 'over '),
                      kleur: 'var(--z-tekst-4)', bg: 'var(--z-vlak)', rand: 'var(--z-lijn)',
                    }}
                    onOpen={() => naarDetail(w)}
                    laatste={i === arr.length - 1}
                  />
                ))}
              </Sectie>
            )}

            {afgelopen.length > 0 && (
              <Sectie titel="Uitgeteld">
                {afgelopen.map((w, i) => (
                  <WedstrijdRij
                    key={w.id} w={w}
                    chip={chipVoorAfgelopen(w)}
                    onOpen={() => naarDetail(w)}
                    laatste={i === afgelopen.length - 1}
                  />
                ))}
              </Sectie>
            )}
          </div>
        )
      )}

      {/* ── Tab: klassement ────────────────────────────────────────────────── */}
      {tab === 'klassement' && (
        klassementBezig ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--z-tekst-4)' }}>Laden...</div>
        ) : rijen.length === 0 ? (
          <Kaart>
            <div style={{ padding: '30px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '30px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--z-tekst)', marginBottom: '5px' }}>
                Nog geen punten dit seizoen
              </div>
              <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', margin: 0, lineHeight: 1.6 }}>
                Het klassement verschijnt zodra de eerste voorspelde wedstrijd gespeeld is.
              </p>
            </div>
          </Kaart>
        ) : (
          <Kaart>
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 30px 30px 40px',
              padding: '10px 14px', borderBottom: '1px solid var(--z-lijn-zacht)',
              fontSize: '11px', fontWeight: '600', color: 'var(--z-tekst-4)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>#</span>
              <span>Naam</span>
              <span style={{ textAlign: 'center' }} title="Aantal voorspellingen">V</span>
              <span style={{ textAlign: 'center' }} title="Exacte scores">Ex</span>
              <span style={{ textAlign: 'center', fontWeight: '700', color: 'var(--z-tekst-3)' }}>Pnt</span>
            </div>

            {rijen.map((r, i) => {
              const ikzelf = r.user_id === user?.id
              const top3 = i < 3
              return (
                <div key={r.user_id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 30px 30px 40px',
                  padding: '13px 14px', alignItems: 'center',
                  borderBottom: i < rijen.length - 1 ? '1px solid var(--z-vlak)' : 'none',
                  background: ikzelf ? 'var(--z-blauw-50)' : 'var(--z-kaart)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {top3 ? (
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: i === 0 ? '#fbbf24' : i === 1 ? 'var(--z-tekst-4)' : 'var(--z-gelijk)',
                        color: 'white', fontSize: '11px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--z-tekst-4)', paddingLeft: '3px' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: ikzelf ? '700' : '500',
                    color: ikzelf ? ACCENT : 'var(--z-tekst)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{r.naam}{ikzelf ? ' (jij)' : ''}</span>
                  <span style={{ textAlign: 'center', fontSize: '13px', color: 'var(--z-tekst-3)' }}>{r.voorspellingen}</span>
                  <span style={{ textAlign: 'center', fontSize: '13px', color: 'var(--z-winst)', fontWeight: '600' }}>{r.exacte}</span>
                  <span style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', color: 'var(--z-tekst)' }}>{r.punten}</span>
                </div>
              )
            })}
          </Kaart>
        )
      )}

      {/* Puntenuitleg: dicht bij het openen */}
      <Kaart style={{ marginTop: '22px', background: 'var(--z-vlak)' }}>
        <div style={{ padding: '14px 16px' }}>
          <div
            onClick={() => setUitlegOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
          >
            <span style={{ flex: 1, fontSize: '11px', fontWeight: '800', color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Hoe worden de punten geteld?
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3"
              style={{ transform: uitlegOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div style={{ display: uitlegOpen ? 'flex' : 'none', flexDirection: 'column', gap: '7px', marginTop: '10px' }}>
            {PUNTEN_UITLEG.map(p => (
              <div key={p.punten} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  flexShrink: 0, width: '30px', textAlign: 'center',
                  fontSize: '12px', fontWeight: '800', color: ACCENT,
                  background: 'var(--z-kaart)', border: '1px solid var(--z-lijn)', borderRadius: '7px', padding: '2px 0',
                }}>{p.punten}</span>
                <span style={{ fontSize: '12px', color: 'var(--z-tekst-3)', lineHeight: 1.4 }}>{p.tekst}</span>
              </div>
            ))}
          </div>

          <p style={{ display: uitlegOpen ? 'block' : 'none', fontSize: '11px', color: 'var(--z-tekst-4)', margin: '10px 0 0', lineHeight: 1.5 }}>
            Enkel het hoogste telt, ze stapelen niet.
          </p>
        </div>
      </Kaart>
    </div>
  )
}
