import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function TabLeden() {
  const [profielen, setProfielen] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: profielData } = await supabase
      .from('profiles').select('*, players(id, name)')
      .order('approved', { ascending: true })
    const { data: spelerData } = await supabase
      .from('players').select('id, name').order('name')
    setProfielen(profielData ?? [])
    setSpelers(spelerData ?? [])
    setLoading(false)
  }

  async function keurGoed(profiel) {
    await supabase.from('profiles').update({ approved: true }).eq('id', profiel.id)
    fetchData()
  }

  async function weiger(profiel) {
    if (!confirm('Weet je zeker dat je dit account wil weigeren en verwijderen?')) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: profiel.id }),
    })
    if (res.ok) fetchData()
    else alert('Verwijderen mislukt.')
  }

  async function koppelSpeler(profielId, spelerId) {
    await supabase.from('profiles').update({ player_id: spelerId || null }).eq('id', profielId)
    fetchData()
  }

  async function setRol(profielId, rol) {
    await supabase.from('profiles').update({ role: rol }).eq('id', profielId)
    fetchData()
  }

  const wachtend = profielen.filter(p => !p.approved)
  const goedgekeurd = profielen.filter(p => p.approved)

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Wachtend */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Wachtend op goedkeuring</h2>
          {wachtend.length > 0 && (
            <span style={{ background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', border: '1px solid #fed7aa' }}>
              {wachtend.length}
            </span>
          )}
        </div>
        {wachtend.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Geen openstaande aanvragen.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {wachtend.map(p => <ProfielKaart key={p.id} profiel={p} spelers={spelers} onGoedkeuren={() => keurGoed(p)} onWeigeren={() => weiger(p)} onKoppelSpeler={id => koppelSpeler(p.id, id)} onSetRol={r => setRol(p.id, r)} />)}
          </div>
        )}
      </section>

      {/* Actief */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '14px' }}>Actieve leden</h2>
        {goedgekeurd.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen goedgekeurde leden.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {goedgekeurd.map(p => <ProfielKaart key={p.id} profiel={p} spelers={spelers} onKoppelSpeler={id => koppelSpeler(p.id, id)} onSetRol={r => setRol(p.id, r)} />)}
          </div>
        )}
      </section>
    </div>
  )
}

const selectStyle = {
  fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '5px 10px', color: '#334155', background: 'white', outline: 'none', cursor: 'pointer',
}

function ProfielKaart({ profiel, spelers, onGoedkeuren, onWeigeren, onKoppelSpeler, onSetRol }) {
  const isWachtend = !profiel.approved

  return (
    <div style={{
      background: 'white', borderRadius: '10px',
      border: `1px solid ${isWachtend ? '#fed7aa' : '#e2e8f0'}`,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: profiel.role === 'admin' ? '#f3e8ff' : '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700',
        color: profiel.role === 'admin' ? '#7c3aed' : '#1d4ed8',
      }}>
        {profiel.role === 'admin' ? 'A' : 'L'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
              {profiel.display_name || profiel.email || '—'}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              background: profiel.role === 'admin' ? '#f3e8ff' : '#f1f5f9',
              color: profiel.role === 'admin' ? '#7c3aed' : '#475569',
            }}>{profiel.role}</span>
            {isWachtend && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c' }}>wachtend</span>}
          </div>
          {profiel.display_name && profiel.email && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>{profiel.email}</span>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>{profiel.id}</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Speler:</span>
            <select value={profiel.player_id ?? ''} onChange={e => onKoppelSpeler(e.target.value)} style={selectStyle}>
              <option value="">— Niet gekoppeld —</option>
              {spelers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rol:</span>
            <select value={profiel.role} onChange={e => onSetRol(e.target.value)} style={selectStyle}>
              <option value="member">Lid</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acties */}
      {isWachtend && (
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={onGoedkeuren} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Goedkeuren
          </button>
          <button onClick={onWeigeren} style={{ background: 'white', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Weigeren
          </button>
        </div>
      )}
    </div>
  )
}
