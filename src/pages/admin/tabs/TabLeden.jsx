import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

function tijdGeleden(isoString) {
  if (!isoString) return null
  const nu = new Date()
  const dan = new Date(isoString)
  const diffMs = nu - dan
  const diffMin = Math.floor(diffMs / 60000)
  const diffUur = Math.floor(diffMin / 60)
  const diffDag = Math.floor(diffUur / 24)

  if (diffMin < 2) return 'Zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  if (diffUur < 24) return `${diffUur} uur geleden`
  if (diffDag === 1) return 'Gisteren'
  if (diffDag < 7) return `${diffDag} dagen geleden`
  return dan.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: diffDag > 365 ? 'numeric' : undefined })
}

export default function TabLeden() {
  const [profielen, setProfielen] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: profielData }, { data: spelerData }, { data: signInData }] = await Promise.all([
      supabase.from('profiles').select('*, players(id, name)').order('approved', { ascending: true }).order('display_name'),
      supabase.from('players').select('id, name').order('name'),
      supabase.rpc('get_users_last_sign_in'),
    ])

    // Merge last_sign_in_at in elk profiel
    const signInMap = {}
    for (const row of (signInData ?? [])) signInMap[row.id] = row.last_sign_in_at

    const profielen = (profielData ?? []).map(p => ({
      ...p,
      last_sign_in_at: signInMap[p.id] ?? null,
    }))

    setProfielen(profielen)
    setSpelers(spelerData ?? [])
    setLoading(false)
  }

  async function keurGoed(profiel) {
    await supabase.from('profiles').update({ approved: true }).eq('id', profiel.id)
    fetchData()
  }

  async function weiger(profiel) {
    if (!confirm(`Weet je zeker dat je het account van ${profiel.display_name || profiel.email} wil weigeren en verwijderen?`)) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
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

  if (loading) return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '14px' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Laden...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Wachtend op goedkeuring */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Wachtend op goedkeuring</h2>
          {wachtend.length > 0 && (
            <span style={{
              background: '#fff7ed', color: '#c2410c', fontSize: '12px', fontWeight: '700',
              padding: '2px 9px', borderRadius: '20px', border: '1px solid #fed7aa',
            }}>{wachtend.length}</span>
          )}
        </div>
        {wachtend.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#94a3b8', padding: '16px 0' }}>Geen openstaande aanvragen.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {wachtend.map(p => (
              <WachtendKaart key={p.id} profiel={p} spelers={spelers}
                onGoedkeuren={() => keurGoed(p)} onWeigeren={() => weiger(p)}
                onKoppelSpeler={id => koppelSpeler(p.id, id)} onSetRol={r => setRol(p.id, r)} />
            ))}
          </div>
        )}
      </section>

      {/* Actieve leden */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Actieve leden</h2>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{goedgekeurd.length} {goedgekeurd.length === 1 ? 'lid' : 'leden'}</span>
        </div>
        {goedgekeurd.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen goedgekeurde leden.</div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {goedgekeurd.map((p, i) => (
              <LedenRij key={p.id} profiel={p} spelers={spelers}
                isLast={i === goedgekeurd.length - 1}
                onKoppelSpeler={id => koppelSpeler(p.id, id)}
                onSetRol={r => setRol(p.id, r)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Avatar met foto of initialen
function Avatar({ naam, role, photoUrl, size = 40 }) {
  const isAdmin = role === 'admin'
  const initialen = naam
    ? naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={naam}
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          objectFit: 'cover',
          border: `1.5px solid ${isAdmin ? '#e9d5ff' : '#bfdbfe'}`,
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isAdmin ? '#f3e8ff' : '#eff6ff',
      color: isAdmin ? '#7c3aed' : '#2563eb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 36 ? '14px' : '12px', fontWeight: '700',
      border: `1.5px solid ${isAdmin ? '#e9d5ff' : '#bfdbfe'}`,
    }}>
      {initialen}
    </div>
  )
}

// Rolbadge
function RolBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
      background: isAdmin ? '#f3e8ff' : '#f1f5f9',
      color: isAdmin ? '#7c3aed' : '#475569',
      border: `1px solid ${isAdmin ? '#e9d5ff' : '#e2e8f0'}`,
    }}>
      {isAdmin ? 'Admin' : 'Lid'}
    </span>
  )
}

// Selectbox stijl
const selectStyle = {
  fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '6px 10px', color: '#334155', background: 'white', outline: 'none', cursor: 'pointer',
}

// Kaart voor wachtende leden
function WachtendKaart({ profiel, spelers, onGoedkeuren, onWeigeren, onKoppelSpeler, onSetRol }) {
  return (
    <div style={{
      background: '#fffbf5', border: '1px solid #fed7aa', borderRadius: '12px',
      padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start',
    }}>
      <Avatar naam={profiel.display_name || profiel.email} role={profiel.role} photoUrl={profiel.avatar_url} size={42} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            {profiel.display_name || '—'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
            Wachtend
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{profiel.email}</div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={onGoedkeuren} style={{
          background: '#0f172a', color: 'white', border: 'none',
          borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>
          Goedkeuren
        </button>
        <button onClick={onWeigeren} style={{
          background: 'white', color: '#ef4444', border: '1px solid #fecaca',
          borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        }}>
          Weigeren
        </button>
      </div>
    </div>
  )
}

// Rij voor actieve leden
function LedenRij({ profiel, spelers, isLast, onKoppelSpeler, onSetRol }) {
  const [open, setOpen] = useState(false)
  const lastSeen = tijdGeleden(profiel.last_sign_in_at)

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
      {/* Hoofdrij */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px',
          cursor: 'pointer', transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Avatar naam={profiel.display_name || profiel.email} role={profiel.role} photoUrl={profiel.avatar_url} size={38} />

        {/* Naam + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profiel.display_name || '—'}
            </span>
            <RolBadge role={profiel.role} />
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profiel.email}
          </div>
        </div>

        {/* Speler */}
        <div style={{ fontSize: '13px', color: profiel.players ? '#334155' : '#cbd5e1', width: '140px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'none', ['@media(min-width:900px)']: { display: 'block' } }}>
          {profiel.players?.name || '—'}
        </div>

        {/* Laatste login */}
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '110px' }}>
          {lastSeen ? (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              <span style={{ display: 'block', fontSize: '10px', color: '#cbd5e1', fontWeight: '500', marginBottom: '1px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ingelogd</span>
              {lastSeen}
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Nog niet ingelogd</span>
          )}
        </div>

        {/* Pijl */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Uitklapbaar bewerken */}
      {open && (
        <div style={{ padding: '12px 20px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Speler:</span>
            <select value={profiel.player_id ?? ''} onChange={e => onKoppelSpeler(e.target.value)} style={selectStyle}>
              <option value="">— Niet gekoppeld —</option>
              {spelers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Rol:</span>
            <select value={profiel.role} onChange={e => onSetRol(e.target.value)} style={selectStyle}>
              <option value="member">Lid</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginLeft: 'auto', fontFamily: 'monospace' }}>
            {profiel.id}
          </div>
        </div>
      )}
    </div>
  )
}
