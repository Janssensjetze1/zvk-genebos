import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { usePush } from '../hooks/usePush'
import { useTopscorer } from '../context/TopscorerContext'
import EerKronen from '../components/EerKronen'
import { RING_KLASSE } from '../lib/eer'
import { Icoon, Segment } from '../ui'
import { THEMA_OPTIES, useThema } from '../lib/thema'
import { verkleinFoto } from '../lib/foto'

// ── Hoofd component ─────────────────────────────────────────────────────────
export default function PWAAccount() {
  const [thema, zetThema] = useThema()
  const { user, profile, patchProfile, signOut } = useAuth()
  const { eer } = useTopscorer()
  const { status: pushStatus, fout: pushFout, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePush()

  const [speler, setSpeler]             = useState(null)
  const [naam, setNaam]                 = useState('')
  const [origNaam, setOrigNaam]         = useState('')
  const [bijnaam, setBijnaam]           = useState('')
  const [origBijnaam, setOrigBijnaam]   = useState('')
  const [gebdatum, setGebdatum]         = useState('')
  const [origGebdatum, setOrigGebdatum] = useState('')
  const [email, setEmail]               = useState(user?.email ?? '')
  const [origEmail]                     = useState(user?.email ?? '')
  const [nieuwPw, setNieuwPw]           = useState('')
  const [bevestigPw, setBevestigPw]     = useState('')
  const [toonPw, setToonPw]             = useState(false)
  const [pwExpanded, setPwExpanded]     = useState(false)
  const [fotoBestand, setFotoBestand]   = useState(null)
  const [fotoPreview, setFotoPreview]   = useState(null)
  const [bezig, setBezig]               = useState(false)
  const [bericht, setBericht]           = useState(null)

  useEffect(() => {
    const n = profile?.display_name ?? ''
    setNaam(n); setOrigNaam(n)
    const b = profile?.nickname ?? ''
    setBijnaam(b); setOrigBijnaam(b)
    const g = profile?.birth_date ?? ''
    setGebdatum(g); setOrigGebdatum(g)
    if (profile?.player_id) fetchSpeler(profile.player_id)
  }, [profile?.player_id, profile?.display_name])

  async function fetchSpeler(id) {
    const { data } = await supabase.from('players').select('*').eq('id', id).single()
    if (data) {
      setSpeler(data)
      setNaam(data.name);                    setOrigNaam(data.name)
      setBijnaam(data.nickname ?? '');       setOrigBijnaam(data.nickname ?? '')
      setGebdatum(data.birth_date ?? '');    setOrigGebdatum(data.birth_date ?? '')
    }
  }

  function handleFotoKiezen(e) {
    const bestand = e.target.files?.[0]
    e.target.value = '' // zelfde foto opnieuw kiezen moet ook een change geven
    if (!bestand) return
    setBericht(null)
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
          const klein = await verkleinFoto(fotoBestand)
          const ext = klein.type === 'image/jpeg' ? 'jpg' : (fotoBestand.name.split('.').pop() || 'jpg')
          const fileName = `${Date.now()}.${ext}`
          const { error: uploadFout } = await supabase.storage
            .from('player-photos')
            .upload(fileName, klein, { upsert: true, contentType: klein.type || undefined })
          if (uploadFout) throw new Error('Foto uploaden mislukt: ' + uploadFout.message)
          const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(fileName)
          photo_url = urlData.publicUrl
        }
        if (speler) {
          const { error: spelerFout } = await supabase.from('players').update({ name: naam, photo_url, nickname: bijnaam.trim() || null, birth_date: gebdatum || null }).eq('id', speler.id)
          if (spelerFout) throw new Error('Spelersfiche bijwerken mislukt: ' + spelerFout.message)
          // Het scherm toont de foto van de fiche: lokaal meteen bijwerken
          setSpeler(prev => ({ ...prev, name: naam, photo_url, nickname: bijnaam.trim() || null, birth_date: gebdatum || null }))
        }
        const profileChanges = { display_name: naam, avatar_url: photo_url, nickname: bijnaam.trim() || null, birth_date: gebdatum || null }
        const { error: profielFout } = await supabase.from('profiles').update(profileChanges).eq('id', user.id)
        if (profielFout) throw new Error('Profiel bijwerken mislukt: ' + profielFout.message)
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

  const jouwEer = eer(profile?.player_id)
  const fotoSrc      = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || profile?.display_name || user?.email?.split('@')[0] || '?'
  const initiaal     = weergaveNaam.charAt(0).toUpperCase()

  return (
    <div style={{ paddingBottom: '24px' }}>

      {/* ── Profiel hero ── */}
      <div style={{
        background: 'radial-gradient(120% 140% at 100% 0%, #2a4fb8 0%, #13234d 50%, #0c1a3d 100%)',
        padding: '40px 20px 28px',
        position: 'relative', overflow: 'hidden',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
          {/* Avatar: glanzende gouden ring als jij de topscorer bent */}
          <div
            className={jouwEer ? RING_KLASSE[jouwEer] : undefined}
            style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '50%' }}
          >
          {/* Een label opent de fotokiezer ook op iPhone betrouwbaar, zonder code */}
          <label
            htmlFor="profielfoto"
            aria-label="Profielfoto wijzigen"
            style={{
              display: 'block',
              width: '100%', height: '100%', borderRadius: '50%',
              background: '#1f3266',
              border: jouwEer ? 'none' : '3px solid rgba(255,255,255,0.15)',
              boxSizing: 'border-box',
              cursor: 'pointer', position: 'relative',
              boxShadow: jouwEer ? undefined : '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {fotoSrc
              ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '30px', fontWeight: '800', color: '#c7d6ff' }}>
                  {initiaal}
                </span>
            }
            {/* Camera overlay */}
            <div style={{
              position: 'absolute', right: '-2px', bottom: '-2px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--z-blauw)', border: '2px solid #13234d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </label>
          <input id="profielfoto" type="file" accept="image/*" onChange={handleFotoKiezen} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
          </div>

          {/* Naam en info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {weergaveNaam}
              {jouwEer && <EerKronen eer={jouwEer} grootte={17} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />}
            </div>
            {bijnaam && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: '2px' }}>
                "{bijnaam}"
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            {fotoPreview && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', background: 'rgba(96,165,250,0.15)', borderRadius: '20px', padding: '3px 10px' }}>
                <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600' }}>📷 Nieuwe foto geselecteerd</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Secties ── */}
      <div style={{ padding: '24px 16px 0' }}>

        {/* Profiel sectie */}
        <SectieLabel>Profiel</SectieLabel>
        <div style={kaartStijl}>
          <FormRij
            icon="gebruiker"
            label="Naam"
          >
            <input
              type="text" value={naam}
              onChange={e => { setNaam(e.target.value); setBericht(null) }}
              placeholder="Voor- en achternaam"
              style={inputStijl(naamDirty)}
            />
          </FormRij>
          <Divider />
          <FormRij icon="tag" label="Bijnaam">
            <input
              type="text" value={bijnaam}
              onChange={e => { setBijnaam(e.target.value); setBericht(null) }}
              placeholder="Den Bomber, Dretze, ..."
              style={inputStijl(bijnaamDirty)}
            />
          </FormRij>
          <Divider />
          <FormRij icon="taart" label="Geboortedatum">
            <input
              type="date" value={gebdatum}
              onChange={e => { setGebdatum(e.target.value); setBericht(null) }}
              style={inputStijl(gebdatumDirty)}
            />
          </FormRij>
        </div>

        {/* Account sectie */}
        <SectieLabel>Account</SectieLabel>
        <div style={kaartStijl}>
          <FormRij icon="mail" label="E-mail">
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setBericht(null) }}
              style={inputStijl(emailDirty)}
            />
          </FormRij>
          <Divider />
          <FormRij icon="slot" label="Wachtwoord">
            <button
              onClick={() => setPwExpanded(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto',
                fontSize: '13px', color: pwDirty ? 'var(--z-blauw)' : 'var(--z-blauw-500)', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {pwExpanded ? 'Sluiten' : 'Wijzigen'}
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={pwExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
            </button>
          </FormRij>
          {pwExpanded && (
            <div style={{ borderTop: '1px solid var(--z-lijn-zacht)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PwVeld
                label="Nieuw wachtwoord" value={nieuwPw}
                onChange={e => { setNieuwPw(e.target.value); setBericht(null) }}
                toon={toonPw} onToggle={() => setToonPw(v => !v)}
                placeholder="Minimum 6 tekens" dirty={pwDirty}
              />
              {nieuwPw.length > 0 && (
                <PwVeld
                  label="Bevestig wachtwoord" value={bevestigPw}
                  onChange={e => { setBevestigPw(e.target.value); setBericht(null) }}
                  toon={toonPw} onToggle={() => setToonPw(v => !v)}
                  placeholder="Herhaal wachtwoord" dirty={bevestigPw.length > 0}
                />
              )}
            </div>
          )}
        </div>

        {/* Weergave */}
        <SectieLabel>Weergave</SectieLabel>
        <div style={{ ...kaartStijl, padding: '12px' }}>
          <Segment vol opties={THEMA_OPTIES} waarde={thema} onChange={zetThema} />
        </div>

        {/* Push notificaties */}
        {pushStatus !== 'unsupported' && (
          <>
            <SectieLabel>Meldingen</SectieLabel>
            <div style={kaartStijl}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span className="z-icoonvak" style={pushStatus === 'subscribed' ? undefined : { background: 'var(--z-lijn-zacht)', color: 'var(--z-tekst-3)' }}>
                  <Icoon naam="bel" grootte={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--z-tekst)' }}>Push notificaties</div>
                  <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>
                    {pushStatus === 'subscribed' && <span style={{ color: 'var(--z-winst)' }}>✓ Ingeschakeld</span>}
                    {pushStatus === 'idle'       && (pushFout ? <span style={{ color: 'var(--z-verlies)' }}>{pushFout}</span> : 'Ontvang meldingen over wedstrijden.')}
                    {pushStatus === 'denied'     && <span style={{ color: 'var(--z-gelijk)' }}>Geblokkeerd in browserinstellingen</span>}
                    {pushStatus === 'loading'    && 'Laden...'}
                  </div>
                </div>
                {/* Toggle switch */}
                {(pushStatus === 'subscribed' || pushStatus === 'idle') && (
                  <button
                    onClick={pushStatus === 'subscribed' ? pushUnsubscribe : pushSubscribe}
                    style={{
                      width: '50px', height: '28px', borderRadius: '14px', border: 'none',
                      background: pushStatus === 'subscribed' ? 'var(--z-blauw)' : 'var(--z-lijn-sterk)',
                      cursor: 'pointer', position: 'relative', flexShrink: 0,
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: pushStatus === 'subscribed' ? '25px' : '3px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                )}
                {pushStatus === 'denied' && (
                  <Icoon naam="slot" grootte={18} style={{ color: 'var(--z-tekst-4)', flexShrink: 0 }} />
                )}
                {pushStatus === 'loading' && (
                  <div style={{ width: '20px', height: '20px', border: '2px solid var(--z-lijn)', borderTopColor: 'var(--z-blauw-500)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                )}
              </div>
            </div>
          </>
        )}

        {/* Afmelden */}
                <button
          onClick={signOut}
          style={{
            width: '100%', padding: '15px 16px',
            background: 'var(--z-kaart)', border: '1px solid var(--z-lijn)', borderRadius: 'var(--z-r)',
            fontSize: '15px', fontWeight: '600', color: 'var(--z-verlies)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Afmelden
        </button>
      </div>

      {/* ── Sticky save bar ── */}
      {isDirty && (
        <div style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom) + 96px)', left: '16px', right: '16px', zIndex: 100,
          background: 'var(--z-donker)', borderRadius: '18px',
          padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ flex: 1 }}>
            {bericht ? (
              <span style={{ fontSize: '13px', fontWeight: '500', color: bericht.type === 'ok' ? '#86efac' : '#fca5a5' }}>
                {bericht.type === 'ok' ? '✓ ' : '✕ '}{bericht.tekst}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Onopgeslagen wijzigingen</span>
            )}
          </div>
          <button
            onClick={handleOpslaan} disabled={bezig}
            style={{
              background: 'linear-gradient(135deg, var(--z-blauw-500), #2563eb)',
              color: 'white', border: 'none',
              borderRadius: '12px', padding: '0 20px', height: '38px',
              fontSize: '14px', fontWeight: '700',
              cursor: bezig ? 'not-allowed' : 'pointer',
              opacity: bezig ? 0.7 : 1, flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
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
const kaartStijl = {
  background: 'var(--z-kaart)',
  border: '1px solid var(--z-lijn)',
  borderRadius: 'var(--z-r)',
  overflow: 'hidden',
  marginBottom: '28px',
  boxShadow: 'var(--z-schaduw-s)',
}

function SectieLabel({ children }) {
  return (
    <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--z-tekst)', marginBottom: '12px' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--z-lijn-zacht)', marginLeft: '60px' }} />
}

function FormRij({ icon, label, children }) {
  return (
    <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '52px' }}>
      <span className="z-icoonvak"><Icoon naam={icon} grootte={17} /></span>
      <span style={{ fontSize: '14px', color: 'var(--z-tekst-2)', flexShrink: 0, width: '100px', fontWeight: '500' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {children}
      </div>
    </div>
  )
}

const inputStijl = (dirty) => ({
  flex: 1, border: 'none', outline: 'none',
  fontSize: '14px', background: 'transparent',
  color: dirty ? 'var(--z-blauw)' : 'var(--z-tekst-3)',
  fontWeight: dirty ? '600' : '400',
  padding: '0', textAlign: 'right', fontFamily: 'inherit',
})

function PwVeld({ label, value, onChange, toon, onToggle, placeholder, dirty }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--z-tekst-4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={toon ? 'text' : 'password'}
          value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: '100%', border: `1.5px solid ${dirty ? 'var(--z-blauw-500)' : 'var(--z-lijn)'}`,
            borderRadius: '12px', padding: '0 44px 0 14px', fontSize: '14px',
            color: 'var(--z-tekst)', outline: 'none',
            background: dirty ? 'var(--z-blauw-50)' : 'var(--z-vlak)',
            boxSizing: 'border-box', height: '44px', fontFamily: 'inherit',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        />
        <button
          type="button" onClick={onToggle}
          style={{
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: toon ? 'var(--z-tekst-2)' : 'var(--z-tekst-4)', lineHeight: 0,
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
