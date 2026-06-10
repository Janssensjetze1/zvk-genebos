import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { supabase } from '../lib/supabase'
import { BADGES, berekenBadges, CATEGORIE_VOLGORDE, CAT } from '../data/badges'

// ── Hex clip-path ───────────────────────────────────────────────────────────
const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

// ── Stats berekenen uit ruwe Supabase data ──────────────────────────────────
function computeStats({ goalsArr, assistsArr, matchesArr, seizoenId, userCreatedAt }) {
  const goalsByMatch   = {}
  const assistsByMatch = {}

  goalsArr.forEach(g => {
    if (g.match_id) goalsByMatch[g.match_id] = (goalsByMatch[g.match_id] || 0) + 1
  })
  assistsArr.forEach(a => {
    if (a.match_id) assistsByMatch[a.match_id] = (assistsByMatch[a.match_id] || 0) + 1
  })

  const hattrickMatchIds = Object.entries(goalsByMatch)
    .filter(([, n]) => n >= 3).map(([id]) => id)

  const goalMatchSet   = new Set(Object.keys(goalsByMatch))
  const assistMatchSet = new Set(Object.keys(assistsByMatch))

  return {
    aantalGoals:       goalsArr.length,
    aantalAssists:     assistsArr.length,
    aantalWedstrijden: matchesArr.length,

    seizoenGoals:   goalsArr.filter(g => g.match?.season_id === seizoenId).length,

    hattricks:           hattrickMatchIds.length,
    maxGoalsInWedstrijd: Math.max(0, ...Object.values(goalsByMatch)),
    maxAssistsInWedstrijd: Math.max(0, ...Object.values(assistsByMatch)),

    hattrickMetAssist: hattrickMatchIds.filter(id => assistsByMatch[id] >= 1).length,
    wedstrijdenMetGoalEnAssist: [...goalMatchSet].filter(id => assistMatchSet.has(id)).length,

    seizoenenMetGoal: new Set(goalsArr.map(g => g.match?.season_id).filter(Boolean)).size,
    aantalSeizoenen:  new Set(matchesArr.map(m => m.match?.season_id).filter(Boolean)).size,

    accountLeeftijdDagen: userCreatedAt
      ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000)
      : 0,

    // Spook badge: enkel als account minstens 60 dagen oud is én nooit gespeeld
    nooitGespeeld: matchesArr.length === 0 &&
      (userCreatedAt
        ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000)
        : 0) >= 60,

    // Nog niet berekenbaar zonder extra queries:
    aantalWedstrijdenRij: 0, maxWedstrijdenRij: 0,
    seizonenVolledigAanwezig: 0, topScorerSeizoenen: 0,
    grootsteWinstMarge: 0, nachtbraker: false, gewonnenOpVerjaardag: false,
  }
}

// ── Hex badge component ─────────────────────────────────────────────────────
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
  const { actief: seizoen } = useSeason()
  const fotoInputRef = useRef(null)

  const [tab, setTab] = useState('badges')

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

  // Badge state
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [badgeStats, setBadgeStats]       = useState(null)
  const [dbBadgeIds, setDbBadgeIds]       = useState(new Set())
  const [geselecteerdeBadge, setGeselecteerdeBadge] = useState(null)

  useEffect(() => {
    const n = profile?.display_name ?? ''
    setNaam(n); setOrigNaam(n)
    const b = profile?.nickname ?? ''
    setBijnaam(b); setOrigBijnaam(b)
    const g = profile?.birth_date ?? ''
    setGebdatum(g); setOrigGebdatum(g)
    if (profile?.player_id) {
      fetchSpeler(profile.player_id)
      fetchBadgeData(profile.player_id)
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

  async function fetchBadgeData(playerId) {
    setBadgesLoading(true)
    const [goalsRes, assistsRes, matchesRes, dbRes] = await Promise.all([
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('scorer_id', playerId),
      supabase.from('goals')
        .select('id, match_id, match:match_id(season_id)')
        .eq('assist_id', playerId),
      supabase.from('match_players')
        .select('match_id, match:match_id(season_id)')
        .eq('player_id', playerId),
      supabase.from('player_badges')
        .select('badge_id')
        .eq('player_id', playerId),
    ])

    const stats = computeStats({
      goalsArr:    goalsRes.data   ?? [],
      assistsArr:  assistsRes.data  ?? [],
      matchesArr:  matchesRes.data  ?? [],
      seizoenId:   seizoen?.id,
      userCreatedAt: user?.created_at,
    })
    setBadgeStats(stats)

    // DB badges (tabel bestaat mogelijk nog niet → fout negeren)
    const ids = (dbRes.data ?? []).map(r => r.badge_id)
    setDbBadgeIds(new Set(ids))

    setBadgesLoading(false)
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
          await supabase.storage.from('player-photos').upload(`${Date.now()}.${ext}`, fotoBestand, { upsert: true })
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

  const fotoSrc      = fotoPreview ?? speler?.photo_url ?? profile?.avatar_url ?? null
  const weergaveNaam = naam || profile?.display_name || user?.email?.split('@')[0] || '?'

  // Badge earned check: stats-conditie OF in DB
  const badgesMetStatus = badgeStats
    ? BADGES.map(b => ({
        ...b,
        verdiend: dbBadgeIds.has(b.id) || (() => { try { return b.conditie(badgeStats) } catch { return false } })(),
      }))
    : BADGES.map(b => ({ ...b, verdiend: false }))

  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length

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

        {profile?.player_id && (
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{aantalVerdiend}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>badges</div>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          display: 'flex', gap: '4px',
          background: '#f1f5f9', borderRadius: '14px', padding: '4px',
          margin: '16px 0',
        }}>
          {[
            { id: 'badges',       label: '🏅 Badges' },
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

          {/* Geen spelersfiche gekoppeld */}
          {!profile?.player_id ? (
            <div style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
              padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔗</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                Geen spelersfiche gekoppeld
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Je account is nog niet gekoppeld aan een spelersfiche. Een admin doet dit.
                Pas dan worden jouw badges berekend.
              </p>
            </div>
          ) : badgesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: '12px' }}>
              <div style={{ width: '22px', height: '22px', border: '2.5px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Badges berekenen...</span>
            </div>
          ) : (
            <>
              {/* Voortgangsbalk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(aantalVerdiend / BADGES.length) * 100}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    borderRadius: '99px', transition: 'width 0.6s ease',
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>
                  {aantalVerdiend}/{BADGES.length}
                </span>
              </div>

              {/* Badges per categorie */}
              {CATEGORIE_VOLGORDE.map((cat, catIdx) => {
                const groep = badgesMetStatus.filter(b => b.categorie === cat)
                if (groep.length === 0) return null
                const catInfo = CAT[cat]
                const verdiendInGroep = groep.filter(b => b.verdiend).length
                return (
                  <div key={cat} style={{ marginBottom: '20px', marginTop: catIdx === 0 ? 0 : '4px' }}>
                    {/* Categorie header — horizontale scheidingslijn */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '800', color: catInfo.lc,
                        textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0,
                      }}>
                        {catInfo.label}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: catInfo.lbo }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, fontWeight: '600' }}>
                        {verdiendInGroep}/{groep.length}
                      </span>
                    </div>

                    {/* 3-koloms grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                      {groep.map(badge => {
                        const c = CAT[badge.categorie]
                        const isGeheim = badge.categorie === 'geheim' && !badge.verdiend
                        return (
                          <div
                            key={badge.id}
                            onClick={() => badge.verdiend && setGeselecteerdeBadge(
                              geselecteerdeBadge?.id === badge.id ? null : badge
                            )}
                            style={{
                              background: 'white',
                              border: `1.5px solid ${badge.verdiend ? c.lbo : '#e2e8f0'}`,
                              borderRadius: '12px', padding: '10px 6px 8px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                              cursor: badge.verdiend ? 'pointer' : 'default',
                              position: 'relative',
                              transition: 'transform 0.1s',
                            }}
                            onPointerDown={e => badge.verdiend && (e.currentTarget.style.transform = 'scale(0.96)')}
                            onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <div style={{
                              position: 'absolute', top: '5px', right: '5px',
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                              border: `1px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '7px', color: badge.verdiend ? '#16a34a' : undefined,
                            }}>
                              {badge.verdiend ? '✓' : '🔒'}
                            </div>

                            <BadgeHex
                              emoji={badge.emoji}
                              categorie={badge.categorie}
                              size={46}
                              verdiend={badge.verdiend}
                            />

                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: badge.verdiend ? '#0f172a' : '#94a3b8', lineHeight: 1.3 }}>
                                {isGeheim ? '???' : badge.naam}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Badge detail (inline, verschijnt onder de grid) */}
              {geselecteerdeBadge && (() => {
                const b = geselecteerdeBadge
                const c = CAT[b.categorie]
                return (
                  <div style={{
                    marginTop: '4px', marginBottom: '16px',
                    background: 'white', border: `1.5px solid ${c.lbo}`,
                    borderRadius: '16px', padding: '20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                  }}>
                    <BadgeHex emoji={b.emoji} categorie={b.categorie} size={80} verdiend />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>{b.naam}</div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{b.beschrijving}</p>
                    </div>
                    {dbBadgeIds.has(b.id) && (
                      <div style={{
                        width: '100%', background: '#faf5ff', border: '1px solid #ddd6fe',
                        borderRadius: '10px', padding: '10px 12px',
                        fontSize: '12px', color: '#7c3aed', fontWeight: '500',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span>🎖️</span> Handmatig toegekend door een admin
                      </div>
                    )}
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
            </>
          )}
        </div>
      )}

      {/* ── Tab: Instellingen ── */}
      {tab === 'instellingen' && (
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
