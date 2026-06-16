import { useEffect, useRef, useState } from 'react'
import { useConfirm } from '../../../components/ConfirmDialog'
import { supabase } from '../../../lib/supabase'

const EMOJIS = ['📢', '🎉', '⚽', '🏆', '🔥', '💪', '📅', '❗', '✅', '🆕']

export default function TabMeldingen() {
  const { bevestig, ConfirmUI } = useConfirm()
  const [meldingen, setMeldingen] = useState([])
  const [loading, setLoading] = useState(true)
  const [formulier, setFormulier] = useState(false)
  const [emoji, setEmoji] = useState('📢')
  const [titel, setTitel] = useState('')
  const [bericht, setBericht] = useState('')
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [opslaan, setOpslaan] = useState(false)
  const fotoRef = useRef(null)

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

  function handleFoto(e) {
    const bestand = e.target.files[0]
    if (!bestand) return
    setFotoBestand(bestand)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(bestand)
  }

  function resetFormulier() {
    setTitel(''); setBericht(''); setEmoji('📢')
    setFotoBestand(null); setFotoPreview(null)
    if (fotoRef.current) fotoRef.current.value = ''
    setFormulier(false)
  }

  async function handleOpslaan() {
    if (!titel.trim() || !bericht.trim()) return
    setOpslaan(true)

    let image_url = null
    if (fotoBestand) {
      const ext = fotoBestand.name.split('.').pop()
      const naam = `announcements/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('player-photos').upload(naam, fotoBestand, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(naam)
        image_url = urlData.publicUrl
      }
    }

    // Deactiveer alle andere meldingen — maar 1 actief tegelijk
    await supabase.from('announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000').then()
    await supabase.from('announcements').insert({
      emoji, title: titel.trim(), message: bericht.trim(), is_active: true, image_url,
    }).then()

    resetFormulier()
    setOpslaan(false)
    laad()
  }

  async function toggleActief(melding) {
    if (!melding.is_active) {
      await supabase.from('announcements').update({ is_active: false }).neq('id', melding.id).then()
      await supabase.from('announcements').update({ is_active: true }).eq('id', melding.id).then()
    } else {
      await supabase.from('announcements').update({ is_active: false }).eq('id', melding.id).then()
    }
    laad()
  }

  async function verwijder(id) {
    if (!await bevestig('Melding verwijderen?', { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    await supabase.from('announcements').delete().eq('id', id).then()
    laad()
  }

  return (
    <>
    {ConfirmUI}
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Pop-up meldingen</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Gebruikers zien de actieve melding één keer.</p>
        </div>
        <button
          onClick={() => setFormulier(f => !f)}
          style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
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
            <label style={labelStijl}>Emoji</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                  fontSize: '20px', cursor: 'pointer',
                  background: emoji === e ? '#0f172a' : '#e2e8f0',
                  transition: 'background 0.15s',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Foto upload */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStijl}>Foto (optioneel)</label>
            <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
            {fotoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={fotoPreview} alt="preview" style={{ height: '120px', borderRadius: '10px', objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setFotoBestand(null); setFotoPreview(null); fotoRef.current.value = '' }}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer',
                    fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => fotoRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'white', border: '1.5px dashed #cbd5e1', borderRadius: '10px',
                  padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: '#64748b',
                }}
              >
                <span>📷</span> Foto kiezen
              </button>
            )}
          </div>

          {/* Titel */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStijl}>Titel</label>
            <input
              value={titel}
              onChange={e => setTitel(e.target.value)}
              placeholder="Bv. Nieuwe trainingsuren!"
              style={inputStijl}
            />
          </div>

          {/* Bericht */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStijl}>Bericht</label>
            <textarea
              value={bericht}
              onChange={e => setBericht(e.target.value)}
              placeholder="Schrijf hier de inhoud van de melding..."
              rows={4}
              style={{ ...inputStijl, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={resetFormulier} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}>
              Annuleren
            </button>
            <button
              onClick={handleOpslaan}
              disabled={opslaan || !titel.trim() || !bericht.trim()}
              style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: opslaan ? 0.6 : 1 }}
            >
              {opslaan ? 'Uploaden...' : 'Opslaan & activeren'}
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
              {/* Thumbnail of emoji */}
              {m.image_url ? (
                <img src={m.image_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{m.emoji}</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{m.title}</span>
                  {m.is_active && (
                    <span style={{ fontSize: '10px', fontWeight: '700', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '20px' }}>ACTIEF</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => toggleActief(m)}
                  style={{ background: m.is_active ? '#fef3c7' : '#f0fdf4', color: m.is_active ? '#b45309' : '#16a34a', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {m.is_active ? 'Deactiveren' : 'Activeren'}
                </button>
                <button onClick={() => verwijder(m.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', cursor: 'pointer' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

const labelStijl = { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }
const inputStijl = { width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'white' }
