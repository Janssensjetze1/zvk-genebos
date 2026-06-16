import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePush } from '../hooks/usePush'

// ── Input stijl ─────────────────────────────────────────────────────────────
const inputStijl = (dirty) => ({
  flex: 1, border: 'none', outline: 'none',
  fontSize: '14px', background: 'transparent',
  color: dirty ? '#1d4ed8' : '#0f172a',
  fontWeight: dirty ? '500' : '400',
  padding: '0', textAlign: 'right', fontFamily: 'inherit',
})

// ── Hoofd component ─────────────────────────────────────────────────────────
export default function PWAAccount() {
  const { user, profile, patchProfile, signOut } = useAuth()
  const { status: pushStatus, fout: pushFout, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush()
  const fotoInputRef = useRef(null)

  // Settings state
  const [speler, setSpeler]           = useState(null)
  const [naam, setNaam]               = useState('')
  const [origNaam, setOrigNaam]       = useState('')
  const [bijnaam, setBijnaam]         = useState('')
  const [origBijnaam, setOrigBijnaam] = useState('')
  const [gebdatum, setGebdatum]       = useState('')
  const [origGebdatum, setOrigGebdatum] = useState('')
  const [email, setEmail]             = useState(user?.email ?? '')
  const [origEmail]                   = useState(user?.email ?? '')
  const [nieuwPw, setNieuwPw]         = useState('')
  const [bevestigPw, setBevestigPw]   = useState('')
  const [toonPw, setToonPw]           = useState(false)
  const [pwExpanded, setPwExpanded]   = useState(false)
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [bezig, setBezig]             = useState(false)
  const [bericht, setBericht]         = useState(null)

  useEffect(() => {
    const n = profile?.display_name ?? ''
    setNaam(n); setOrigNaam(n)
    const b = profile?.nickname ?? ''
    setBijnaam(b); setOrigBijnaam(b)
    const g = profile?.birth_date ?? ''
    setGebdatum(g); setOrigGebdatum(g)
    if (profile?.player_id) {
      fetchSpeler(profile.player_id)
    }
  }, [profile?.player_id, profile?.display_name])

  async function fetchSpeler(id) {
    const { data } = await supabase.from('players').select('*').eq('id', id).single()
    if (data) {
      setSpeler(data)
      setNaam(data.name);         setOrigNaam(data.name)
      setBijnaam(data.nickname ?? ''); setOrigBijnaam(data.nickname ?? '')
      setGebdatum(data.birth_date ?? ''); setOrigGebdatum(data.birth_date ?? '')
    }
  }

  function handleFotoKiezen(e) {
    const bestand = e.target.files[0]
    if (!bestand) return
    setFotoBestand(bestand)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(bestand)
  }

  const naamDirty     = naam !== origNaam || !!fotoBestand
  const bijnaamDirty  = bijnaam !== origBijnaam
  const gebdatumDirty = gebdatum !== origGebdatum
  const emailDirty    = email !== origEmail
  const pwDirty       = nieuwPw.length > 0
  const isDirty       = naamDirty || bijnaamDirty || gebdatumDirty || emailDirty || pwDirty

  async function handleOpslaan() {
    setBericht(null); setBezig(true)
    try {
      if (naamDirty || bijnaamDirty || gebdatumDirty) {
        let photo_url = speler?.photo_url ?? profile?.avatar_url ?? null
        if (fotoBestand) {
          const ext = fotoBestand.name.split('.').pop()
          const fileName = `${Date.now()}.${ext}`
          await supabase.storage.from('player-photos').upload(fileName, fotoBestand, { upsert: true })
          const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(fileName)
          photo_url = urlData.publicUrl
        }
        if (speler) await supabase.from('players').update({ name: naam, photo_url, nickname: bijnaam.trim() || null, birth_date: gebdatum || null }).eq('id', speler.id)
        const profileChanges = { display_name: naam, avatar_url: photo_url, nickname: bijnaam.trim() || null, birth_date: gebdatum || null }
        await supabase.from('profiles').update(profileChanges).eq('id', user.id)
        patchProfile(profileChanges)
        setOrigNaam(naam); setOrigBijnaam(bijnaam); setOrigGebdatum(gebdatum)
        setFotoBestand(null); setFotoPreview(null)
      }
      if (emailDirty) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw new Error(error.message)
      }
      if (pwDirty) {
        if (nieuwPw !== bevestigPw) throw new Error('Wachtwoorden komen niet overeen.')
        if (nieuwPw.length < 6) throw new Error('Minimum 6 tekens.')
        const { error } = await supabase.auth.updateUser({ password: nieuwPw })
        if (error) throw new Error(error.message)
        setNieuwPw(''); setBevestigPw('')
      }
      setBericht({ type: 'ok', tekst: 'Opgeslagen!' })
    } catch (e) {
      setBericht({ type: 'fout', tekst: e.message })
    }
    setBezig(false)
  }

  const fotoSrc      = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || profile?.display_name || user?.email?.split('@')[0] || '?'

  return (
    <div style={{ padding: '0 0 120px' }}>

      {/* ── Profiel header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        padding: '28px 20px 22px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div
          onClick={() => fotoInputRef.current?.click()}
          style={{
            width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
            background: '#1e3a5f', border: '2.5px solid rgba(255,255,255,0.15)',
            overflow: 'hidden', cursor: 'pointer', position: 'relative',
          }}
        >
          {fotoSrc
            ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '26px', fontWeight: '700', color: '#93c5fd' }}>
                {weergaveNaam.charAt(0).toUpperCase()}
              </span>
          }
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
          }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoKiezen} style={{ display: 'none' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {weergaveNaam}
          </div>
          {bijnaam && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginBottom: '3px' }}>
              "{bijnaam}"
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          {fotoPreview && (
            <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>Nieuwe foto geselecteerd</div>
          )}
        </div>

      </div>

      {/* ── Instellingen ── */}
      <div style={{ padding: '0 16px' }}>

          <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
            Profiel
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
            <FormRij label="Naam">
              <input
                type="text" value={naam}
                onChange={e => { setNaam(e.target.value); setBericht(null) }}
                placeholder="Voor- en achternaam"
                style={inputStijl(naamDirty)}
              />
            </FormRij>
            <FormRij label="Bijnaam" divider>
              <input
                type="text" value={bijnaam}
                onChange={e => { setBijnaam(e.target.value); setBericht(null) }}
                placeholder="Den Bomber, Dretze, ..."
                style={inputStijl(bijnaamDirty)}
              />
            </FormRij>
            <FormRij label="Geboortedatum" divider>
              <input
                type="date" value={gebdatum}
                onChange={e => { setGebdatum(e.target.value); setBericht(null) }}
                style={{ ...inputStijl(gebdatumDirty), colorScheme: 'light' }}
              />
            </FormRij>
            {!speler && (
              <div style={{ padding: '0 16px 12px', fontSize: '12px', color: '#94a3b8' }}>
                Je bent nog niet gekoppeld aan een spelersfiche. Een admin doet dit.
              </div>
            )}
          </div>

          <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
            Account
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
            <FormRij label="E-mail">
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setBericht(null) }}
                style={inputStijl(emailDirty)}
              />
            </FormRij>
            <FormRij label="Wachtwoord" divider>
              <button
                onClick={() => setPwExpanded(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: '13px', color: pwDirty ? '#1d4ed8' : '#3b82f6', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                {pwExpanded ? 'Sluiten' : 'Wijzigen'}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={pwExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                </svg>
              </button>
            </FormRij>
            {pwExpanded && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <PwVeld label="Nieuw wachtwoord" value={nieuwPw} onChange={e => { setNieuwPw(e.target.value); setBericht(null) }} toon={toonPw} onToggle={() => setToonPw(v => !v)} placeholder="Minimum 6 tekens" dirty={pwDirty} />
                {nieuwPw.length > 0 && (
                  <PwVeld label="Bevestig wachtwoord" value={bevestigPw} onChange={e => { setBevestigPw(e.target.value); setBericht(null) }} toon={toonPw} onToggle={() => setToonPw(v => !v)} placeholder="Herhaal wachtwoord" dirty={bevestigPw.length > 0} />
                )}
              </div>
            )}
          </div>

          {/* ── Push notificaties ── */}
          {pushStatus !== 'unsupported' && (
            <>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                Meldingen
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Push notificaties</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {pushStatus === 'subscribed' && 'Je ontvangt meldingen van ZVK Genebos.'}
                    {pushStatus === 'idle'       && (pushFout ? <span style={{ color: '#ef4444' }}>{pushFout}</span> : 'Ontvang meldingen over wedstrijden en nieuws.')}
                    {pushStatus === 'denied'     && 'Geblokkeerd in je browserinstellingen.'}
                    {pushStatus === 'loading'    && 'Even geduld...'}
                  </div>
                </div>
                {pushStatus === 'subscribed' && (
                  <button
                    onClick={pushUnsubscribe}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Uitschakelen
                  </button>
                )}
                {pushStatus === 'idle' && (
                  <button
                    onClick={pushSubscribe}
                    style={{ background: '#0f172a', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Inschakelen
                  </button>
                )}
                {pushStatus === 'denied' && (
                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', flexShrink: 0 }}>🔒 Geblokkeerd</span>
                )}
                {pushStatus === 'loading' && (
                  <div style={{ width: '18px', height: '18px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                )}
              </div>
            </>
          )}

          <button
            onClick={signOut}
            style={{
              width: '100%', padding: '14px',
              background: 'white', border: '1px solid #fecaca', borderRadius: '14px',
              fontSize: '14px', fontWeight: '600', color: '#ef4444', cursor: 'pointer',
            }}
          >
            Afmelden
          </button>
        </div>

      {/* ── Sticky save bar ── */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 100,
          background: '#0f172a', borderRadius: '16px',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ flex: 1 }}>
            {bericht ? (
              <span style={{ fontSize: '13px', fontWeight: '500', color: bericht.type === 'ok' ? '#86efac' : '#fca5a5' }}>
                {bericht.type === 'ok' ? '✓ ' : '✕ '}{bericht.tekst}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>Onopgeslagen wijzigingen</span>
            )}
          </div>
          <button
            onClick={handleOpslaan} disabled={bezig}
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              borderRadius: '10px', padding: '0 18px', height: '36px',
              fontSize: '14px', fontWeight: '700',
              cursor: bezig ? 'not-allowed' : 'pointer',
              opacity: bezig ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {bezig ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Hulpcomponenten ─────────────────────────────────────────────────────────
function FormRij({ label, children, divider }) {
  return (
    <div style={{
      borderTop: divider ? '1px solid #f1f5f9' : 'none',
      padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: '12px', minHeight: '50px',
    }}>
      <span style={{ fontSize: '14px', color: '#64748b', flexShrink: 0, width: '118px' }}>{label}</span>
      {children}
    </div>
  )
}

function PwVeld({ label, value, onChange, toon, onToggle, placeholder, dirty }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={toon ? 'text' : 'password'}
          value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: '100%', border: `1.5px solid ${dirty ? '#3b82f6' : '#e2e8f0'}`,
            borderRadius: '10px', padding: '0 42px 0 12px', fontSize: '14px',
            color: '#0f172a', outline: 'none',
            background: dirty ? '#f0f7ff' : 'white',
            boxSizing: 'border-box', height: '42px', fontFamily: 'inherit',
          }}
        />
        <button
          type="button" onClick={onToggle}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: toon ? '#475569' : '#94a3b8', lineHeight: 0,
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
