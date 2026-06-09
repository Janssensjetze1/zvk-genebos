import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function PWAAccount() {
  const { user, profile, patchProfile, signOut } = useAuth()

  const [speler, setSpeler] = useState(null)
  const [naam, setNaam] = useState(profile?.display_name ?? '')
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [naamOpslaan, setNaamOpslaan] = useState(false)
  const [naamBericht, setNaamBericht] = useState('')
  const fotoInputRef = useRef(null)

  const [email, setEmail] = useState(user?.email ?? '')
  const [emailOpslaan, setEmailOpslaan] = useState(false)
  const [emailBericht, setEmailBericht] = useState('')

  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState('')
  const [wachtwoordOpslaan, setWachtwoordOpslaan] = useState(false)
  const [wachtwoordBericht, setWachtwoordBericht] = useState('')
  const [toonNieuw, setToonNieuw] = useState(false)
  const [toonBevestig, setToonBevestig] = useState(false)

  useEffect(() => {
    if (profile?.player_id) fetchSpeler(profile.player_id)
    else setNaam(profile?.display_name ?? '')
  }, [profile?.player_id])

  async function fetchSpeler(playerId) {
    const { data } = await supabase.from('players').select('*').eq('id', playerId).single()
    if (data) { setSpeler(data); setNaam(data.name) }
  }

  function handleFotoKiezen(e) {
    const bestand = e.target.files[0]
    if (!bestand) return
    setFotoBestand(bestand)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(bestand)
  }

  async function handleNaamOpslaan(e) {
    e.preventDefault()
    setNaamBericht('')
    setNaamOpslaan(true)

    let photo_url = speler?.photo_url ?? profile?.avatar_url ?? null

    if (fotoBestand) {
      const ext = fotoBestand.name.split('.').pop()
      const bestandsnaam = `${Date.now()}.${ext}`
      const { error: uploadFout } = await supabase.storage
        .from('player-photos')
        .upload(bestandsnaam, fotoBestand, { upsert: true })
      if (uploadFout) {
        setNaamBericht({ type: 'fout', tekst: 'Foto uploaden mislukt.' })
        setNaamOpslaan(false)
        return
      }
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(bestandsnaam)
      photo_url = urlData.publicUrl
    }

    if (speler) {
      await supabase.from('players').update({ name: naam, photo_url }).eq('id', speler.id)
      setSpeler(prev => ({ ...prev, name: naam, photo_url }))
    }

    const profileChanges = { display_name: naam, avatar_url: photo_url }
    await supabase.from('profiles').update(profileChanges).eq('id', user.id)
    patchProfile(profileChanges)

    setNaamOpslaan(false)
    setNaamBericht({ type: 'ok', tekst: 'Profiel bijgewerkt.' })
    setFotoBestand(null)
    setFotoPreview(null)
  }

  async function handleEmailOpslaan(e) {
    e.preventDefault()
    setEmailBericht('')
    setEmailOpslaan(true)
    const { error } = await supabase.auth.updateUser({ email })
    setEmailOpslaan(false)
    if (error) setEmailBericht({ type: 'fout', tekst: error.message })
    else setEmailBericht({ type: 'ok', tekst: 'E-mail bijgewerkt.' })
  }

  async function handleWachtwoordOpslaan(e) {
    e.preventDefault()
    setWachtwoordBericht('')
    if (nieuwWachtwoord !== bevestigWachtwoord) {
      setWachtwoordBericht({ type: 'fout', tekst: 'Wachtwoorden komen niet overeen.' }); return
    }
    if (nieuwWachtwoord.length < 6) {
      setWachtwoordBericht({ type: 'fout', tekst: 'Minimum 6 tekens.' }); return
    }
    setWachtwoordOpslaan(true)
    const { error } = await supabase.auth.updateUser({ password: nieuwWachtwoord })
    setWachtwoordOpslaan(false)
    if (error) setWachtwoordBericht({ type: 'fout', tekst: error.message })
    else {
      setWachtwoordBericht({ type: 'ok', tekst: 'Wachtwoord bijgewerkt.' })
      setNieuwWachtwoord('')
      setBevestigWachtwoord('')
    }
  }

  const fotoSrc = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || profile?.display_name || '?'

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Account</h1>

      {/* Profiel header */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
        padding: '20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div
          onClick={() => fotoInputRef.current?.click()}
          style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: '#eff6ff', overflow: 'hidden', cursor: 'pointer', position: 'relative',
            border: '2px solid #bfdbfe',
          }}
        >
          {fotoSrc
            ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '22px', fontWeight: '700', color: '#2563eb' }}>
                {weergaveNaam.charAt(0).toUpperCase()}
              </span>
          }
          {/* Camera overlay */}
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
          }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoKiezen} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {weergaveNaam}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          {fotoPreview && (
            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
              Nieuwe foto geselecteerd
            </div>
          )}
        </div>
      </div>

      {/* Naam bewerken */}
      <form onSubmit={handleNaamOpslaan}>
        <Kaart titel="Naam">
          <input
            type="text"
            value={naam}
            onChange={e => setNaam(e.target.value)}
            placeholder="Voor- en achternaam"
            style={inputStijl}
          />
          {!speler && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              Je bent nog niet gekoppeld aan een spelersfiche. Een admin doet dit.
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <button type="submit" disabled={naamOpslaan} style={knopStijl(naamOpslaan)}>
              {naamOpslaan ? 'Opslaan...' : 'Opslaan'}
            </button>
            {naamBericht && <Bericht bericht={naamBericht} />}
          </div>
        </Kaart>
      </form>

      {/* E-mail */}
      <form onSubmit={handleEmailOpslaan}>
        <Kaart titel="E-mailadres">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStijl}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <button type="submit" disabled={emailOpslaan} style={knopStijl(emailOpslaan)}>
              {emailOpslaan ? 'Opslaan...' : 'Opslaan'}
            </button>
            {emailBericht && <Bericht bericht={emailBericht} />}
          </div>
        </Kaart>
      </form>

      {/* Wachtwoord */}
      <form onSubmit={handleWachtwoordOpslaan}>
        <Kaart titel="Wachtwoord wijzigen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <WachtwoordVeld
              label="Nieuw wachtwoord"
              value={nieuwWachtwoord}
              onChange={e => setNieuwWachtwoord(e.target.value)}
              toon={toonNieuw}
              onToggle={() => setToonNieuw(v => !v)}
              placeholder="Minimum 6 tekens"
              required
              minLength={6}
            />
            <WachtwoordVeld
              label="Bevestig wachtwoord"
              value={bevestigWachtwoord}
              onChange={e => setBevestigWachtwoord(e.target.value)}
              toon={toonBevestig}
              onToggle={() => setToonBevestig(v => !v)}
              placeholder="Herhaal wachtwoord"
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <button type="submit" disabled={wachtwoordOpslaan} style={knopStijl(wachtwoordOpslaan)}>
              {wachtwoordOpslaan ? 'Opslaan...' : 'Wijzigen'}
            </button>
            {wachtwoordBericht && <Bericht bericht={wachtwoordBericht} />}
          </div>
        </Kaart>
      </form>

      {/* Afmelden */}
      <button
        onClick={signOut}
        style={{
          width: '100%', marginTop: '8px', padding: '14px',
          background: 'white', border: '1px solid #fecaca', borderRadius: '14px',
          fontSize: '14px', fontWeight: '600', color: '#ef4444', cursor: 'pointer',
        }}
      >
        Afmelden
      </button>
    </div>
  )
}

function Kaart({ titel, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        {titel}
      </div>
      {children}
    </div>
  )
}

function WachtwoordVeld({ label, value, onChange, toon, onToggle, placeholder, required, minLength }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={toon ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          style={{ ...inputStijl, paddingRight: '44px' }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0,
            color: toon ? '#475569' : '#94a3b8',
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {toon
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              : <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
            }
          </svg>
        </button>
      </div>
    </div>
  )
}

function Bericht({ bericht }) {
  return (
    <span style={{ fontSize: '13px', color: bericht.type === 'ok' ? '#16a34a' : '#ef4444' }}>
      {bericht.type === 'ok' ? '✓' : '✕'} {bericht.tekst}
    </span>
  )
}

const inputStijl = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px',
  padding: '0 14px', fontSize: '14px', color: '#0f172a', outline: 'none',
  background: '#f8fafc', boxSizing: 'border-box', height: '44px',
}

const knopStijl = (disabled) => ({
  background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px',
  padding: '0 20px', height: '40px', fontSize: '14px', fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
})
