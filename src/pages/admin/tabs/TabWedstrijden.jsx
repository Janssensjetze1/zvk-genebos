import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useSeason } from '../../../context/SeasonContext'

const TYPES = ['competitie', 'beker', 'vriendschappelijk']
const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}

export default function TabWedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [teams, setTeams] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [toonAndere, setToonAndere] = useState(false)
  const [bewerkWedstrijd, setBewerkWedstrijd] = useState(null)
  const [bewerkAndere, setBewerkAndere] = useState(null)
  const [wedstrijdblad, setWedstrijdblad] = useState(null)

  useEffect(() => { fetchAlles() }, [seizoen])

  async function fetchAlles() {
    setLoading(true)
    const [{ data: wData }, { data: tData }, { data: sData }] = await Promise.all([
      seizoen
        ? supabase.from('matches').select(`
            *,
            home_team:home_team_id(id, name, is_zvk),
            away_team:away_team_id(id, name, is_zvk),
            match_players(player_id),
            goals(id, scorer_id, assist_id, minute, scorer:scorer_id(name), assist:assist_id(name))
          `).eq('season_id', seizoen.id).order('date', { ascending: false })
        : { data: [] },
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*').order('name'),
    ])
    setWedstrijden(wData ?? [])
    setTeams(tData ?? [])
    setSpelers(sData ?? [])
    setLoading(false)
  }

  const zvkTeam = teams.find(t => t.is_zvk)
  const tegenstanders = teams.filter(t => !t.is_zvk)
  const zvkWedstrijden = wedstrijden.filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
  const andereWedstrijden = wedstrijden.filter(w => !w.home_team?.is_zvk && !w.away_team?.is_zvk)

  if (!seizoen) return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: '#94a3b8' }}>Selecteer eerst een seizoen via Beheer → Seizoenen.</p>
    </div>
  )

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{wedstrijden.length} wedstrijd{wedstrijden.length !== 1 ? 'en' : ''} in {seizoen.name}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setToonAndere(true); setToonFormulier(false); setBewerkWedstrijd(null); setBewerkAndere(null); setWedstrijdblad(null) }}
            style={{ background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
          >
            + Andere wedstrijd
          </button>
          <button
            onClick={() => { setToonFormulier(true); setToonAndere(false); setBewerkWedstrijd(null); setBewerkAndere(null); setWedstrijdblad(null) }}
            style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            + ZVK wedstrijd plannen
          </button>
        </div>
      </div>

      {/* Nieuw wedstrijd formulier (enkel basisinfo) */}
      {toonFormulier && (
        <NieuweWedstrijd
          seizoenId={seizoen.id}
          zvkTeam={zvkTeam}
          tegenstanders={tegenstanders}
          onSluiten={() => setToonFormulier(false)}
          onOpgeslagen={() => { setToonFormulier(false); fetchAlles() }}
        />
      )}

      {/* Wedstrijd bewerken (basisinfo) */}
      {bewerkWedstrijd && !wedstrijdblad && (
        <NieuweWedstrijd
          seizoenId={seizoen.id}
          zvkTeam={zvkTeam}
          tegenstanders={tegenstanders}
          wedstrijd={bewerkWedstrijd}
          onSluiten={() => setBewerkWedstrijd(null)}
          onOpgeslagen={() => { setBewerkWedstrijd(null); fetchAlles() }}
        />
      )}

      {/* Andere wedstrijd formulier */}
      {(toonAndere || bewerkAndere) && (
        <AndereWedstrijd
          seizoenId={seizoen.id}
          teams={tegenstanders}
          wedstrijd={bewerkAndere}
          onSluiten={() => { setToonAndere(false); setBewerkAndere(null) }}
          onOpgeslagen={() => { setToonAndere(false); setBewerkAndere(null); fetchAlles() }}
        />
      )}

      {/* Wedstrijdblad */}
      {wedstrijdblad && (
        <Wedstrijdblad
          wedstrijd={wedstrijdblad}
          zvkTeam={zvkTeam}
          tegenstanders={tegenstanders}
          spelers={spelers}
          onSluiten={() => setWedstrijdblad(null)}
          onOpgeslagen={() => { setWedstrijdblad(null); fetchAlles() }}
        />
      )}

      {/* ZVK wedstrijden */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          ZVK Wedstrijden
        </h2>
        {zvkWedstrijden.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen wedstrijden. Plan de eerste!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {zvkWedstrijden.map(w => (
              <WedstrijdKaart
                key={w.id}
                wedstrijd={w}
                zvkTeam={zvkTeam}
                spelers={spelers}
                actief={bewerkWedstrijd?.id === w.id || wedstrijdblad?.id === w.id}
                onBewerken={() => { setBewerkWedstrijd(w); setWedstrijdblad(null); setToonFormulier(false); setToonAndere(false); setBewerkAndere(null) }}
                onWedstrijdblad={() => { setWedstrijdblad(w); setBewerkWedstrijd(null); setToonFormulier(false); setToonAndere(false); setBewerkAndere(null) }}
                onVerwijderen={async () => {
                  if (!confirm('Wedstrijd verwijderen?')) return
                  await supabase.from('matches').delete().eq('id', w.id)
                  fetchAlles()
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Andere wedstrijden */}
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Andere Wedstrijden
          <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8', textTransform: 'none', marginLeft: '8px', letterSpacing: 0 }}>
            — voor het klassement
          </span>
        </h2>
        {andereWedstrijden.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen andere wedstrijden ingegeven.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {andereWedstrijden.map(w => (
              <AndereWedstrijdKaart
                key={w.id}
                wedstrijd={w}
                actief={bewerkAndere?.id === w.id}
                onBewerken={() => { setBewerkAndere(w); setToonAndere(false); setToonFormulier(false); setBewerkWedstrijd(null); setWedstrijdblad(null) }}
                onVerwijderen={async () => {
                  if (!confirm('Wedstrijd verwijderen?')) return
                  await supabase.from('matches').delete().eq('id', w.id)
                  fetchAlles()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nieuwe wedstrijd (alleen basisinfo) ─────────────────────────────────────

function NieuweWedstrijd({ seizoenId, zvkTeam, tegenstanders, wedstrijd, onSluiten, onOpgeslagen }) {
  const isBewerk = !!wedstrijd
  const isThuis = isBewerk ? wedstrijd.home_team?.is_zvk : true
  const tegenstander = isBewerk ? (isThuis ? wedstrijd.away_team : wedstrijd.home_team) : null

  const [datum, setDatum] = useState(isBewerk ? wedstrijd.date : '')
  const [type, setType] = useState(isBewerk ? wedstrijd.type : 'competitie')
  const [tegenstanderId, setTegenstanderId] = useState(tegenstander?.id ?? '')
  const [thuis, setThuis] = useState(isThuis)
  const [locatie, setLocatie] = useState(isBewerk ? (wedstrijd.location ?? '') : '')
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!tegenstanderId) { setFout('Kies een tegenstander.'); return }
    setFout(''); setOpslaan(true)

    const teg = tegenstanders.find(t => t.id === tegenstanderId)
    const homeTeamId = thuis ? zvkTeam.id : teg.id
    const awayTeamId = thuis ? teg.id : zvkTeam.id

    if (isBewerk) {
      const { error } = await supabase.from('matches').update({
        date: datum, type, location: locatie || null,
        home_team_id: homeTeamId, away_team_id: awayTeamId,
      }).eq('id', wedstrijd.id)
      setOpslaan(false)
      if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    } else {
      const { error } = await supabase.from('matches').insert({
        season_id: seizoenId, date: datum, type, location: locatie || null,
        home_team_id: homeTeamId, away_team_id: awayTeamId,
        home_score: 0, away_score: 0,
      })
      setOpslaan(false)
      if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    }
    onOpgeslagen()
  }

  return (
    <form onSubmit={handleOpslaan} style={{
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
      padding: '20px 24px', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
          {isBewerk ? 'Wedstrijd bewerken' : 'Wedstrijd plannen'}
        </h3>
        <button type="button" onClick={onSluiten} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px' }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={labelStijl}>Datum *</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)} required style={inputStijl} />
          </div>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={labelStijl}>Tegenstander *</label>
            <select value={tegenstanderId} onChange={e => setTegenstanderId(e.target.value)} style={inputStijl}>
              <option value="">— Kies tegenstander —</option>
              {tegenstanders.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={labelStijl}>Locatie (optioneel)</label>
            <input type="text" value={locatie} onChange={e => setLocatie(e.target.value)} placeholder="bv. Sporthal De Brug" style={inputStijl} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStijl}>Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {TYPES.map(t => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', border: 'none',
                  background: type === t ? TYPE_COLORS[t].bg : '#f1f5f9',
                  color: type === t ? TYPE_COLORS[t].color : '#64748b',
                  outline: type === t ? `2px solid ${TYPE_COLORS[t].color}` : 'none',
                  outlineOffset: '1px',
                }}>{TYPE_LABELS[t]}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStijl}>Thuis of Uit?</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[true, false].map(isT => (
                <button key={String(isT)} type="button" onClick={() => setThuis(isT)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', border: 'none',
                  background: thuis === isT ? '#0f172a' : '#f1f5f9',
                  color: thuis === isT ? 'white' : '#64748b',
                }}>{isT ? '🏠 Thuis' : '✈️ Uit'}</button>
              ))}
            </div>
          </div>
        </div>

        {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={opslaan} style={knopStijl(opslaan)}>
            {opslaan ? 'Opslaan...' : isBewerk ? 'Wijzigingen opslaan' : 'Wedstrijd plannen'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Wedstrijdblad (score + spelers + doelpunten) ────────────────────────────

function Wedstrijdblad({ wedstrijd: w, zvkTeam, tegenstanders, spelers, onSluiten, onOpgeslagen }) {
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
    if (error) { setFout('Opslaan mislukt: ' + error.message); setOpslaan(false); return }

    await supabase.from('match_players').delete().eq('match_id', w.id)
    if (aanwezig.size > 0) {
      await supabase.from('match_players').insert([...aanwezig].map(pid => ({ match_id: w.id, player_id: pid })))
    }

    await supabase.from('goals').delete().eq('match_id', w.id)
    const geldig = doelpunten.filter(d => d.scorerId)
    if (geldig.length > 0) {
      await supabase.from('goals').insert(geldig.map(d => ({
        match_id: w.id,
        scorer_id: d.scorerId,
        assist_id: d.assistId || null,
        minute: d.minuut ? parseInt(d.minuut) : null,
      })))
    }

    setOpslaan(false)
    onOpgeslagen()
  }

  const datum = new Date(w.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{
      background: 'white', border: '2px solid #0f172a', borderRadius: '14px',
      marginBottom: '20px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Wedstrijdblad
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
            {zvkTeam?.name} vs {tegenstander?.name}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', textTransform: 'capitalize' }}>
            {datum} · {isThuis ? 'Thuis' : 'Uit'} · {TYPE_LABELS[w.type]}
          </div>
        </div>
        <button onClick={onSluiten} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      {/* Stapper */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
        {['Uitslag & Spelers', 'Doelpunten'].map((label, i) => {
          const nr = i + 1
          const actief = stap === nr
          const klaar = stap > nr
          return (
            <button
              key={nr}
              onClick={() => setStap(nr)}
              style={{
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                background: actief ? 'white' : '#f8fafc',
                borderBottom: actief ? '2px solid #0f172a' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: klaar ? '#0f172a' : actief ? '#0f172a' : '#e2e8f0',
                color: klaar || actief ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', flexShrink: 0,
              }}>
                {klaar ? '✓' : nr}
              </div>
              <span style={{ fontSize: '13px', fontWeight: actief ? '600' : '400', color: actief ? '#0f172a' : '#94a3b8' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '24px' }}>
        {/* Stap 1 */}
        {stap === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Score */}
            <div>
              <label style={labelStijl}>Eindstand</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>{zvkTeam?.name ?? 'ZVK'}</div>
                  <input
                    type="number" min="0" value={zvkScore}
                    onChange={e => setZvkScore(parseInt(e.target.value) || 0)}
                    style={{ ...inputStijl, width: '80px', textAlign: 'center', fontSize: '28px', fontWeight: '800', padding: '12px 8px' }}
                  />
                </div>
                <span style={{ fontSize: '24px', color: '#e2e8f0', marginTop: '22px' }}>–</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>{tegenstander?.name}</div>
                  <input
                    type="number" min="0" value={tegScore}
                    onChange={e => setTegScore(parseInt(e.target.value) || 0)}
                    style={{ ...inputStijl, width: '80px', textAlign: 'center', fontSize: '28px', fontWeight: '800', padding: '12px 8px' }}
                  />
                </div>
              </div>
            </div>

            {/* Spelers */}
            <div>
              <label style={{ ...labelStijl, marginBottom: '10px' }}>
                Wie speelde mee? <span style={{ color: '#94a3b8', fontWeight: '400' }}>({aanwezig.size} geselecteerd)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {spelers.map(s => {
                  const ok = aanwezig.has(s.id)
                  return (
                    <button key={s.id} type="button" onClick={() => toggleAanwezig(s.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '20px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '500', border: 'none',
                      background: ok ? '#0f172a' : '#f1f5f9',
                      color: ok ? 'white' : '#475569',
                      transition: 'all 0.12s',
                    }}>
                      {ok && <span style={{ fontSize: '10px' }}>✓</span>}
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setStap(2)} style={knopStijl(false)}>Volgende: Doelpunten →</button>
            </div>
          </div>
        )}

        {/* Stap 2 */}
        {stap === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ ...labelStijl, marginBottom: '2px' }}>Doelpunten ZVK</label>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Score ZVK: {zvkScore} — Tegenstander: {tegScore}</p>
              </div>
              <button
                type="button"
                onClick={() => setDoelpunten(prev => [...prev, { id: null, scorerId: '', assistId: '', minuut: '' }])}
                style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + Doelpunt toevoegen
              </button>
            </div>

            {doelpunten.length === 0 && (
              <div style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Nog geen doelpunten. Klik "+ Doelpunt toevoegen" om te starten.</p>
              </div>
            )}

            {doelpunten.map((d, idx) => (
              <div key={idx} style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: '22px', paddingBottom: '8px', flexShrink: 0 }}>⚽</div>
                <div style={{ flex: 2, minWidth: '140px' }}>
                  <label style={labelStijl}>Doelpuntenmaker *</label>
                  <select value={d.scorerId} onChange={e => setDoelpunten(prev => prev.map((x, i) => i === idx ? { ...x, scorerId: e.target.value } : x))} style={inputStijl}>
                    <option value="">— Kies speler —</option>
                    {(aanwezigeLijst.length > 0 ? aanwezigeLijst : spelers).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2, minWidth: '140px' }}>
                  <label style={labelStijl}>Assist (optioneel)</label>
                  <select value={d.assistId} onChange={e => setDoelpunten(prev => prev.map((x, i) => i === idx ? { ...x, assistId: e.target.value } : x))} style={inputStijl}>
                    <option value="">— Geen assist —</option>
                    {(aanwezigeLijst.length > 0 ? aanwezigeLijst : spelers).filter(s => s.id !== d.scorerId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ width: '72px' }}>
                  <label style={labelStijl}>Minuut</label>
                  <input type="number" min="1" max="120" value={d.minuut}
                    onChange={e => setDoelpunten(prev => prev.map((x, i) => i === idx ? { ...x, minuut: e.target.value } : x))}
                    placeholder="—" style={{ ...inputStijl, textAlign: 'center' }} />
                </div>
                <button
                  type="button"
                  onClick={() => setDoelpunten(prev => prev.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '20px', padding: '0 4px', paddingBottom: '8px' }}
                  onMouseEnter={e => e.target.style.color = '#ef4444'}
                  onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                >×</button>
              </div>
            ))}

            {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <button type="button" onClick={() => setStap(1)} style={knopSecundairStijl}>← Vorige</button>
              <button onClick={handleOpslaan} disabled={opslaan} style={knopStijl(opslaan)}>
                {opslaan ? 'Opslaan...' : 'Wedstrijdblad opslaan ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Wedstrijd kaart ─────────────────────────────────────────────────────────

function WedstrijdKaart({ wedstrijd: w, zvkTeam, spelers, actief, onBewerken, onWedstrijdblad, onVerwijderen }) {
  const [open, setOpen] = useState(false)
  const isThuis = w.home_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const tegenstander = isThuis ? w.away_team : w.home_team
  const isPast = new Date(w.date) <= new Date()
  const heeftData = w.match_players?.length > 0 || w.goals?.length > 0
  const gewonnen = zvkScore > tegScore
  const verloren = zvkScore < tegScore
  const resultaatKleur = gewonnen ? '#16a34a' : verloren ? '#ef4444' : '#64748b'
  const resultaatLabel = gewonnen ? 'W' : verloren ? 'V' : 'G'

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${actief ? '#93c5fd' : '#e2e8f0'}`,
      borderRadius: '10px', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Datum */}
        <div style={{ width: '44px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>
            {new Date(w.date).getDate()}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
            {new Date(w.date).toLocaleDateString('nl-BE', { month: 'short' })}
          </div>
        </div>

        <div style={{ width: '1px', height: '32px', background: '#f1f5f9', flexShrink: 0 }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {zvkTeam?.name} {isThuis ? '' : '(uit)'} vs {tegenstander?.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '10px',
              background: TYPE_COLORS[w.type]?.bg, color: TYPE_COLORS[w.type]?.color,
            }}>{TYPE_LABELS[w.type]}</span>
            {w.location && <span style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {w.location}</span>}
          </div>
        </div>

        {/* Score of gepland */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPast ? (
            <>
              <div style={{
                fontSize: '16px', fontWeight: '700', color: '#0f172a',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '4px 12px', lineHeight: 1.5,
              }}>
                {zvkScore} – {tegScore}
              </div>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: resultaatKleur, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700',
              }}>{resultaatLabel}</div>
            </>
          ) : (
            <span style={{
              fontSize: '12px', fontWeight: '500', color: '#64748b',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '4px 10px',
            }}>Gepland</span>
          )}
        </div>

        {/* Acties */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {/* Wedstrijdblad knop — prominent als nog niet ingevuld */}
          <button
            onClick={onWedstrijdblad}
            title="Wedstrijdblad invullen"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: heeftData ? 'white' : '#0f172a',
              color: heeftData ? '#475569' : 'white',
              border: heeftData ? '1px solid #e2e8f0' : 'none',
              borderRadius: '7px', padding: '5px 12px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {heeftData ? 'Blad bewerken' : 'Invullen'}
          </button>
          <button
            onClick={onBewerken}
            title="Wedstrijd bewerken"
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}
          >
            ✎
          </button>
          <button
            onClick={onVerwijderen}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '5px 8px', borderRadius: '7px' }}
            onMouseEnter={e => e.target.style.color = '#ef4444'}
            onMouseLeave={e => e.target.style.color = '#cbd5e1'}
          >✕</button>
        </div>

        <svg
          onClick={() => setOpen(v => !v)}
          width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
          style={{ flexShrink: 0, cursor: 'pointer', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Detail uitklappen */}
      {open && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', background: '#fafafa', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doelpunten ZVK</p>
            {w.goals?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {w.goals.map(g => (
                  <div key={g.id} style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚽</span>
                    <span style={{ fontWeight: '500' }}>{g.scorer?.name}</span>
                    {g.assist && <span style={{ color: '#94a3b8' }}>({g.assist.name})</span>}
                    {g.minute && <span style={{ color: '#94a3b8', fontSize: '12px' }}>{g.minute}'</span>}
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '13px', color: '#94a3b8' }}>Nog niet ingevuld.</p>}
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aanwezige spelers</p>
            {w.match_players?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {w.match_players.map(mp => {
                  const s = spelers.find(x => x.id === mp.player_id)
                  return s ? <span key={mp.player_id} style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', background: '#f1f5f9', color: '#475569' }}>{s.name}</span> : null
                })}
              </div>
            ) : <p style={{ fontSize: '13px', color: '#94a3b8' }}>Nog niet ingevuld.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Andere wedstrijd (score only) ───────────────────────────────────────────

function AndereWedstrijd({ seizoenId, teams, wedstrijd, onSluiten, onOpgeslagen }) {
  const isBewerk = !!wedstrijd
  const [datum, setDatum] = useState(isBewerk ? wedstrijd.date : '')
  const [type, setType] = useState(isBewerk ? wedstrijd.type : 'competitie')
  const [thuisId, setThuisId] = useState(isBewerk ? wedstrijd.home_team_id : '')
  const [uitId, setUitId] = useState(isBewerk ? wedstrijd.away_team_id : '')
  const [thuisScore, setThuisScore] = useState(isBewerk ? wedstrijd.home_score : 0)
  const [uitScore, setUitScore] = useState(isBewerk ? wedstrijd.away_score : 0)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!thuisId || !uitId) { setFout('Kies beide teams.'); return }
    if (thuisId === uitId) { setFout('Thuis- en uitteam moeten verschillend zijn.'); return }
    setFout(''); setOpslaan(true)

    if (isBewerk) {
      const { error } = await supabase.from('matches').update({
        date: datum, type, home_team_id: thuisId, away_team_id: uitId,
        home_score: thuisScore, away_score: uitScore,
      }).eq('id', wedstrijd.id)
      setOpslaan(false)
      if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    } else {
      const { error } = await supabase.from('matches').insert({
        season_id: seizoenId, date: datum, type,
        home_team_id: thuisId, away_team_id: uitId,
        home_score: thuisScore, away_score: uitScore,
      })
      setOpslaan(false)
      if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    }
    onOpgeslagen()
  }

  const thuisTeam = teams.find(t => t.id === thuisId)
  const uitTeam = teams.find(t => t.id === uitId)

  return (
    <form onSubmit={handleOpslaan} style={{
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
      padding: '20px 24px', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
            {isBewerk ? 'Wedstrijd bewerken' : 'Andere wedstrijd invoeren'}
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Score is voldoende voor het klassement</p>
        </div>
        <button type="button" onClick={onSluiten} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px' }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={labelStijl}>Datum *</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)} required style={inputStijl} />
          </div>
          <div>
            <label style={labelStijl}>Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {TYPES.map(t => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', border: 'none',
                  background: type === t ? TYPE_COLORS[t].bg : '#f1f5f9',
                  color: type === t ? TYPE_COLORS[t].color : '#64748b',
                  outline: type === t ? `2px solid ${TYPE_COLORS[t].color}` : 'none',
                  outlineOffset: '1px',
                }}>{TYPE_LABELS[t]}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Teams + score naast elkaar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '160px' }}>
            <label style={labelStijl}>Thuisteam *</label>
            <select value={thuisId} onChange={e => setThuisId(e.target.value)} style={inputStijl}>
              <option value="">— Kies team —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ ...labelStijl, textAlign: 'center' }}>{thuisTeam?.name ?? 'Thuis'}</label>
              <input type="number" min="0" value={thuisScore}
                onChange={e => setThuisScore(parseInt(e.target.value) || 0)}
                style={{ ...inputStijl, width: '64px', textAlign: 'center', fontSize: '20px', fontWeight: '700', padding: '8px 4px' }} />
            </div>
            <span style={{ fontSize: '18px', color: '#cbd5e1', paddingBottom: '10px' }}>–</span>
            <div style={{ textAlign: 'center' }}>
              <label style={{ ...labelStijl, textAlign: 'center' }}>{uitTeam?.name ?? 'Uit'}</label>
              <input type="number" min="0" value={uitScore}
                onChange={e => setUitScore(parseInt(e.target.value) || 0)}
                style={{ ...inputStijl, width: '64px', textAlign: 'center', fontSize: '20px', fontWeight: '700', padding: '8px 4px' }} />
            </div>
          </div>

          <div style={{ flex: 2, minWidth: '160px' }}>
            <label style={labelStijl}>Uitteam *</label>
            <select value={uitId} onChange={e => setUitId(e.target.value)} style={inputStijl}>
              <option value="">— Kies team —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={opslaan} style={knopStijl(opslaan)}>
            {opslaan ? 'Opslaan...' : isBewerk ? 'Wijzigingen opslaan' : 'Wedstrijd opslaan'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Andere wedstrijd kaart ───────────────────────────────────────────────────

function AndereWedstrijdKaart({ wedstrijd: w, actief, onBewerken, onVerwijderen }) {
  const gewonnen = w.home_score > w.away_score
  const gelijk = w.home_score === w.away_score

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${actief ? '#93c5fd' : '#e2e8f0'}`,
      borderRadius: '10px', padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      {/* Datum */}
      <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>
          {new Date(w.date).getDate()}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
          {new Date(w.date).toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>

      <div style={{ width: '1px', height: '28px', background: '#f1f5f9', flexShrink: 0 }} />

      {/* Teams */}
      <div style={{ flex: 1, fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '600' }}>{w.home_team?.name}</span>
        <span style={{
          fontSize: '13px', fontWeight: '700', color: '#0f172a',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '6px', padding: '2px 10px',
        }}>
          {w.home_score} – {w.away_score}
        </span>
        <span style={{ fontWeight: '600' }}>{w.away_team?.name}</span>
        <span style={{
          fontSize: '11px', fontWeight: '600', padding: '1px 7px', borderRadius: '10px',
          background: TYPE_COLORS[w.type]?.bg, color: TYPE_COLORS[w.type]?.color,
        }}>{TYPE_LABELS[w.type]}</span>
      </div>

      {/* Acties */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={onBewerken} style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px',
          padding: '4px 10px', fontSize: '12px', color: '#64748b', cursor: 'pointer',
        }}>✎</button>
        <button
          onClick={onVerwijderen}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '4px 6px', borderRadius: '6px' }}
          onMouseEnter={e => e.target.style.color = '#ef4444'}
          onMouseLeave={e => e.target.style.color = '#cbd5e1'}
        >✕</button>
      </div>
    </div>
  )
}

// ─── Stijlen ─────────────────────────────────────────────────────────────────

const labelStijl = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }
const inputStijl = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white', boxSizing: 'border-box' }
const knopStijl = (disabled) => ({ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 22px', fontSize: '13px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 })
const knopSecundairStijl = { background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }
