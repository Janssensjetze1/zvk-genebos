import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── Badge rendering ─────────────────────────────────────────────────────────
const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

const CAT = {
  brons:     { ro: '#e8a87c', ri: '#9a5c1a', rc: '#fff3e0', label: 'Brons',     lb: '#fff7ed', lc: '#c2410c', lbo: '#fed7aa' },
  zilver:    { ro: '#cfd8dc', ri: '#546e7a', rc: '#eceff1', label: 'Zilver',    lb: '#f8fafc', lc: '#475569', lbo: '#cbd5e1' },
  goud:      { ro: '#ffe082', ri: '#b06c00', rc: '#fff8e1', label: 'Goud',      lb: '#fefce8', lc: '#a16207', lbo: '#fde68a' },
  legendary: { ro: '#a78bfa', ri: '#4c1d95', rc: '#ede9fe', label: 'Legendary', lb: '#faf5ff', lc: '#7c3aed', lbo: '#ddd6fe' },
  geheim:    { ro: '#334155', ri: '#0f172a', rc: '#1e293b', label: '???',       lb: '#0f172a', lc: '#94a3b8', lbo: '#1e293b' },
}

const BADGES = [
  {
    id: 'welkom',
    emoji: '🔐',
    naam: 'Welkom',
    beschrijving: 'Je bent ingelogd bij ZVK Genebos. Welkom in de club!',
    categorie: 'brons',
    conditieTekst: 'Verdiend bij je eerste aanmelding.',
    conditie: () => true,
  },
  {
    id: 'test_badge',
    emoji: '🧪',
    naam: 'Test badge',
    beschrijving: 'Een badge die nog wacht om verdiend te worden.',
    categorie: 'zilver',
    conditieTekst: null,
    conditie: () => false,
  },
]

function BadgeHex({ emoji, categorie, size = 72, verdiend }) {
  const cat = CAT[categorie] ?? CAT.zilver
  const H  = Math.round(size * 1.155)
  const iW = Math.round(size * 0.8125)
  const iH = Math.round(iW * 1.155)
  const iL = Math.round((size - iW) / 2)
  const iT = Math.round((H - iH) / 2)
  const cD = Math.round(iW * 0.70)
  const fs = Math.round(cD * 0.52)
  return (
    <div style={{
      position: 'relative', width: size, height: H, flexShrink: 0,
      filter: verdiend ? 'none' : 'grayscale(1)',
      opacity: verdiend ? 1 : 0.35,
    }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: HEX, background: cat.ro }} />
      <div style={{
        position: 'absolute', left: iL, top: iT, width: iW, height: iH,
        clipPath: HEX, background: cat.ri,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: cD, height: cD, borderRadius: '50%', background: cat.rc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, lineHeight: 1,
        }}>
          {verdiend ? emoji : '❓'}
        </div>
      </div>
    </div>
  )
}

// ── Input stijl hulpfunctie ─────────────────────────────────────────────────
const inputStijl = (dirty) => ({
  flex: 1, border: 'none', outline: 'none',
  fontSize: '14px', background: 'transparent',
  color: dirty ? '#1d4ed8' : '#0f172a',
  fontWeight: dirty ? '500' : '400',
  padding: '0', textAlign: 'right',
  fontFamily: 'inherit',
})

// ── Hoofd component ─────────────────────────────────────────────────────────
export default function PWAAccount() {
  const { user, profile, patchProfile, signOut } = useAuth()
  const fotoInputRef = useRef(null)

  const [tab, setTab] = useState('badges')

  // Form state
  const [speler, setSpeler]       = useState(null)
  const [naam, setNaam]           = useState('')
  const [origNaam, setOrigNaam]   = useState('')
  const [bijnaam, setBijnaam]     = useState('')
  const [origBijnaam, setOrigBijnaam] = useState('')
  const [gebdatum, setGebdatum]   = useState('')
  const [origGebdatum, setOrigGebdatum] = useState('')
  const [email, setEmail]         = useState(user?.email ?? '')
  const [origEmail]               = useState(user?.email ?? '')
  const [nieuwPw, setNieuwPw]     = useState('')
  const [bevestigPw, setBevestigPw] = useState('')
  const [toonPw, setToonPw]       = useState(false)
  const [pwExpanded, setPwExpanded] = useState(false)
  const [fotoBestand, setFotoBestand] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [bezig, setBezig]         = useState(false)
  const [bericht, setBericht]     = useState(null)

  // Badge detail state
  const [geselecteerdeBadge, setGeselecteerdeBadge] = useState(null)

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
      setNaam(data.name);       setOrigNaam(data.name)
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

  const naamDirty      = naam !== origNaam || !!fotoBestand
  const bijnaamDirty   = bijnaam !== origBijnaam
  const gebdatumDirty  = gebdatum !== origGebdatum
  const emailDirty     = email !== origEmail
  const pwDirty        = nieuwPw.length > 0
  const isDirty        = naamDirty || bijnaamDirty || gebdatumDirty || emailDirty || pwDirty

  async function handleOpslaan() {
    setBericht(null); setBezig(true)
    try {
      if (naamDirty || bijnaamDirty || gebdatumDirty) {
        let photo_url = speler?.photo_url ?? profile?.avatar_url ?? null
        if (fotoBestand) {
          const ext = fotoBestand.name.split('.').pop()
          const { error: uf } = await supabase.storage
            .from('player-photos')
            .upload(`${Date.now()}.${ext}`, fotoBestand, { upsert: true })
          if (uf) throw new Error('Foto uploaden mislukt.')
          const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(`${Date.now()}.${ext}`)
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

  const fotoSrc     = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || profile?.display_name || user?.email?.split('@')[0] || '?'
  const badgesMetStatus = BADGES.map(b => ({ ...b, verdiend: b.conditie() }))
  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length

  return (
    <div style={{ padding: '0 0 120px' }}>

      {/* ── Profiel header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        padding: '28px 20px 22px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        {/* Avatar */}
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

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {weergaveNaam}
          </div>
          {bijnaam && (
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '3px' }}>
              "{bijnaam}"
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          {fotoPreview && (
            <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>Nieuwe foto geselecteerd</div>
          )}
        </div>

        {/* Badge teller */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{aantalVerdiend}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>badges</div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          display: 'flex', gap: '4px',
          background: '#f1f5f9', borderRadius: '14px', padding: '4px',
          margin: '16px 0',
        }}>
          {[
            { id: 'badges', label: '🏅 Badges' },
            { id: 'instellingen', label: '⚙️ Instellingen' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setGeselecteerdeBadge(null) }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#0f172a' : '#64748b',
                fontSize: '13px', fontWeight: tab === t.id ? '700' : '500',
                cursor: 'pointer',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Badges ── */}
      {tab === 'badges' && (
        <div style={{ padding: '0 16px' }}>
          {/* Progress */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(aantalVerdiend / BADGES.length) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '99px', transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>
              {aantalVerdiend}/{BADGES.length} verdiend
            </div>
          </div>

          {/* Badge grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {badgesMetStatus.map(badge => {
              const cat = CAT[badge.categorie]
              return (
                <div
                  key={badge.id}
                  onClick={() => badge.verdiend && setGeselecteerdeBadge(badge)}
                  style={{
                    background: 'white',
                    border: `1.5px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                    borderRadius: '16px', padding: '18px 12px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    cursor: badge.verdiend ? 'pointer' : 'default', position: 'relative',
                  }}
                  onPointerDown={e => badge.verdiend && (e.currentTarget.style.transform = 'scale(0.96)')}
                  onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                    border: `1.5px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: badge.verdiend ? '#16a34a' : undefined,
                  }}>
                    {badge.verdiend ? '✓' : '🔒'}
                  </div>
                  <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={72} verdiend={badge.verdiend} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: badge.verdiend ? '#0f172a' : '#94a3b8', marginBottom: '5px' }}>
                      {badge.naam}
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
                      background: badge.verdiend ? cat.lb : '#f1f5f9',
                      color: badge.verdiend ? cat.lc : '#94a3b8',
                      border: `1px solid ${badge.verdiend ? cat.lbo : '#e2e8f0'}`,
                    }}>
                      {cat.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Badge detail sheet */}
          {geselecteerdeBadge && (() => {
            const b = geselecteerdeBadge
            const cat = CAT[b.categorie]
            return (
              <div style={{
                marginTop: '16px', background: 'white',
                border: `1.5px solid ${cat.lbo}`, borderRadius: '18px',
                padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              }}>
                <BadgeHex emoji={b.emoji} categorie={b.categorie} size={80} verdiend />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>{b.naam}</div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{b.beschrijving}</p>
                </div>
                <div style={{
                  width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '12px', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: '#dcfce7', border: '1.5px solid #86efac',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#16a34a', fontWeight: '700',
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>Verdiend!</div>
                    {b.conditieTekst && <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>{b.conditieTekst}</div>}
                  </div>
                </div>
                <button
                  onClick={() => setGeselecteerdeBadge(null)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: '10px',
                    padding: '8px 22px', fontSize: '13px', fontWeight: '600',
                    color: '#475569', cursor: 'pointer',
                  }}
                >Sluiten</button>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Tab: Instellingen ── */}
      {tab === 'instellingen' && (
        <div style={{ padding: '0 16px' }}>

          {/* Sectie: Profiel */}
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
          </div>

          {/* Sectie: Account */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d={pwExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
            </FormRij>
            {pwExpanded && (
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <PwVeld
                  label="Nieuw wachtwoord"
                  value={nieuwPw}
                  onChange={e => { setNieuwPw(e.target.value); setBericht(null) }}
                  toon={toonPw}
                  onToggle={() => setToonPw(v => !v)}
                  placeholder="Minimum 6 tekens"
                  dirty={pwDirty}
                />
                {nieuwPw.length > 0 && (
                  <PwVeld
                    label="Bevestig wachtwoord"
                    value={bevestigPw}
                    onChange={e => { setBevestigPw(e.target.value); setBericht(null) }}
                    toon={toonPw}
                    onToggle={() => setToonPw(v => !v)}
                    placeholder="Herhaal wachtwoord"
                    dirty={bevestigPw.length > 0}
                  />
                )}
              </div>
            )}
          </div>

          {/* Afmelden */}
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
      )}

      {/* ── Sticky save bar ── */}
      {tab === 'instellingen' && isDirty && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 100,
          background: '#0f172a', borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '14px',
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
            onClick={handleOpslaan}
            disabled={bezig}
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
