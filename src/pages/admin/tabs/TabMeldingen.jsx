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

  // Push notificatie state
  const [pushTitel, setPushTitel]   = useState('')
  const [pushBericht, setPushBericht] = useState('')
  const [pushBezig, setPushBezig]   = useState(false)
  const [pushResultaat, setPushResultaat] = useState(null)   // { sent, failed, total } | { error }

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

    // Deactiveer alle andere meldingen, maar 1 actief tegelijk
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

  async function stuurPush() {
    if (!pushTitel.trim() || !pushBericht.trim()) return
    setPushBezig(true)
    setPushResultaat(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: pushTitel.trim(), body: pushBericht.trim(), url: '/app' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Onbekende fout')
      setPushResultaat(data)
      setPushTitel('')
      setPushBericht('')
    } catch (e) {
      setPushResultaat({ error: e.message })
    }
    setPushBezig(false)
  }

  return (
    <>
    {ConfirmUI}
    <div style={{ maxWidth: '640px' }}>

      {/* ── Push notificaties ── */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--z-tekst)' }}>📲 Push notificatie</h2>
          <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>Stuur een directe melding naar alle abonnees op hun toestel.</p>
        </div>

        <div style={{ background: 'var(--z-vlak)', border: '1px solid var(--z-lijn)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStijl}>Titel</label>
            <input
              value={pushTitel}
              onChange={e => { setPushTitel(e.target.value); setPushResultaat(null) }}
              placeholder="Bv. Wedstrijd vanavond om 20u!"
              style={inputStijl}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStijl}>Bericht</label>
            <textarea
              value={pushBericht}
              onChange={e => { setPushBericht(e.target.value); setPushResultaat(null) }}
              placeholder="Korte tekst die op het toestel verschijnt..."
              rows={3}
              style={{ ...inputStijl, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Resultaat */}
          {pushResultaat && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
              background: pushResultaat.error || pushResultaat.failed > 0 ? 'var(--z-verlies-bg)' : 'var(--z-winst-bg)',
              color:      pushResultaat.error || pushResultaat.failed > 0 ? 'var(--z-verlies)'  : 'var(--z-winst)',
              border:     `1px solid ${pushResultaat.error || pushResultaat.failed > 0 ? 'var(--z-verlies-rand)' : 'var(--z-winst-rand)'}`,
            }}>
              {pushResultaat.error
                ? `❌ Fout: ${pushResultaat.error}`
                : `${pushResultaat.failed > 0 ? '⚠️' : '✓'} Verzonden naar ${pushResultaat.sent} van ${pushResultaat.total} abonnee${pushResultaat.total !== 1 ? 's' : ''}${pushResultaat.failed > 0 ? ` (${pushResultaat.failed} mislukt)` : ''}`
              }
              {pushResultaat.errors?.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.8 }}>
                  {pushResultaat.errors.map((e, i) => <div key={i}>↳ {e}</div>)}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={stuurPush}
              disabled={pushBezig || !pushTitel.trim() || !pushBericht.trim()}
              style={{
                background: 'var(--z-tekst)', color: 'white', border: 'none',
                borderRadius: '8px', padding: '9px 20px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                opacity: (pushBezig || !pushTitel.trim() || !pushBericht.trim()) ? 0.5 : 1,
              }}
            >
              {pushBezig ? 'Versturen...' : '📤 Verstuur push'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Pop-up meldingen ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--z-tekst)' }}>Pop-up meldingen</h2>
          <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>Gebruikers zien de actieve melding één keer.</p>
        </div>
        <button
          onClick={() => setFormulier(f => !f)}
          style={{ background: 'var(--z-tekst)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Nieuwe melding
        </button>
      </div>

      {/* Formulier */}
      {formulier && (
        <div style={{ background: 'var(--z-vlak)', border: '1px solid var(--z-lijn)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--z-tekst)', marginBottom: '16px' }}>Nieuwe melding</h3>

          {/* Emoji kiezer */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStijl}>Emoji</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                  fontSize: '20px', cursor: 'pointer',
                  background: emoji === e ? 'var(--z-tekst)' : 'var(--z-lijn)',
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
                  background: 'white', border: '1.5px dashed var(--z-lijn-sterk)', borderRadius: '10px',
                  padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: 'var(--z-tekst-3)',
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
            <button onClick={resetFormulier} style={{ background: 'var(--z-lijn-zacht)', color: 'var(--z-tekst-3)', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}>
              Annuleren
            </button>
            <button
              onClick={handleOpslaan}
              disabled={opslaan || !titel.trim() || !bericht.trim()}
              style={{ background: 'var(--z-tekst)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: opslaan ? 0.6 : 1 }}
            >
              {opslaan ? 'Uploaden...' : 'Opslaan & activeren'}
            </button>
          </div>
        </div>
      )}

      {/* Lijst */}
      {loading ? (
        <p style={{ fontSize: '14px', color: 'var(--z-tekst-4)' }}>Laden...</p>
      ) : meldingen.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid var(--z-lijn)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--z-tekst-4)', fontSize: '14px' }}>Nog geen meldingen aangemaakt.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {meldingen.map(m => (
            <div key={m.id} style={{
              background: 'white', border: `1px solid ${m.is_active ? 'var(--z-blauw-200)' : 'var(--z-lijn)'}`,
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
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--z-tekst)' }}>{m.title}</span>
                  {m.is_active && (
                    <span style={{ fontSize: '10px', fontWeight: '700', background: '#dbeafe', color: 'var(--z-blauw)', padding: '2px 8px', borderRadius: '20px' }}>ACTIEF</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--z-tekst-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => toggleActief(m)}
                  style={{ background: m.is_active ? '#fef3c7' : 'var(--z-winst-bg)', color: m.is_active ? 'var(--z-gelijk)' : 'var(--z-winst)', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {m.is_active ? 'Deactiveren' : 'Activeren'}
                </button>
                <button onClick={() => verwijder(m.id)} style={{ background: 'var(--z-verlies-bg)', color: 'var(--z-verlies)', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', cursor: 'pointer' }}>
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

const labelStijl = { fontSize: '12px', fontWeight: '600', color: 'var(--z-tekst-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }
const inputStijl = { width: '100%', border: '1px solid var(--z-lijn)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'white' }
