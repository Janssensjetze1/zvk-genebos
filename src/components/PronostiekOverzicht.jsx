import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { isGespeeld } from '../lib/wedstrijd'
import Pronostiek from './Pronostiek'
import { usePronostiekKlassement, pronostiekStatus, pronostiekOpent, tijdTotLabel, PUNTEN_UITLEG } from '../hooks/usePronostiek'

// Pronostiekpagina — gedeeld door de PWA en de webapp.
// variant: 'pwa' (smallere marges) of 'desktop'
const ACCENT = '#6366f1'

function Kaart({ children, style }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

function WedstrijdTitel({ w }) {
  const datum = new Date(w.date)
  const gespeeld = isGespeeld(w)
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#fcfdff',
    }}>
      <div style={{
        width: '42px', flexShrink: 0, textAlign: 'center',
        background: '#f1f5f9', borderRadius: '9px', padding: '5px 0',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>{datum.getDate()}</div>
        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
          {datum.toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          overflow: 'hidden',
        }}>
          <span style={{
            fontSize: '14px', fontWeight: '700', color: '#0f172a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {w.home_team?.name} – {w.away_team?.name}
          </span>
          {onze && (
            <span style={{
              flexShrink: 0, fontSize: '9px', fontWeight: '800', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#1d4ed8',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '20px', padding: '2px 7px',
            }}>Onze match</span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
          {datum.toLocaleDateString('nl-BE', { weekday: 'long' })}
          {w.time ? ` · ${w.time.slice(0, 5)}` : ''}
        </div>
      </div>
      {gespeeld && (
        <span style={{
          flexShrink: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a',
          background: '#f1f5f9', borderRadius: '9px', padding: '4px 11px',
          fontVariantNumeric: 'tabular-nums',
        }}>{w.home_score}–{w.away_score}</span>
      )}
    </div>
  )
}

export default function PronostiekOverzicht({ variant = 'pwa' }) {
  const compact = variant === 'pwa'
  const { user } = useAuth()
  const { actief: seizoen } = useSeason()
  const { rijen, loading: klassementBezig } = usePronostiekKlassement(seizoen?.id)
  const [wedstrijden, setWedstrijden] = useState([])
  const [laden, setLaden] = useState(true)
  const [tab, setTab] = useState('wedstrijden')
  const [uitlegOpen, setUitlegOpen] = useState(false)

  useEffect(() => {
    let actief = true

    async function haalWedstrijden(seizoenId) {
      setLaden(true)
      const { data } = await supabase
        .from('matches')
        .select('id, date, time, home_score, away_score, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), match_players(player_id), goals(id)')
        .eq('season_id', seizoenId)
        .order('date', { ascending: true })
      if (!actief) return
      // Alle wedstrijden van het seizoen, ook die van tegenstanders onderling
      setWedstrijden(data ?? [])
      setLaden(false)
    }

    if (seizoen?.id) haalWedstrijden(seizoen.id)
    return () => { actief = false }
  }, [seizoen?.id])

  const open      = wedstrijden.filter(w => pronostiekStatus(w) === 'open' && !isGespeeld(w))
  const binnenkort = wedstrijden.filter(w => pronostiekStatus(w) === 'nog-niet' && !isGespeeld(w))
  const afgelopen = wedstrijden.filter(w => isGespeeld(w)).slice().reverse().slice(0, 8)

  const mijnPlaats = rijen.findIndex(r => r.user_id === user?.id)
  const mijnRij    = mijnPlaats >= 0 ? rijen[mijnPlaats] : null

  const buiten = compact ? '20px 16px' : '0'

  return (
    <div style={{ padding: buiten, maxWidth: compact ? 'none' : '760px' }}>
      <h1 style={{ fontSize: compact ? '20px' : '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>
        Pronostiek
      </h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px' }}>
        {seizoen?.name} · voorspel elke wedstrijd, verdien punten
      </p>

      {/* Jouw stand */}
      {mijnRij && (
        <Kaart style={{ marginBottom: '16px', background: ACCENT, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '17px', fontWeight: '800', color: 'white',
            }}>{mijnPlaats + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Jouw plaats</div>
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
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[['wedstrijden', `Wedstrijden${open.length ? ` (${open.length})` : ''}`], ['klassement', 'Klassement']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: compact ? 1 : '0 0 auto',
              padding: compact ? '10px 8px' : '9px 18px',
              borderRadius: '10px', cursor: 'pointer',
              border: `1px solid ${tab === id ? ACCENT : '#e2e8f0'}`,
              background: tab === id ? ACCENT : 'white',
              color: tab === id ? 'white' : '#64748b',
              fontSize: '13px', fontWeight: '700',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Tab: wedstrijden ───────────────────────────────────────────────── */}
      {tab === 'wedstrijden' && (
        laden ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {open.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                  Nu te voorspellen
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {open.map(w => (
                    <Kaart key={w.id}>
                      <WedstrijdTitel w={w} />
                      <div style={{ padding: '14px 16px' }}>
                        <Pronostiek wedstrijd={w} standaardOpen />
                      </div>
                    </Kaart>
                  ))}
                </div>
              </section>
            )}

            {open.length === 0 && (
              <Kaart>
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '34px', marginBottom: '10px' }}>🔮</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    Momenteel niets te voorspellen
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                    De pronostiek van een wedstrijd opent een week op voorhand en sluit een uur voor de aftrap.
                  </p>
                </div>
              </Kaart>
            )}

            {binnenkort.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                  Binnenkort
                </h2>
                <Kaart>
                  {binnenkort.slice(0, 5).map((w, i) => (
                    <div key={w.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px',
                      borderBottom: i < Math.min(binnenkort.length, 5) - 1 ? '1px solid #f8fafc' : 'none',
                    }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.home_team?.name} – {w.away_team?.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                        opent {tijdTotLabel(pronostiekOpent(w)).replace('nog ', 'over ')}
                      </span>
                    </div>
                  ))}
                </Kaart>
              </section>
            )}

            {afgelopen.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                  Uitgeteld
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {afgelopen.map(w => (
                    <Kaart key={w.id}>
                      <WedstrijdTitel w={w} />
                      <div style={{ padding: '14px 16px' }}>
                        <Pronostiek wedstrijd={w} />
                      </div>
                    </Kaart>
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      )}

      {/* ── Tab: klassement ────────────────────────────────────────────────── */}
      {tab === 'klassement' && (
        klassementBezig ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
        ) : rijen.length === 0 ? (
          <Kaart>
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '34px', marginBottom: '10px' }}>🏆</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                Nog geen punten dit seizoen
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Zodra de eerste voorspelde wedstrijd gespeeld is, verschijnt hier het klassement.
              </p>
            </div>
          </Kaart>
        ) : (
          <Kaart>
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 30px 30px 40px',
              padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
              fontSize: '11px', fontWeight: '600', color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>#</span>
              <span>Naam</span>
              <span style={{ textAlign: 'center' }} title="Aantal voorspellingen">V</span>
              <span style={{ textAlign: 'center' }} title="Exacte scores">Ex</span>
              <span style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>Pnt</span>
            </div>

            {rijen.map((r, i) => {
              const ikzelf = r.user_id === user?.id
              const top3 = i < 3
              return (
                <div key={r.user_id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 30px 30px 40px',
                  padding: '13px 14px', alignItems: 'center',
                  borderBottom: i < rijen.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: ikzelf ? '#eef2ff' : 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {top3 ? (
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#b45309',
                        color: 'white', fontSize: '11px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '3px' }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '14px', fontWeight: ikzelf ? '700' : '500',
                    color: ikzelf ? ACCENT : '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{r.naam}{ikzelf ? ' (jij)' : ''}</span>
                  <span style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{r.voorspellingen}</span>
                  <span style={{ textAlign: 'center', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{r.exacte}</span>
                  <span style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{r.punten}</span>
                </div>
              )
            })}
          </Kaart>
        )
      )}

      {/* Puntenuitleg — ingeklapt, je leest ze één keer */}
      <Kaart style={{ marginTop: '22px', background: '#f8fafc' }}>
        <div style={{ padding: '14px 16px' }}>
          <div
            onClick={() => setUitlegOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span style={{ flex: 1, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '2px 0',
                }}>{p.punten}</span>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{p.tekst}</span>
              </div>
            ))}
          </div>
          <p style={{ display: uitlegOpen ? 'block' : 'none', fontSize: '11px', color: '#94a3b8', margin: '10px 0 0', lineHeight: 1.5 }}>
            Enkel het hoogste dat van toepassing is telt. Voorspellen kan van een week voor de wedstrijd tot een uur
            voor de aftrap, en je mag tot dan zoveel aanpassen als je wil.
          </p>
        </div>
      </Kaart>
    </div>
  )
}
