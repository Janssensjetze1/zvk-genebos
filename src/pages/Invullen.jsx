import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }

export default function Invullen() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [spelers, setSpelers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [geselecteerd, setGeselecteerd] = useState(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => { if (seizoen) fetchAlles() }, [seizoen])

  async function fetchAlles() {
    setLoading(true)
    const [{ data: wData }, { data: sData }, { data: tData }] = await Promise.all([
      supabase.from('matches').select(`
        *,
        home_team:home_team_id(id, name, is_zvk),
        away_team:away_team_id(id, name, is_zvk),
        match_players(player_id),
        goals(id, scorer_id, assist_id, minute, scorer:scorer_id(name), assist:assist_id(name))
      `).eq('season_id', seizoen.id).order('date', { ascending: false }),
      supabase.from('players').select('*').order('name'),
      supabase.from('teams').select('*'),
    ])
    const zvkWedstrijden = (wData ?? []).filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
    setWedstrijden(zvkWedstrijden)
    setSpelers(sData ?? [])
    setTeams(tData ?? [])
    setLoading(false)
  }

  const zvkTeam = teams.find(t => t.is_zvk)

  if (!seizoen) return (
    <div style={emptyStijl}>
      <p style={{ color: '#64748b', fontSize: '15px' }}>Geen actief seizoen gevonden.</p>
    </div>
  )

  if (loading) return (
    <div style={emptyStijl}>
      <div style={spinnerStijl} />
    </div>
  )

  if (geselecteerd) return (
    <WedstrijdInvullen
      wedstrijd={geselecteerd}
      zvkTeam={zvkTeam}
      spelers={spelers}
      onTerug={() => { setGeselecteerd(null); setOpgeslagen(false) }}
      onOpgeslagen={() => { setOpgeslagen(true); fetchAlles(); setGeselecteerd(null) }}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '20px 20px 16px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <img src="/logo.png" alt="ZVK" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Wedstrijden invullen</h1>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{seizoen.name}</p>
      </div>

      {opgeslagen && (
        <div style={{
          margin: '16px 16px 0', background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>✅</span>
          <p style={{ fontSize: '14px', color: '#16a34a', margin: 0, fontWeight: '500' }}>Wedstrijdblad opgeslagen!</p>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {wedstrijden.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Geen wedstrijden gevonden.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wedstrijden.map(w => (
              <WedstrijdKaart
                key={w.id}
                wedstrijd={w}
                zvkTeam={zvkTeam}
                onSelecteer={() => setGeselecteerd(w)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WedstrijdKaart({ wedstrijd: w, zvkTeam, onSelecteer }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const ingevuld = w.match_players?.length > 0 || w.goals?.length > 0
  const isPast = new Date(w.date) <= new Date()
  const gewonnen = zvkScore > tegScore
  const verloren = zvkScore < tegScore
  const datum = new Date(w.date)

  return (
    <button
      onClick={onSelecteer}
      style={{
        width: '100%', background: 'white', border: `1.5px solid ${ingevuld ? '#bbf7d0' : isPast ? '#fecaca' : '#e2e8f0'}`,
        borderRadius: '16px', padding: '16px', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Datum blok */}
      <div style={{
        width: '48px', flexShrink: 0, textAlign: 'center',
        background: '#f8fafc', borderRadius: '10px', padding: '8px 4px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
          {datum.getDate()}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
          {datum.toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {zvkTeam?.name} vs {tegenstander?.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
            background: '#eff6ff', color: '#1d4ed8',
          }}>{TYPE_LABELS[w.type]}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isThuis ? 'Thuis' : 'Uit'}</span>
        </div>
      </div>

      {/* Rechts: status of score */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {isPast ? (
          <>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              {zvkScore} – {tegScore}
            </div>
            <div style={{
              fontSize: '11px', fontWeight: '700', marginTop: '2px',
              color: gewonnen ? '#16a34a' : verloren ? '#ef4444' : '#64748b',
            }}>
              {gewonnen ? 'Gewonnen' : verloren ? 'Verloren' : 'Gelijkspel'}
            </div>
          </>
        ) : (
          <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px' }}>
            Gepland
          </span>
        )}
        <div style={{ marginTop: '4px' }}>
          {ingevuld
            ? <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✓ Ingevuld</span>
            : isPast ? <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>Nog invullen</span>
            : null
          }
        </div>
      </div>

      <svg width="16" height="16" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function WedstrijdInvullen({ wedstrijd: w, zvkTeam, spelers, onTerug, onOpgeslagen }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team

  const [stap, setStap] = useState(1)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  const [zvkScore, setZvkScore] = useState(isThuis ? w.home_score : w.away_score)
  const [tegScore, setTegScore] = useState(isThuis ? w.away_score : w.home_score)
  const [aanwezig, setAanwezig] = useState(new Set(w.match_players.map(mp => mp.player_id)))
  const [doelpunten, setDoelpunten] = useState(
    w.goals.map(g => ({ id: g.id, scorerId: g.scorer_id, assistId: g.assist_id ?? '', minuut: g.minute ?? '' }))
  )

  const aanwezigeLijst = spelers.filter(s => aanwezig.has(s.id))

  function toggleAanwezig(id) {
    setAanwezig(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleOpslaan() {
    setFout(''); setOpslaan(true)
    const homeScore = isThuis ? zvkScore : tegScore
    const awayScore = isThuis ? tegScore : zvkScore

    const { error } = await supabase.from('matches').update({ home_score: homeScore, away_score: awayScore }).eq('id', w.id)
    if (error) { setFout('Opslaan mislukt.'); setOpslaan(false); return }

    await supabase.from('match_players').delete().eq('match_id', w.id)
    if (aanwezig.size > 0) {
      await supabase.from('match_players').insert([...aanwezig].map(pid => ({ match_id: w.id, player_id: pid })))
    }

    await supabase.from('goals').delete().eq('match_id', w.id)
    const geldig = doelpunten.filter(d => d.scorerId)
    if (geldig.length > 0) {
      await supabase.from('goals').insert(geldig.map(d => ({
        match_id: w.id, scorer_id: d.scorerId,
        assist_id: d.assistId || null,
        minute: d.minuut ? parseInt(d.minuut) : null,
      })))
    }

    setOpslaan(false)
    onOpgeslagen()
  }

  const datum = new Date(w.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 20px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onTerug} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', padding: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Terug
        </button>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
          {zvkTeam?.name} vs {tegenstander?.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', textTransform: 'capitalize' }}>
          {datum} · {isThuis ? 'Thuis' : 'Uit'}
        </div>

        {/* Stap indicator */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {['Uitslag & Spelers', 'Doelpunten'].map((label, i) => {
            const nr = i + 1
            const actief = stap === nr
            const klaar = stap > nr
            return (
              <button key={nr} onClick={() => setStap(nr)} style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: actief ? 'white' : klaar ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                color: actief ? '#0f172a' : 'rgba(255,255,255,0.7)',
                fontSize: '12px', fontWeight: actief ? '700' : '500',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: actief ? '#0f172a' : klaar ? '#22c55e' : 'rgba(255,255,255,0.2)',
                  color: 'white', fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {klaar ? '✓' : nr}
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {stap === 1 && (
          <>
            {/* Score */}
            <div style={kaartStijl}>
              <p style={sectieTitelStijl}>Eindstand</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '600' }}>{zvkTeam?.name ?? 'ZVK'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setZvkScore(s => Math.max(0, s - 1))} style={scoreKnopStijl}>−</button>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', width: '48px', textAlign: 'center' }}>{zvkScore}</div>
                    <button onClick={() => setZvkScore(s => s + 1)} style={scoreKnopStijl}>+</button>
                  </div>
                </div>
                <span style={{ fontSize: '28px', color: '#e2e8f0', marginTop: '22px' }}>–</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tegenstander?.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setTegScore(s => Math.max(0, s - 1))} style={scoreKnopStijl}>−</button>
                    <div style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', width: '48px', textAlign: 'center' }}>{tegScore}</div>
                    <button onClick={() => setTegScore(s => s + 1)} style={scoreKnopStijl}>+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Aanwezigheid */}
            <div style={kaartStijl}>
              <p style={sectieTitelStijl}>Wie speelde mee? <span style={{ color: '#94a3b8', fontWeight: '400' }}>({aanwezig.size})</span></p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {spelers.map(s => {
                  const ok = aanwezig.has(s.id)
                  return (
                    <button key={s.id} onClick={() => toggleAanwezig(s.id)} style={{
                      padding: '9px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px',
                      fontWeight: '500', border: 'none',
                      background: ok ? '#0f172a' : '#f1f5f9',
                      color: ok ? 'white' : '#475569',
                    }}>
                      {ok ? '✓ ' : ''}{s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <button onClick={() => setStap(2)} style={hoofdKnopStijl}>
              Volgende: Doelpunten →
            </button>
          </>
        )}

        {stap === 2 && (
          <>
            <div style={kaartStijl}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <p style={{ ...sectieTitelStijl, margin: 0 }}>Doelpunten ZVK</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>{zvkScore} – {tegScore}</p>
                </div>
                <button
                  onClick={() => setDoelpunten(prev => [...prev, { id: null, scorerId: '', assistId: '', minuut: '' }])}
                  style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  + Toevoegen
                </button>
              </div>

              {doelpunten.length === 0 && (
                <div style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Geen doelpunten</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {doelpunten.map((d, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px' }}>⚽ Doelpunt {idx + 1}</span>
                      <button onClick={() => setDoelpunten(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8', padding: '0 4px' }}>×</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={labelStijl}>Scorer *</label>
                        <select value={d.scorerId} onChange={e => setDoelpunten(prev => prev.map((x, i) => i === idx ? { ...x, scorerId: e.target.value } : x))} style={selectStijl}>
                          <option value="">— Kies speler —</option>
                          {(aanwezigeLijst.length > 0 ? aanwezigeLijst : spelers).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStijl}>Assist (optioneel)</label>
                        <select value={d.assistId} onChange={e => setDoelpunten(prev => prev.map((x, i) => i === idx ? { ...x, assistId: e.target.value } : x))} style={selectStijl}>
                          <option value="">— Geen assist —</option>
                          {(aanwezigeLijst.length > 0 ? aanwezigeLijst : spelers).filter(s => s.id !== d.scorerId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {fout && <p style={{ fontSize: '14px', color: '#ef4444', textAlign: 'center' }}>{fout}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStap(1)} style={secundairKnopStijl}>← Vorige</button>
              <button onClick={handleOpslaan} disabled={opslaan} style={{ ...hoofdKnopStijl, flex: 1, opacity: opslaan ? 0.6 : 1 }}>
                {opslaan ? 'Opslaan...' : '✓ Opslaan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────

const emptyStijl = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const spinnerStijl = { width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
const kaartStijl = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }
const sectieTitelStijl = { fontSize: '13px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }
const labelStijl = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }
const selectStijl = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '11px 12px', fontSize: '15px', color: '#0f172a', background: 'white', outline: 'none', boxSizing: 'border-box' }
const scoreKnopStijl = { width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '20px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '300' }
const hoofdKnopStijl = { background: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%' }
const secundairKnopStijl = { background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
