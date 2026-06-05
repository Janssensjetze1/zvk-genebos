import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Onboarding() {
  const { profile, user, patchProfile } = useAuth()
  const navigate = useNavigate()

  const [stap, setStap] = useState(1)
  const [naam, setNaam] = useState(profile?.display_name ?? '')
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const fotoInputRef = useRef(null)

  // Stap 2 is altijd zichtbaar — voor spelers wordt naam/foto ook naar players geschreven
  const heeftSpeler = !!profile?.player_id

  function handleFotoKiezen(e) {
    const bestand = e.target.files[0]
    if (!bestand) return
    setFotoBestand(bestand)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(bestand)
  }

  async function handleAfronden() {
    setFout('')
    setOpslaan(true)

    let photo_url = null

    // Upload foto als die gekozen is
    if (fotoBestand) {
      const ext = fotoBestand.name.split('.').pop()
      const bestandsnaam = `${Date.now()}.${ext}`
      const { error: uploadFout } = await supabase.storage
        .from('player-photos')
        .upload(bestandsnaam, fotoBestand, { upsert: true })
      if (uploadFout) {
        setFout('Foto uploaden mislukt: ' + uploadFout.message)
        setOpslaan(false)
        return
      }
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(bestandsnaam)
      photo_url = urlData.publicUrl
    }

    // Lokaal profiel meteen updaten zodat ProtectedRoute niet meer naar /onboarding stuurt
    const profileUpdate = { onboarding_done: true }
    if (naam.trim()) profileUpdate.display_name = naam.trim()
    if (photo_url) profileUpdate.avatar_url = photo_url
    patchProfile(profileUpdate)

    // Navigeer meteen — DB-schrijf loopt op de achtergrond
    setOpslaan(false)
    navigate('/', { replace: true })

    // DB-update op de achtergrond (niet awaited, navigatie is al klaar)
    supabase.from('profiles').update(profileUpdate).eq('id', user.id)

    // Als de gebruiker ook gekoppeld is aan een speler, update ook de players-tabel
    if (heeftSpeler && naam.trim()) {
      const updateData = { name: naam.trim() }
      if (photo_url) updateData.photo_url = photo_url
      supabase.from('players').update(updateData).eq('id', profile.player_id)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="ZVK Genebos" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
        </div>

        {/* Kaart */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>

          {/* Stapper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
            {['Welkom', 'Jouw profiel'].map((label, i) => {
              const nr = i + 1
              const actief = stap === nr
              const klaar = stap > nr
              return (
                <div key={nr} style={{ display: 'flex', alignItems: 'center', flex: i === 0 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: klaar ? '#0f172a' : actief ? '#0f172a' : '#e2e8f0',
                      color: klaar || actief ? 'white' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700',
                    }}>
                      {klaar ? '✓' : nr}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: actief ? '600' : '400', color: actief ? '#0f172a' : '#94a3b8' }}>
                      {label}
                    </span>
                  </div>
                  {i === 0 && (
                    <div style={{ flex: 1, height: '1px', background: stap > 1 ? '#0f172a' : '#e2e8f0', margin: '0 12px' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Stap 1 — Welkom */}
          {stap === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>👋</div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                Welkom bij ZVK Genebos!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
                Fijn dat je erbij bent. Stel eerst je profiel in zodat je herkend wordt binnen de app.
              </p>
              <button onClick={() => setStap(2)} style={knopStijl}>
                Profiel instellen →
              </button>
            </div>
          )}

          {/* Stap 2 — Profiel */}
          {stap === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Jouw profiel</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {heeftSpeler ? 'Dit is zichtbaar voor je teamgenoten.' : 'Optioneel — je kunt dit ook later aanpassen via je account.'}
                </p>
              </div>

              {/* Foto */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={() => fotoInputRef.current?.click()}
                  style={{
                    width: '96px', height: '96px', borderRadius: '50%',
                    background: fotoPreview ? 'transparent' : '#eff6ff',
                    border: fotoPreview ? '3px solid #3b82f6' : '2px dashed #93c5fd',
                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {fotoPreview
                    ? <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px' }}>📷</div>
                        <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '500', marginTop: '2px' }}>Foto kiezen</div>
                      </div>
                  }
                </div>
                <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoKiezen} style={{ display: 'none' }} />
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={() => { setFotoBestand(null); setFotoPreview(null); fotoInputRef.current.value = '' }}
                    style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Andere foto kiezen
                  </button>
                )}
              </div>

              {/* Naam */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                  Jouw naam *
                </label>
                <input
                  type="text"
                  value={naam}
                  onChange={e => setNaam(e.target.value)}
                  placeholder="Voor- en achternaam"
                  autoFocus
                  style={{
                    width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '14px', color: '#0f172a',
                    outline: 'none', background: 'white', boxSizing: 'border-box',
                  }}
                />
              </div>

              {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStap(1)}
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  ← Vorige
                </button>
                <button
                  onClick={handleAfronden}
                  disabled={opslaan}
                  style={{ ...knopStijl, flex: 2, opacity: opslaan ? 0.6 : 1, cursor: opslaan ? 'not-allowed' : 'pointer' }}
                >
                  {opslaan ? 'Opslaan...' : 'Klaar, ga naar de app →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const knopStijl = {
  width: '100%', background: '#0f172a', color: 'white', border: 'none',
  borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600',
  cursor: 'pointer',
}
