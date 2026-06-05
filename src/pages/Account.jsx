import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Account() {
  const { user, profile, patchProfile } = useAuth()

  // Speler data (naam + foto)
  const [speler, setSpeler] = useState(null)
  const [naam, setNaam] = useState(profile?.display_name ?? '')
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [naamOpslaan, setNaamOpslaan] = useState(false)
  const [naamBericht, setNaamBericht] = useState('')
  const fotoInputRef = useRef(null)

  // E-mail
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailOpslaan, setEmailOpslaan] = useState(false)
  const [emailBericht, setEmailBericht] = useState('')

  // Wachtwoord
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState('')
  const [wachtwoordOpslaan, setWachtwoordOpslaan] = useState(false)
  const [wachtwoordBericht, setWachtwoordBericht] = useState('')
  const [toonNieuw, setToonNieuw] = useState(false)
  const [toonBevestig, setToonBevestig] = useState(false)

  // Speler maar één keer ophalen — niet opnieuw bij elke profielwijziging (vermijdt race condition)
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
    // Lokale preview tonen vóór upload
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(bestand)
  }

  function handleFotoVerwijderen() {
    setFotoBestand(null)
    setFotoPreview(null)
    if (fotoInputRef.current) fotoInputRef.current.value = ''
  }

  async function handleNaamOpslaan(e) {
    e.preventDefault()
    setNaamBericht('')
    setNaamOpslaan(true)

    // Bepaal huidige foto-url (van speler of profiel)
    let photo_url = speler?.photo_url ?? profile?.avatar_url ?? null

    if (fotoBestand) {
      const ext = fotoBestand.name.split('.').pop()
      const bestandsnaam = `${Date.now()}.${ext}`
      const { error: uploadFout } = await supabase.storage
        .from('player-photos')
        .upload(bestandsnaam, fotoBestand, { upsert: true })
      if (uploadFout) {
        setNaamBericht({ type: 'fout', tekst: 'Foto uploaden mislukt: ' + uploadFout.message })
        setNaamOpslaan(false)
        return
      }
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(bestandsnaam)
      photo_url = urlData.publicUrl
    }

    // Eerst players updaten (als gekoppeld) — vóór patchProfile om race condition te vermijden
    if (speler) {
      const { error: spelerFout } = await supabase
        .from('players')
        .update({ name: naam, photo_url })
        .eq('id', speler.id)
      if (spelerFout) {
        setNaamBericht({ type: 'fout', tekst: 'Spelersfiche updaten mislukt: ' + spelerFout.message })
        setNaamOpslaan(false)
        return
      }
      // Lokale speler state bijwerken
      setSpeler(prev => ({ ...prev, name: naam, photo_url }))
    }

    // Dan profiles updaten + lokale context bijwerken
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
      setWachtwoordBericht({ type: 'fout', tekst: 'Wachtwoord moet minstens 6 tekens zijn.' }); return
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

  // Bepaal welk beeld we tonen: nieuwe preview > speler foto > profiel avatar > initiaal
  const fotoSrc = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || speler?.name || profile?.display_name || '?'

  return (
    <div style={{ maxWidth: '560px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Accountinstellingen</h1>
      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '32px' }}>Beheer je persoonlijke gegevens</p>

      {/* Profiel — naam & foto */}
      <Sectie titel="Profiel" beschrijving="Naam en profielfoto zichtbaar voor andere leden">
        <form onSubmit={handleNaamOpslaan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Foto upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Klikbare avatar */}
            <div
              onClick={() => fotoInputRef.current?.click()}
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#eff6ff', overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                border: fotoPreview ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'border 0.2s',
              }}
            >
              {fotoSrc
                ? <img src={fotoSrc} alt={weergaveNaam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '24px', fontWeight: '700', color: '#1d4ed8' }}>{weergaveNaam.charAt(0).toUpperCase()}</span>
              }
                {/* Overlay bij hover */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
            </div>

            <div>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoKiezen}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                style={{
                  display: 'block', fontSize: '13px', fontWeight: '500',
                  color: '#3b82f6', background: 'none', border: 'none',
                  padding: 0, cursor: 'pointer', marginBottom: '4px',
                }}
              >
                Foto kiezen
              </button>
              {fotoPreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {fotoBestand?.name?.length > 24
                      ? fotoBestand.name.slice(0, 22) + '…'
                      : fotoBestand?.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleFotoVerwijderen}
                    style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>JPG, PNG of WebP · max 5 MB</p>
              )}
            </div>
          </div>

          <Veld label="Naam">
            <input type="text" value={naam} onChange={e => setNaam(e.target.value)} style={inputStijl} placeholder="Voor- en achternaam" />
          </Veld>

          {!speler && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '-8px' }}>
              Je account is nog niet gekoppeld aan een spelersfiche. Een admin doet dit voor je.
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" disabled={naamOpslaan} style={knopStijl(naamOpslaan)}>
              {naamOpslaan ? 'Opslaan...' : 'Opslaan'}
            </button>
            {naamBericht && <Bericht bericht={naamBericht} />}
          </div>
        </form>
      </Sectie>

      <Divider />

      {/* E-mail */}
      <Sectie titel="E-mailadres" beschrijving="Het adres waarmee je inlogt">
        <form onSubmit={handleEmailOpslaan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Veld label="E-mail">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStijl} />
          </Veld>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" disabled={emailOpslaan} style={knopStijl(emailOpslaan)}>
              {emailOpslaan ? 'Opslaan...' : 'Opslaan'}
            </button>
            {emailBericht && <Bericht bericht={emailBericht} />}
          </div>
        </form>
      </Sectie>

      <Divider />

      {/* Wachtwoord */}
      <Sectie titel="Wachtwoord" beschrijving="Kies een sterk wachtwoord van minstens 6 tekens">
        <form onSubmit={handleWachtwoordOpslaan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Veld label="Nieuw wachtwoord">
            <WachtwoordVeld
              value={nieuwWachtwoord}
              onChange={e => setNieuwWachtwoord(e.target.value)}
              toon={toonNieuw}
              onToggle={() => setToonNieuw(v => !v)}
              placeholder="Minimum 6 tekens"
              required
              minLength={6}
            />
          </Veld>
          <Veld label="Bevestig nieuw wachtwoord">
            <WachtwoordVeld
              value={bevestigWachtwoord}
              onChange={e => setBevestigWachtwoord(e.target.value)}
              toon={toonBevestig}
              onToggle={() => setToonBevestig(v => !v)}
              placeholder="Herhaal wachtwoord"
              required
            />
          </Veld>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" disabled={wachtwoordOpslaan} style={knopStijl(wachtwoordOpslaan)}>
              {wachtwoordOpslaan ? 'Opslaan...' : 'Wachtwoord wijzigen'}
            </button>
            {wachtwoordBericht && <Bericht bericht={wachtwoordBericht} />}
          </div>
        </form>
      </Sectie>
    </div>
  )
}

// ---- Hulpcomponenten ----

function Sectie({ titel, beschrijving, children }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{titel}</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>{beschrijving}</p>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        {children}
      </div>
    </div>
  )
}

function Veld({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

function WachtwoordVeld({ value, onChange, toon, onToggle, placeholder, required, minLength }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type={toon ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        style={{
          width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
          padding: '9px 42px 9px 14px', fontSize: '14px', color: '#0f172a',
          outline: 'none', background: 'white', boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        style={{
          position: 'absolute', right: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0', lineHeight: 0,
          color: toon ? '#475569' : '#94a3b8',
        }}
      >
        {toon ? (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />
}

function Bericht({ bericht }) {
  const ok = bericht.type === 'ok'
  return (
    <span style={{ fontSize: '13px', color: ok ? '#16a34a' : '#ef4444' }}>
      {ok ? '✓' : '✕'} {bericht.tekst}
    </span>
  )
}

const inputStijl = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '9px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white',
}

const knopStijl = (disabled) => ({
  background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
  padding: '9px 20px', fontSize: '13px', fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
})
