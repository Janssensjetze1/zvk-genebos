import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function TabTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [toonFormulier, setToonFormulier] = useState(false)

  // Nieuw team
  const [naam, setNaam] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  // Bewerken
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkOpslaan, setBewerkOpslaan] = useState(false)
  const [bewerkFout, setBewerkFout] = useState('')

  useEffect(() => { fetchTeams() }, [])

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data ?? [])
    setLoading(false)
  }

  async function handleToevoegen(e) {
    e.preventDefault()
    setFout('')
    setOpslaan(true)
    const { error } = await supabase.from('teams').insert({ name: naam.trim(), is_zvk: false })
    setOpslaan(false)
    if (error) { setFout('Toevoegen mislukt: ' + error.message); return }
    setNaam('')
    setToonFormulier(false)
    fetchTeams()
  }

  function startBewerken(team) {
    setBewerkId(team.id)
    setBewerkNaam(team.name)
    setBewerkFout('')
  }

  function stopBewerken() {
    setBewerkId(null)
    setBewerkNaam('')
    setBewerkFout('')
  }

  async function handleBewerken(e, team) {
    e.preventDefault()
    setBewerkFout('')
    setBewerkOpslaan(true)
    const { error } = await supabase.from('teams').update({ name: bewerkNaam.trim() }).eq('id', team.id)
    setBewerkOpslaan(false)
    if (error) { setBewerkFout('Opslaan mislukt: ' + error.message); return }
    stopBewerken()
    fetchTeams()
  }

  async function handleVerwijder(team) {
    if (!confirm(`Weet je zeker dat je "${team.name}" wil verwijderen?`)) return
    const { error } = await supabase.from('teams').delete().eq('id', team.id)
    if (error) alert('Verwijderen mislukt: ' + error.message)
    else fetchTeams()
  }

  const zvkTeam = teams.find(t => t.is_zvk)
  const tegenstanders = teams.filter(t => !t.is_zvk)

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  return (
    <div>
      {/* ZVK team — naam bewerkbaar, niet verwijderbaar */}
      {zvkTeam && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '10px' }}>Eigen team</h2>
          <div>
            <div style={{
              background: 'white',
              border: `1px solid ${bewerkId === zvkTeam.id ? '#93c5fd' : '#e2e8f0'}`,
              borderRadius: bewerkId === zvkTeam.id ? '10px 10px 0 0' : '10px',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#eff6ff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#1d4ed8',
              }}>{zvkTeam.name.charAt(0).toUpperCase()}</div>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{zvkTeam.name}</span>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                background: '#eff6ff', color: '#1d4ed8', marginRight: '8px',
              }}>Eigen team</span>
              <button
                onClick={() => bewerkId === zvkTeam.id ? stopBewerken() : startBewerken(zvkTeam)}
                style={{
                  background: bewerkId === zvkTeam.id ? '#f1f5f9' : 'white',
                  border: '1px solid #e2e8f0', borderRadius: '6px',
                  padding: '5px 12px', fontSize: '13px', fontWeight: '500',
                  color: '#475569', cursor: 'pointer',
                }}
              >
                {bewerkId === zvkTeam.id ? 'Annuleren' : 'Bewerken'}
              </button>
            </div>

            {bewerkId === zvkTeam.id && (
              <form onSubmit={e => handleBewerken(e, zvkTeam)} style={{
                background: '#f8fafc', border: '1px solid #93c5fd', borderTop: 'none',
                borderRadius: '0 0 10px 10px', padding: '14px 16px',
                display: 'flex', gap: '12px', alignItems: 'flex-end',
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }}>Naam</label>
                  <input
                    type="text"
                    value={bewerkNaam}
                    onChange={e => setBewerkNaam(e.target.value)}
                    required
                    autoFocus
                    style={{ ...inputStijl, padding: '8px 12px' }}
                  />
                  {bewerkFout && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{bewerkFout}</p>}
                </div>
                <button type="submit" disabled={bewerkOpslaan} style={{ ...knopStijl(bewerkOpslaan), marginBottom: bewerkFout ? '22px' : '0' }}>
                  {bewerkOpslaan ? 'Opslaan...' : 'Opslaan'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tegenstanders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Tegenstanders</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{tegenstanders.length} teams</span>
          </div>
          <button
            onClick={() => { setToonFormulier(v => !v); setFout(''); setNaam('') }}
            style={{
              background: toonFormulier ? 'white' : '#0f172a',
              color: toonFormulier ? '#64748b' : 'white',
              border: toonFormulier ? '1px solid #e2e8f0' : 'none',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {toonFormulier ? 'Annuleren' : '+ Team toevoegen'}
          </button>
        </div>

        {/* Nieuw team formulier */}
        {toonFormulier && (
          <form onSubmit={handleToevoegen} style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
            padding: '20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                Teamnaam *
              </label>
              <input
                type="text"
                value={naam}
                onChange={e => setNaam(e.target.value)}
                required
                placeholder="Naam van het team"
                autoFocus
                style={inputStijl}
              />
              {fout && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{fout}</p>}
            </div>
            <button type="submit" disabled={opslaan} style={{ ...knopStijl(opslaan), marginBottom: fout ? '22px' : '0' }}>
              {opslaan ? 'Toevoegen...' : 'Toevoegen'}
            </button>
          </form>
        )}

        {/* Teamlijst */}
        {tegenstanders.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen tegenstanders. Voeg de eerste toe!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tegenstanders.map(team => (
              <div key={team.id}>
                <div style={{
                  background: 'white',
                  border: `1px solid ${bewerkId === team.id ? '#93c5fd' : '#e2e8f0'}`,
                  borderRadius: bewerkId === team.id ? '10px 10px 0 0' : '10px',
                  padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  {/* Initiaal */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: '#f1f5f9', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b',
                  }}>
                    {team.name.charAt(0).toUpperCase()}
                  </div>

                  <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{team.name}</span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => bewerkId === team.id ? stopBewerken() : startBewerken(team)}
                      style={{
                        background: bewerkId === team.id ? '#f1f5f9' : 'white',
                        border: '1px solid #e2e8f0', borderRadius: '6px',
                        padding: '5px 12px', fontSize: '13px', fontWeight: '500',
                        color: '#475569', cursor: 'pointer',
                      }}
                    >
                      {bewerkId === team.id ? 'Annuleren' : 'Bewerken'}
                    </button>
                    <button
                      onClick={() => handleVerwijder(team)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '5px 8px', borderRadius: '6px' }}
                      onMouseEnter={e => e.target.style.color = '#ef4444'}
                      onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>

                {/* Inline bewerkformulier */}
                {bewerkId === team.id && (
                  <form onSubmit={e => handleBewerken(e, team)} style={{
                    background: '#f8fafc', border: '1px solid #93c5fd', borderTop: 'none',
                    borderRadius: '0 0 10px 10px', padding: '14px 16px',
                    display: 'flex', gap: '12px', alignItems: 'flex-end',
                  }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }}>Naam</label>
                      <input
                        type="text"
                        value={bewerkNaam}
                        onChange={e => setBewerkNaam(e.target.value)}
                        required
                        autoFocus
                        style={{ ...inputStijl, padding: '8px 12px' }}
                      />
                      {bewerkFout && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{bewerkFout}</p>}
                    </div>
                    <button type="submit" disabled={bewerkOpslaan} style={{ ...knopStijl(bewerkOpslaan), marginBottom: bewerkFout ? '22px' : '0' }}>
                      {bewerkOpslaan ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const inputStijl = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '9px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

const knopStijl = (disabled) => ({
  background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
  padding: '9px 20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
})
