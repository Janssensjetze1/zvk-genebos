import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { mvpSluitOp, mvpStatus } from '../hooks/useMvp'
import { Avatar, Icoon } from '../ui'

// MVP op de wedstrijdpagina. Zolang de stemming open is: tik een speler aan om
// te stemmen (nog eens tikken trekt je stem in). Daarna: de MVP in het goud.
// De regels bewaakt de database, zie supabase/migrations/mvp.sql.
// Stijlen: .z-mvp-* in ui/ui.css.

export default function MvpBlok({ wedstrijd: w }) {
  const status = mvpStatus(w)
  if (status === 'geen') return null
  return status === 'open' ? <Stemming w={w} /> : <Uitslag w={w} />
}

function spelersVan(w) {
  return (w.match_players ?? [])
    .map(mp => ({ id: mp.player_id, name: mp.player?.name ?? '?', photo_url: mp.player?.photo_url }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Tijdens de stemming ─────────────────────────────────────────────────────

function Stemming({ w }) {
  const { user, profile } = useAuth()
  const [mijnStem, setMijnStem] = useState(undefined) // undefined = laden, null = nog niet gestemd
  const [aantal, setAantal] = useState(0)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [nu] = useState(() => Date.now())

  useEffect(() => {
    if (!user) return
    let actief = true
    Promise.all([
      supabase.from('mvp_stemmen').select('player_id').eq('match_id', w.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('mvp_tellers').select('stemmen').eq('match_id', w.id).maybeSingle(),
    ]).then(([stem, teller]) => {
      if (!actief) return
      setMijnStem(stem.data?.player_id ?? null)
      setAantal(teller.data?.stemmen ?? 0)
    })
    return () => { actief = false }
  }, [w.id, user])

  async function stem(spelerId) {
    if (bezig) return
    setBezig(true)
    setFout('')
    const vorige = mijnStem
    const intrekken = spelerId === vorige
    setMijnStem(intrekken ? null : spelerId)

    const { error } = intrekken
      ? await supabase.from('mvp_stemmen').delete().eq('match_id', w.id).eq('user_id', user.id)
      : await supabase.from('mvp_stemmen').upsert(
          { match_id: w.id, user_id: user.id, player_id: spelerId },
          { onConflict: 'match_id,user_id' },
        )

    if (error) {
      setMijnStem(vorige)
      setFout(error.message?.includes('jezelf') || error.message?.includes('meespeelde') || error.message?.includes('niet open')
        ? error.message
        : 'Stemmen lukte niet. Probeer het straks nog eens.')
    } else if (intrekken) {
      setAantal(a => Math.max(0, a - 1))
    } else if (!vorige) {
      setAantal(a => a + 1)
    }
    setBezig(false)
  }

  const sluit = mvpSluitOp(w)
  const urenNog = Math.max(1, Math.round((sluit.getTime() - nu) / 3600000))

  return (
    <section className="z-kaart z-mvp">
      <div className="z-mvp-kop">
        <span className="z-mvp-kroon"><Icoon naam="kroon" grootte={18} dikte={2.2} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>Wie was de MVP?</h2>
          <p>{mijnStem ? 'Je stemde. Tik een andere speler aan om te wisselen.' : 'Tik de beste speler van de match aan.'}</p>
        </div>
        <span className="z-mvp-klok">
          <Icoon naam="klok" grootte={13} dikte={2.2} />
          nog {urenNog}u
        </span>
      </div>

      <div className="z-mvp-raster">
        {spelersVan(w).map(s => {
          const zelf = s.id === profile?.player_id
          const gekozen = s.id === mijnStem
          return (
            <button
              key={s.id}
              type="button"
              className="z-mvp-speler"
              aria-pressed={gekozen}
              disabled={zelf || bezig || mijnStem === undefined}
              onClick={() => stem(s.id)}
              title={zelf ? 'Op jezelf stemmen kan niet' : undefined}
            >
              <span className="z-mvp-foto">
                <Avatar naam={s.name} foto={s.photo_url} grootte={44} />
                {gekozen && <span className="z-mvp-vink"><Icoon naam="vink" grootte={12} dikte={3} /></span>}
              </span>
              <span className="z-mvp-naam">{zelf ? 'Jij' : s.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {fout && <p className="z-mvp-fout">{fout}</p>}

      <div className="z-mvp-voet">
        {aantal === 0 ? 'Nog niemand stemde.' : `${aantal} ${aantal === 1 ? 'lid stemde' : 'leden stemden'} al.`}
        {' '}De MVP wordt bekend op {sluit.toLocaleDateString('nl-BE', { weekday: 'long' })} om {sluit.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}.
      </div>
    </section>
  )
}

// ─── Na de stemming ──────────────────────────────────────────────────────────

function Uitslag({ w }) {
  const [rijen, setRijen] = useState(null)

  useEffect(() => {
    let actief = true
    supabase
      .from('mvp_uitslag')
      .select('player_id, stemmen, is_mvp')
      .eq('match_id', w.id)
      .order('stemmen', { ascending: false })
      .then(({ data }) => { if (actief) setRijen(data ?? []) })
    return () => { actief = false }
  }, [w.id])

  if (rijen === null) return null

  const spelers = Object.fromEntries(spelersVan(w).map(s => [s.id, s]))
  const mvps = rijen.filter(r => r.is_mvp).map(r => ({ ...spelers[r.player_id], stemmen: r.stemmen })).filter(s => s.id)
  const totaal = rijen.reduce((t, r) => t + r.stemmen, 0)

  if (mvps.length === 0) {
    return (
      <section className="z-kaart z-mvp">
        <div className="z-mvp-kop">
          <span className="z-mvp-kroon z-mvp-kroon-dof"><Icoon naam="kroon" grootte={18} dikte={2.2} /></span>
          <div style={{ flex: 1 }}>
            <h2>Geen MVP</h2>
            <p>Er werd niet gestemd voor deze match.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="z-mvp-winnaar">
      <img src="/logo.png" alt="" aria-hidden="true" className="z-mvp-winnaar-logo" />
      <div className="z-mvp-winnaar-label">
        <Icoon naam="kroon" grootte={15} dikte={2.4} />
        {mvps.length > 1 ? 'MVP’s van de match' : 'MVP van de match'}
      </div>
      <div className="z-mvp-winnaar-rij">
        {mvps.map(s => (
          <div key={s.id} className="z-mvp-winnaar-speler">
            <span className="z-mvp-winnaar-foto"><Avatar naam={s.name} foto={s.photo_url} grootte={64} /></span>
            <div>
              <strong>{s.name}</strong>
              <small>{s.stemmen} van de {totaal} stemmen</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
