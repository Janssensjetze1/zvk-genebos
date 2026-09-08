import { useEffect, useState } from 'react'
import { useConfirm } from '../../../components/ConfirmDialog'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { HANDMATIGE_BADGES, CAT } from '../../../data/badges'

export default function TabSpelers() {
  const { bevestig, ConfirmUI } = useConfirm()
  const { user } = useAuth()
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [bewerkId, setBewerkId] = useState(null)
  const [badgePaneel, setBadgePaneel] = useState(null)   // player_id waarvan het badgepaneel open staat
  const [toegekend, setToegekend] = useState({})          // { player_id: Set(badge_id) }
  const [badgeBezig, setBadgeBezig] = useState(null)      // `${player_id}:${badge_id}` tijdens opslaan

  // Nieuw speler form state
  const [naam, setNaam] = useState('')
  const [fotoBestand, setFotoBestand] = useState(null)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  // Bewerk form state
  const [bewerkNaam, setBewerkNaam] = useState('')
  const [bewerkFoto, setBewerkFoto] = useState(null)
  const [bewerkOpslaan, setBewerkOpslaan] = useState(false)
  const [bewerkFout, setBewerkFout] = useState('')

  useEffect(() => { fetchSpelers(); fetchBadges() }, [])

  async function fetchBadges() {
    const { data } = await supabase.from('player_badges').select('player_id, badge_id')
    const map = {}
    for (const rij of data ?? []) {
      if (!map[rij.player_id]) map[rij.player_id] = new Set()
      map[rij.player_id].add(rij.badge_id)
    }
    setToegekend(map)
  }

  async function toggleBadge(speler, badge) {
    const sleutel = `${speler.id}:${badge.id}`
    if (badgeBezig) return
    setBadgeBezig(sleutel)

    const heeftAl = toegekend[speler.id]?.has(badge.id)

    if (heeftAl) {
      await supabase.from('player_badges').delete()
        .eq('player_id', speler.id).eq('badge_id', badge.id)
    } else {
      await supabase.from('player_badges').insert({
        player_id: speler.id,
        badge_id: badge.id,
        awarded_by: user?.id ?? null,
      })
    }

    await fetchBadges()
    setBadgeBezig(null)
  }

  async function fetchSpelers() {
    const { data } = await supabase.from('players').select('*').order('name')
    setSpelers(data ?? [])
    setLoading(false)
  }

  function startBewerken(speler) {
    setBewerkId(speler.id)
    setBewerkNaam(speler.name)
    setBewerkFoto(null)
    setBewerkFout('')
  }

  function stopBewerken() {
    setBewerkId(null)
    setBewerkNaam('')
    setBewerkFoto(null)
    setBewerkFout('')
  }

  async function handleBewerken(e, speler) {
    e.preventDefault()
    setBewerkFout('')
    setBewerkOpslaan(true)

    let photo_url = speler.photo_url

    if (bewerkFoto) {
      const ext = bewerkFoto.name.split('.').pop()
      const bestandsnaam = `${Date.now()}.${ext}`
      const { error: uploadFout } = await supabase.storage.from('player-photos').upload(bestandsnaam, bewerkFoto)
      if (uploadFout) { setBewerkFout('Foto uploaden mislukt: ' + uploadFout.message); setBewerkOpslaan(false); return }
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(bestandsnaam)
      photo_url = urlData.publicUrl
    }

    const { error } = await supabase.from('players').update({ name: bewerkNaam, photo_url }).eq('id', speler.id)
    setBewerkOpslaan(false)
    if (error) { setBewerkFout('Opslaan mislukt: ' + error.message); return }
    stopBewerken()
    fetchSpelers()
  }

  async function handleToevoegen(e) {
    e.preventDefault()
    setFout('')
    setOpslaan(true)
    let photo_url = null

    if (fotoBestand) {
      const ext = fotoBestand.name.split('.').pop()
      const bestandsnaam = `${Date.now()}.${ext}`
      const { error: uploadFout } = await supabase.storage.from('player-photos').upload(bestandsnaam, fotoBestand)
      if (uploadFout) { setFout('Foto uploaden mislukt: ' + uploadFout.message); setOpslaan(false); return }
      const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(bestandsnaam)
      photo_url = urlData.publicUrl
    }

    const { error } = await supabase.from('players').insert({ name: naam, photo_url })
    setOpslaan(false)
    if (error) { setFout('Speler toevoegen mislukt: ' + error.message); return }
    setNaam(''); setFotoBestand(null); setToonFormulier(false)
    fetchSpelers()
  }

  async function handleVerwijder(speler) {
    if (!await bevestig(`Weet je zeker dat je ${speler.name} wil verwijderen?`, { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    await supabase.from('players').delete().eq('id', speler.id)
    fetchSpelers()
  }

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  return (
    <>
    {ConfirmUI}
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{spelers.length} speler{spelers.length !== 1 ? 's' : ''} in de selectie</p>
        <button
          onClick={() => { setToonFormulier(v => !v); setFout('') }}
          style={{
            background: toonFormulier ? 'white' : '#0f172a',
            color: toonFormulier ? '#64748b' : 'white',
            border: toonFormulier ? '1px solid #e2e8f0' : 'none',
            borderRadius: '8px', padding: '8px 16px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          {toonFormulier ? 'Annuleren' : '+ Speler toevoegen'}
        </button>
      </div>

      {/* Nieuw speler formulier */}
      {toonFormulier && (
        <form onSubmit={handleToevoegen} style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Nieuwe speler</h3>
          {fout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{fout}</p>}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>Naam *</label>
            <input type="text" value={naam} onChange={e => setNaam(e.target.value)} required placeholder="Voor- en achternaam"
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>Profielfoto (optioneel)</label>
            <input type="file" accept="image/*" onChange={e => setFotoBestand(e.target.files[0])} style={{ fontSize: '13px', color: '#475569' }} />
          </div>
          <button type="submit" disabled={opslaan} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start', opacity: opslaan ? 0.6 : 1 }}>
            {opslaan ? 'Opslaan...' : 'Toevoegen'}
          </button>
        </form>
      )}

      {/* Spelerslijst */}
      {spelers.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nog geen spelers. Voeg de eerste toe!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {spelers.map(speler => (
            <div key={speler.id}>
              {/* Speler rij */}
              <div style={{
                background: 'white', border: `1px solid ${bewerkId === speler.id ? '#93c5fd' : '#e2e8f0'}`,
                borderRadius: (bewerkId === speler.id || badgePaneel === speler.id) ? '10px 10px 0 0' : '10px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                {/* Avatar */}
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {speler.photo_url
                    ? <img src={speler.photo_url} alt={speler.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>{speler.name.charAt(0)}</span>
                  }
                </div>

                <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{speler.name}</span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setBadgePaneel(p => p === speler.id ? null : speler.id)}
                    title="Handmatige badges toekennen"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: badgePaneel === speler.id ? '#f1f5f9' : 'white',
                      border: '1px solid #e2e8f0', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '13px', fontWeight: '500',
                      color: '#475569', cursor: 'pointer',
                    }}
                  >
                    🏅 Badges
                    {(toegekend[speler.id]?.size ?? 0) > 0 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: '17px', height: '17px', padding: '0 4px', borderRadius: '9px',
                        background: '#0f172a', color: 'white', fontSize: '10px', fontWeight: '700',
                      }}>
                        {toegekend[speler.id].size}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => bewerkId === speler.id ? stopBewerken() : startBewerken(speler)}
                    style={{
                      background: bewerkId === speler.id ? '#f1f5f9' : 'white',
                      border: '1px solid #e2e8f0', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '13px', fontWeight: '500',
                      color: '#475569', cursor: 'pointer',
                    }}
                  >
                    {bewerkId === speler.id ? 'Annuleren' : 'Bewerken'}
                  </button>
                  <button
                    onClick={() => handleVerwijder(speler)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '5px 8px', borderRadius: '6px' }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              {/* Badgepaneel */}
              {badgePaneel === speler.id && (
                <div style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: 'none',
                  borderRadius: '0 0 10px 10px', padding: '16px 20px',
                }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Handmatige badges
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                    Deze badges kan een speler niet zelf verdienen — jij kent ze toe.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {HANDMATIGE_BADGES.map(badge => {
                      const heeft = toegekend[speler.id]?.has(badge.id) ?? false
                      const bezig = badgeBezig === `${speler.id}:${badge.id}`
                      const c = CAT[badge.categorie] ?? CAT.platina
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => toggleBadge(speler, badge)}
                          disabled={bezig}
                          title={badge.beschrijving}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '9px',
                            padding: '9px 14px', borderRadius: '10px',
                            border: `1.5px solid ${heeft ? c.lbo : '#e2e8f0'}`,
                            background: heeft ? c.lb : 'white',
                            color: heeft ? c.lc : '#64748b',
                            fontSize: '13px', fontWeight: heeft ? '700' : '500',
                            cursor: bezig ? 'wait' : 'pointer',
                            opacity: bezig ? 0.6 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: '15px' }}>{badge.emoji}</span>
                          {badge.naam}
                          <span style={{
                            fontSize: '11px', fontWeight: '600',
                            color: heeft ? c.lc : '#cbd5e1',
                          }}>
                            {heeft ? '✓ toegekend' : '+ toekennen'}
                          </span>
                        </button>
                      )
                    })}
                    {HANDMATIGE_BADGES.length === 0 && (
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Er zijn nog geen handmatige badges gedefinieerd.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Inline bewerkformulier */}
              {bewerkId === speler.id && (
                <form onSubmit={e => handleBewerken(e, speler)} style={{
                  background: '#f8fafc', border: '1px solid #93c5fd', borderTop: 'none',
                  borderRadius: '0 0 10px 10px', padding: '16px 20px',
                  display: 'flex', flexDirection: 'column', gap: '14px',
                }}>
                  {bewerkFout && <p style={{ fontSize: '13px', color: '#ef4444' }}>{bewerkFout}</p>}

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }}>Naam</label>
                      <input type="text" value={bewerkNaam} onChange={e => setBewerkNaam(e.target.value)} required
                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '8px 12px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '5px' }}>Nieuwe foto (optioneel)</label>
                      <input type="file" accept="image/*" onChange={e => setBewerkFoto(e.target.files[0])}
                        style={{ fontSize: '13px', color: '#475569', paddingTop: '4px' }} />
                    </div>
                  </div>

                  <button type="submit" disabled={bewerkOpslaan} style={{
                    background: '#0f172a', color: 'white', border: 'none', borderRadius: '7px',
                    padding: '8px 18px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', alignSelf: 'flex-start', opacity: bewerkOpslaan ? 0.6 : 1,
                  }}>
                    {bewerkOpslaan ? 'Opslaan...' : 'Wijzigingen opslaan'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
