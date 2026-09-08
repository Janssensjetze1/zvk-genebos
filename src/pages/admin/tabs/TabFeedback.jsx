import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const CATEGORIEEN = {
  bug: { label: 'Kapot', emoji: '🐞', kleur: '#ef4444', bg: '#fef2f2', rand: '#fecaca' },
  idee: { label: 'Idee', emoji: '💡', kleur: '#d97706', bg: '#fffbeb', rand: '#fde68a' },
  andere: { label: 'Andere', emoji: '💬', kleur: '#3b82f6', bg: '#eff6ff', rand: '#bfdbfe' },
}

const FILTERS = [
  { id: 'alles', label: 'Alles' },
  { id: 'bug', label: '🐞 Kapot' },
  { id: 'idee', label: '💡 Ideeën' },
  { id: 'andere', label: '💬 Andere' },
]

export default function TabFeedback({ onGelezen }) {
  const [berichten, setBerichten] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alles')
  // Welke berichten waren nog ongelezen toen dit tabblad openging — die krijgen
  // een "Nieuw"-label zolang je hier blijft, ook nadat ze gemarkeerd zijn.
  const [nieuweIds, setNieuweIds] = useState(new Set())

  useEffect(() => { laden() }, [])

  async function laden() {
    setLoading(true)
    const { data } = await supabase
      .from('feedback')
      .select('id, categorie, bericht, created_at, read_at, profiles:user_id(display_name, email, avatar_url)')
      .order('created_at', { ascending: false })

    const rijen = data ?? []
    setBerichten(rijen)
    setLoading(false)

    const ongelezen = rijen.filter(f => !f.read_at)
    if (ongelezen.length > 0) {
      setNieuweIds(new Set(ongelezen.map(f => f.id)))
      await supabase
        .from('feedback')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
      onGelezen?.()
    }
  }

  const zichtbaar = filter === 'alles' ? berichten : berichten.filter(f => f.categorie === filter)

  const tellers = {
    alles: berichten.length,
    bug: berichten.filter(f => f.categorie === 'bug').length,
    idee: berichten.filter(f => f.categorie === 'idee').length,
    andere: berichten.filter(f => f.categorie === 'andere').length,
  }

  if (loading) {
    return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const actief = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '20px',
                border: `1px solid ${actief ? '#0f172a' : '#e2e8f0'}`,
                background: actief ? '#0f172a' : 'white',
                color: actief ? 'white' : '#64748b',
                fontSize: '13px', fontWeight: actief ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              {f.label}
              <span style={{
                fontSize: '11px', fontWeight: '700',
                color: actief ? 'rgba(255,255,255,0.6)' : '#cbd5e1',
              }}>
                {tellers[f.id]}
              </span>
            </button>
          )
        })}
      </div>

      {zichtbaar.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>📭</div>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            {filter === 'alles'
              ? 'Nog geen feedback binnengekomen.'
              : 'Geen berichten in deze categorie.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {zichtbaar.map(f => (
            <BerichtKaart key={f.id} bericht={f} isNieuw={nieuweIds.has(f.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function BerichtKaart({ bericht: f, isNieuw }) {
  const cat = CATEGORIEEN[f.categorie] ?? CATEGORIEEN.andere
  const naam = f.profiles?.display_name || f.profiles?.email || 'Onbekend'
  const initialen = naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const datum = new Date(f.created_at)

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${isNieuw ? '#bfdbfe' : '#e2e8f0'}`,
      borderRadius: '12px', padding: '16px 18px',
      display: 'flex', gap: '14px', alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0, width: '38px', height: '38px', borderRadius: '50%',
        overflow: 'hidden', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: '#64748b',
      }}>
        {f.profiles?.avatar_url
          ? <img src={f.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initialen}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Kop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{naam}</span>
          <span style={{
            fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
            background: cat.bg, color: cat.kleur, border: `1px solid ${cat.rand}`,
          }}>
            {cat.emoji} {cat.label}
          </span>
          {isNieuw && (
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Nieuw
            </span>
          )}
          <span style={{ fontSize: '12px', color: '#cbd5e1', marginLeft: 'auto' }}>
            {datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
            {' · '}
            {datum.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Bericht */}
        <p style={{
          fontSize: '14px', color: '#334155', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {f.bericht}
        </p>

        {f.profiles?.email && (
          <a
            href={`mailto:${f.profiles.email}`}
            style={{
              display: 'inline-block', marginTop: '10px',
              fontSize: '12px', color: '#94a3b8', textDecoration: 'none',
            }}
          >
            ✉️ {f.profiles.email}
          </a>
        )}
      </div>
    </div>
  )
}
