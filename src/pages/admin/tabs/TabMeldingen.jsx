import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const EMOJIS = ['📢', '🎉', '⚽', '🏆', '🔥', '💪', '📅', '❗', '✅', '🆕']

export default function TabMeldingen() {
  const [meldingen, setMeldingen] = useState([])
  const [loading, setLoading] = useState(true)
  const [formulier, setFormulier] = useState(false)
  const [emoji, setEmoji] = useState('📢')
  const [titel, setTitel] = useState('')
  const [bericht, setBericht] = useState('')
  const [opslaan, setOpslaan] = useState(false)

  useEffect(() => { laad() }, [])

  async function laad() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    setMeldingen(data ?? [])
    setLoading(false)
  }

  async function handleOpslaan() {
    if (!titel.trim() || !bericht.trim()) return
    setOpslaan(true)
    // Deactiveer alle andere meldingen — maar 1 actief tegelijk
    await supabase.from('announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('announcements').insert({ emoji, title: titel.trim(), message: bericht.trim(), is_active: true }).then()
    setTitel(''); setBericht(''); setEmoji('📢'); setFormulier(false)
    setOpslaan(false)
    laad()
  }

  async function toggleActief(melding) {
    if (!melding.is_active) {
      // Activeer deze, deactiveer de rest
      await supabase.from('announcements').update({ is_active: false }).neq('id', melding.id).then()
      await supabase.from('announcements').update({ is_active: true }).eq('id', melding.id).then()
    } else {
      await supabase.from('announcements').update({ is_active: false }).eq('id', melding.id).then()
    }
    laad()
  }

  async function verwijder(id) {
    if (!confirm('Melding verwijderen?')) return
    await supabase.from('announcements').delete().eq('id', id).then()
    laad()
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Pop-up meldingen</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Gebruikers zien de actieve melding één keer.</p>
        </div>
        <button
          onClick={() => setFormulier(f => !f)}
          style={{
            background: '#0f172a', color: 'white', border: 'none',
            borderRadius: '8px', padding: '8px 16px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          + Nieuwe melding
        </button>
      </div>

      {/* Formulier */}
      {formulier && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Nieuwe melding</h3>

          {/* Emoji kiezer */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Emoji</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                    fontSize: '20px', cursor: 'pointer',
                    background: emoji === e ? '#0f172a' : '#e2e8f0',
                    transition: 'background 0.15s',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Titel */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Titel</label>
            <input
              value={titel}
              onChange={e => setTitel(e.target.value)}
              placeholder="Bv. Nieuwe trainingsuren!"
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Bericht */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Bericht</label>
            <textarea
              value={bericht}
              onChange={e => setBericht(e.target.value)}
              placeholder="Schrijf hier de inhoud van de melding..."
              rows={4}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setFormulier(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}>
              Annuleren
            </button>
            <button
              onClick={handleOpslaan}
              disabled={opslaan || !titel.trim() || !bericht.trim()}
              style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: opslaan ? 0.6 : 1 }}
            >
              {opslaan ? 'Opslaan...' : 'Opslaan & activeren'}
            </button>
          </div>
        </div>
      )}

      {/* Lijst */}
      {loading ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>
      ) : meldingen.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Nog geen meldingen aangemaakt.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {meldingen.map(m => (
            <div key={m.id} style={{
              background: 'white', border: `1px solid ${m.is_active ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: m.is_active ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
            }}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{m.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{m.title}</span>
                  {m.is_active && (
                    <span style={{ fontSize: '10px', fontWeight: '700', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '20px' }}>
                      ACTIEF
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => toggleActief(m)}
                  title={m.is_active ? 'Deactiveren' : 'Activeren'}
                  style={{
                    background: m.is_active ? '#fef3c7' : '#f0fdf4',
                    color: m.is_active ? '#b45309' : '#16a34a',
                    border: 'none', borderRadius: '8px', padding: '7px 12px',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  {m.is_active ? 'Deactiveren' : 'Activeren'}
                </button>
                <button
                  onClick={() => verwijder(m.id)}
                  title="Verwijderen"
                  style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', cursor: 'pointer' }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
