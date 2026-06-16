import { useEffect, useState } from 'react'
import { useConfirm } from '../../../components/ConfirmDialog'
import { supabase } from '../../../lib/supabase'
import { useSeason } from '../../../context/SeasonContext'

export default function TabSeizoen() {
  const { bevestig, ConfirmUI } = useConfirm()
  const { seizoenen, actief, switchSeizoen, loading } = useSeason()
  const [toonFormulier, setToonFormulier] = useState(false)
  const [naam, setNaam] = useState('')
  const [startDatum, setStartDatum] = useState('')
  const [eindDatum, setEindDatum] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkStart, setBewerkStart] = useState('')
  const [bewerkEind, setBewerkEind] = useState('')
  const [bewerkOpslaan, setBewerkOpslaan] = useState(false)
  const [bewerkFout, setBewerkFout] = useState('')

  async function handleToevoegen(e) {
    e.preventDefault()
    setFout('')
    if (eindDatum < startDatum) { setFout('Einddatum moet na startdatum liggen.'); return }
    setOpslaan(true)
    const { error } = await supabase.from('seasons').insert({ name: naam.trim(), start_date: startDatum, end_date: eindDatum })
    setOpslaan(false)
    if (error) { setFout('Toevoegen mislukt: ' + error.message); return }
    setNaam(''); setStartDatum(''); setEindDatum(''); setToonFormulier(false)
    // Herlaad seizoenen via context
    window.location.reload()
  }

  function startBewerken(s) {
    setBewerkId(s.id)
    setBewerkNaam(s.name)
    setBewerkStart(s.start_date)
    setBewerkEind(s.end_date)
    setBewerkFout('')
  }

  function stopBewerken() {
    setBewerkId(null)
    setBewerkNaam(''); setBewerkStart(''); setBewerkEind('')
    setBewerkFout('')
  }

  async function handleBewerken(e, seizoen) {
    e.preventDefault()
    setBewerkFout('')
    if (bewerkEind < bewerkStart) { setBewerkFout('Einddatum moet na startdatum liggen.'); return }
    setBewerkOpslaan(true)
    const { error } = await supabase.from('seasons').update({
      name: bewerkNaam.trim(), start_date: bewerkStart, end_date: bewerkEind
    }).eq('id', seizoen.id)
    setBewerkOpslaan(false)
    if (error) { setBewerkFout('Opslaan mislukt: ' + error.message); return }
    stopBewerken()
    window.location.reload()
  }

  async function handleVerwijder(seizoen) {
    if (!await bevestig(`Seizoen "${seizoen.name}" verwijderen? Alle wedstrijden van dit seizoen worden ook verwijderd!`, { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    await supabase.from('seasons').delete().eq('id', seizoen.id)
    window.location.reload()
  }

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  return (
    <>
    {ConfirmUI}
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{seizoenen.length} seizoen{seizoenen.length !== 1 ? 'en' : ''}</p>
        <button
          onClick={() => { setToonFormulier(v => !v); setFout('') }}
          style={{
            background: toonFormulier ? 'white' : '#0f172a',
            color: toonFormulier ? '#64748b' : 'white',
            border: toonFormulier ? '1px solid #e2e8f0' : 'none',
            borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          {toonFormulier ? 'Annuleren' : '+ Seizoen toevoegen'}
        </button>
      </div>

      {/* Nieuw seizoen formulier */}
      {toonFormulier && (
        <form onSubmit={handleToevoegen} style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Nieuw seizoen</h3>
          {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '160px' }}>
              <label style={labelStijl}>Naam *</label>
              <input type="text" value={naam} onChange={e => setNaam(e.target.value)} required
                placeholder="bv. 2024-2025" style={inputStijl} />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label style={labelStijl}>Start *</label>
              <input type="date" value={startDatum} onChange={e => setStartDatum(e.target.value)} required style={inputStijl} />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label style={labelStijl}>Einde *</label>
              <input type="date" value={eindDatum} onChange={e => setEindDatum(e.target.value)} required style={inputStijl} />
            </div>
          </div>
          <button type="submit" disabled={opslaan} style={{ ...knopStijl(opslaan), alignSelf: 'flex-start' }}>
            {opslaan ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </form>
      )}

      {/* Seizoenenlijst */}
      {seizoenen.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen seizoenen. Voeg het eerste toe!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {seizoenen.map(s => {
            const isActief = s.id === actief?.id
            return (
              <div key={s.id}>
                <div style={{
                  background: 'white',
                  border: `1px solid ${bewerkId === s.id ? '#93c5fd' : isActief ? '#bfdbfe' : '#e2e8f0'}`,
                  borderRadius: bewerkId === s.id ? '10px 10px 0 0' : '10px',
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px',
                  background: isActief ? '#f0f9ff' : 'white',
                }}>
                  {/* Icoon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                    background: isActief ? '#dbeafe' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    {isActief ? '📂' : '🗄️'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{s.name}</span>
                      {isActief && (
                        <span style={{
                          fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                          background: '#dbeafe', color: '#1d4ed8',
                        }}>Huidig</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(s.start_date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(s.end_date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {!isActief && (
                      <button
                        onClick={() => switchSeizoen(s)}
                        style={{
                          background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px',
                          padding: '5px 12px', fontSize: '12px', fontWeight: '500', color: '#475569', cursor: 'pointer',
                        }}
                      >
                        Archief bekijken
                      </button>
                    )}
                    <button
                      onClick={() => bewerkId === s.id ? stopBewerken() : startBewerken(s)}
                      style={{
                        background: bewerkId === s.id ? '#f1f5f9' : 'white',
                        border: '1px solid #e2e8f0', borderRadius: '6px',
                        padding: '5px 12px', fontSize: '13px', fontWeight: '500', color: '#475569', cursor: 'pointer',
                      }}
                    >
                      {bewerkId === s.id ? 'Annuleren' : 'Bewerken'}
                    </button>
                    {!isActief && (
                      <button
                        onClick={() => handleVerwijder(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '5px 8px', borderRadius: '6px' }}
                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                        onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                      >
                        Verwijderen
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline bewerkformulier */}
                {bewerkId === s.id && (
                  <form onSubmit={e => handleBewerken(e, s)} style={{
                    background: '#f8fafc', border: '1px solid #93c5fd', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', padding: '16px',
                    display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
                  }}>
                    {bewerkFout && <p style={{ width: '100%', fontSize: '12px', color: '#ef4444', margin: 0 }}>{bewerkFout}</p>}
                    <div style={{ flex: 2, minWidth: '140px' }}>
                      <label style={labelStijl}>Naam</label>
                      <input type="text" value={bewerkNaam} onChange={e => setBewerkNaam(e.target.value)} required style={{ ...inputStijl, padding: '8px 12px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label style={labelStijl}>Start</label>
                      <input type="date" value={bewerkStart} onChange={e => setBewerkStart(e.target.value)} required style={{ ...inputStijl, padding: '8px 12px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <label style={labelStijl}>Einde</label>
                      <input type="date" value={bewerkEind} onChange={e => setBewerkEind(e.target.value)} required style={{ ...inputStijl, padding: '8px 12px' }} />
                    </div>
                    <button type="submit" disabled={bewerkOpslaan} style={knopStijl(bewerkOpslaan)}>
                      {bewerkOpslaan ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}

const labelStijl = { display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }
const inputStijl = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white', boxSizing: 'border-box' }
const knopStijl = (disabled) => ({ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 })
