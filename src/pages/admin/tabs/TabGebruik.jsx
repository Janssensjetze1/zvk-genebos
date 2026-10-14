import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useSeason } from '../../../context/SeasonContext'
import { computeStats, badgesMetStatus } from '../../../lib/badgeStats'
import { BADGES, badgesVoor } from '../../../data/badges'
import { isGespeeld, vandaagISO } from '../../../lib/wedstrijd'
import { Avatar, Chip, Icoon, Laden, Segment, Stat, hoofdletter } from '../../../ui'
import { TabKop } from '../ui'

// Hoe wordt de app gebruikt? Alles komt uit bestaande tabellen. Een tabel die
// (nog) niet bestaat of die een admin niet mag lezen, telt gewoon als leeg.

const DAG = 86400000
const SLAPEND_NA = 30 // dagen

const ONDERDELEN = [
  { waarde: 'overzicht', label: 'Overzicht' },
  { waarde: 'leden', label: 'Per lid' },
  { waarde: 'meldingen', label: 'Meldingen' },
  { waarde: 'opgave', label: 'Opgave' },
  { waarde: 'pronostiek', label: 'Pronostiek' },
  { waarde: 'badges', label: 'Badges' },
]

// Niet elk profiel heeft een display_name: val terug op de spelersfiche of het e-mailadres
const naamVan = p => p?.display_name || p?.players?.name || p?.email || 'Zonder naam'

function dagenSinds(iso, nu) {
  return iso ? Math.floor((nu - new Date(iso).getTime()) / DAG) : null
}

function sindsTekst(iso, nu) {
  const dagen = dagenSinds(iso, nu)
  if (dagen == null) return 'nooit'
  if (dagen <= 0) return 'vandaag'
  if (dagen === 1) return 'gisteren'
  if (dagen < 7) return `${dagen} dagen geleden`
  if (dagen < 30) return `${Math.floor(dagen / 7)} ${dagen < 14 ? 'week' : 'weken'} geleden`
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const kortDatum = iso => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  .toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }).replace('.', '')

function groepeer(rijen, sleutel) {
  const uit = {}
  for (const r of rijen) {
    const k = r[sleutel]
    if (!k) continue
    ;(uit[k] ??= []).push(r)
  }
  return uit
}

const Leeg = () => <span style={{ color: 'var(--z-tekst-4)' }}>–</span>

// ─── Gegevens ophalen ────────────────────────────────────────────────────────

function useGebruikData(seizoenId) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let levend = true
    const leeg = { data: [], error: null }
    const veilig = p => Promise.resolve(p).then(r => (r.error ? { ...leeg, error: r.error } : r), e => ({ ...leeg, error: e }))
    const sinds = new Date(Date.now() - 84 * DAG).toISOString().slice(0, 10)
    Promise.all([
      supabase.from('profiles').select('*, players(name)'),
      veilig(supabase.from('push_subscriptions').select('user_id')),
      veilig(supabase.from('match_reactions').select('user_id, emoji, match_id, match:match_id(date, home_team:home_team_id(name), away_team:away_team_id(name))')),
      veilig(supabase.from('match_availability').select('user_id, match_id, status, match:match_id(date)')),
      veilig(supabase.from('predictions').select('user_id')),
      veilig(supabase.from('feedback').select('user_id')),
      veilig(supabase.from('announcements').select('*').order('created_at', { ascending: false })),
      veilig(supabase.from('announcement_reads').select('announcement_id, user_id')),
      seizoenId
        ? veilig(supabase.from('matches').select('id, date, time, home_score, away_score, home_team:home_team_id(name, is_zvk), away_team:away_team_id(name, is_zvk), match_players(player_id), goals(id)').eq('season_id', seizoenId))
        : leeg,
      veilig(supabase.from('pronostiek_stats').select('*')),
      veilig(supabase.from('goals').select('scorer_id, assist_id, match_id, match:match_id(season_id)')),
      veilig(supabase.from('match_players').select('player_id, match_id, match:match_id(season_id, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk))')),
      veilig(supabase.from('player_badges').select('player_id, badge_id')),
      veilig(supabase.from('app_bezoeken').select('user_id, dag').gte('dag', sinds)),
    ]).then(([profielen, push, reacties, opgaves, voorspellingen, feedback, meldingen, gelezen, wedstrijden, prono, goals, matchPlayers, handBadges, bezoeken]) => {
      if (!levend) return
      setData({
        nu: Date.now(),
        fout: profielen.error?.message ?? null,
        profielen: (profielen.data ?? []).filter(p => p.approved),
        push: push.data ?? [],
        reacties: reacties.data ?? [],
        opgaves: opgaves.data ?? [],
        voorspellingen: voorspellingen.data ?? [],
        feedback: feedback.data ?? [],
        meldingen: meldingen.data ?? [],
        gelezen: gelezen.data ?? [],
        wedstrijden: wedstrijden.data ?? [],
        prono: prono.data ?? [],
        goals: goals.data ?? [],
        matchPlayers: matchPlayers.data ?? [],
        handBadges: handBadges.data ?? [],
        bezoeken: bezoeken.data ?? [],
        bezoekenBeschikbaar: !bezoeken.error,
      })
    })
    return () => { levend = false }
  }, [seizoenId])

  return data
}

// Alles per lid samengevat, inclusief de badges die iemand verdiend heeft
function useLeden(data, seizoenId) {
  return useMemo(() => {
    if (!data) return []
    const vandaag = vandaagISO()
    const pushPer = groepeer(data.push, 'user_id')
    const voorspPer = groepeer(data.voorspellingen, 'user_id')
    const feedbackPer = groepeer(data.feedback, 'user_id')
    const reactiesPer = groepeer(data.reacties, 'user_id')
    const opgavePer = groepeer(data.opgaves, 'user_id')
    const pronoPer = Object.fromEntries(data.prono.filter(p => p.user_id).map(p => [p.user_id, p]))
    const goalsPer = groepeer(data.goals, 'scorer_id')
    const assistsPer = groepeer(data.goals, 'assist_id')
    const matchenPer = groepeer(data.matchPlayers, 'player_id')
    const handPer = groepeer(data.handBadges, 'player_id')

    return data.profielen.map(p => {
      const emojis = {}
      for (const r of reactiesPer[p.id] ?? []) emojis[r.emoji] = (emojis[r.emoji] ?? 0) + 1
      const opgave = { mee: 0, niet: 0, kijken: 0 }
      for (const o of opgavePer[p.id] ?? []) opgave[o.status] = (opgave[o.status] ?? 0) + 1
      const bekeken = (opgavePer[p.id] ?? []).filter(o => o.status === 'kijken' && o.match?.date && o.match.date < vandaag).length
      const prono = pronoPer[p.id] ?? null

      const stats = computeStats({
        goalsArr: p.player_id ? goalsPer[p.player_id] ?? [] : [],
        assistsArr: p.player_id ? assistsPer[p.player_id] ?? [] : [],
        matchesArr: p.player_id ? matchenPer[p.player_id] ?? [] : [],
        seizoenId,
        userCreatedAt: p.created_at,
        pronostiek: prono,
        supporter: { bekeken, reacties: (reactiesPer[p.id] ?? []).length },
      })
      const handIds = new Set((p.player_id ? handPer[p.player_id] ?? [] : []).map(b => b.badge_id))
      const badges = badgesMetStatus(badgesVoor(!!p.player_id), stats, handIds).filter(b => b.verdiend)

      return {
        ...p,
        naam: naamVan(p),
        toestellen: (pushPer[p.id] ?? []).length,
        emojis,
        reacties: (reactiesPer[p.id] ?? []).length,
        opgave,
        voorspellingen: (voorspPer[p.id] ?? []).length,
        feedback: (feedbackPer[p.id] ?? []).length,
        prono,
        badges,
      }
    })
  }, [data, seizoenId])
}

// ─── Tabblad ─────────────────────────────────────────────────────────────────

export default function TabGebruik() {
  const { actief: seizoen } = useSeason()
  const data = useGebruikData(seizoen?.id)
  const leden = useLeden(data, seizoen?.id)
  const [onderdeel, setOnderdeel] = useState('overzicht')

  if (!data) return <Laden regels={6} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <TabKop titel="Gebruik" subtitel="Hoe de leden de app gebruiken. Enkel goedgekeurde leden tellen mee." />

      {data.fout && (
        <div className="z-kaart z-kaart-pad" style={{ background: 'var(--z-verlies-bg)', borderColor: 'var(--z-verlies-rand)', color: 'var(--z-verlies)', fontSize: '13px' }}>
          De leden konden niet geladen worden: {data.fout}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <Segment opties={ONDERDELEN} waarde={onderdeel} onChange={setOnderdeel} />
      </div>

      {onderdeel === 'overzicht' && <Overzicht data={data} leden={leden} />}
      {onderdeel === 'leden' && <PerLid data={data} leden={leden} />}
      {onderdeel === 'meldingen' && <Meldingen data={data} leden={leden} />}
      {onderdeel === 'opgave' && <OpgavePerMatch data={data} leden={leden} />}
      {onderdeel === 'pronostiek' && <Pronostiek leden={leden} />}
      {onderdeel === 'badges' && <Badges leden={leden} />}
    </div>
  )
}

function Blok({ titel, meta, children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
        <h3 className="z-titel" style={{ fontSize: '15px', margin: 0 }}>{titel}</h3>
        {meta && <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--z-tekst-4)' }}>{meta}</span>}
      </div>
      {children}
    </section>
  )
}

function Naam({ lid, grootte = 26, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <Avatar naam={lid.naam} foto={lid.avatar_url} grootte={grootte} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lid.naam}</span>
      {children}
    </div>
  )
}

const LeegKaart = ({ children }) => (
  <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', margin: 0, padding: '16px 20px' }}>{children}</p>
)

// ─── Overzicht ───────────────────────────────────────────────────────────────

function Overzicht({ data, leden }) {
  const { nu } = data
  const actief7 = leden.filter(l => (dagenSinds(l.last_seen, nu) ?? 999) < 7).length
  const metPush = leden.filter(l => l.toestellen > 0).length
  const slapend = leden
    .filter(l => (dagenSinds(l.last_seen, nu) ?? 999) >= SLAPEND_NA)
    .sort((a, b) => (a.last_seen ?? '').localeCompare(b.last_seen ?? ''))
  const emojiTotaal = {}
  for (const r of data.reacties) emojiTotaal[r.emoji] = (emojiTotaal[r.emoji] ?? 0) + 1
  const emojiLijst = Object.entries(emojiTotaal).sort((a, b) => b[1] - a[1])
  const naamVanId = id => leden.find(l => l.id === id)?.naam ?? 'Onbekend lid'
  const recent = [...data.reacties]
    .filter(r => r.match?.date)
    .sort((a, b) => b.match.date.localeCompare(a.match.date))
    .slice(0, 8)

  // Verjaardagen in de komende 30 dagen
  const vandaag = new Date(nu); vandaag.setHours(0, 0, 0, 0)
  const jarig = leden
    .filter(l => l.birth_date)
    .map(l => {
      const g = new Date(`${l.birth_date}T00:00:00`)
      let volgende = new Date(vandaag.getFullYear(), g.getMonth(), g.getDate())
      if (volgende < vandaag) volgende = new Date(vandaag.getFullYear() + 1, g.getMonth(), g.getDate())
      return { lid: l, volgende, leeftijd: volgende.getFullYear() - g.getFullYear(), over: Math.round((volgende - vandaag) / DAG) }
    })
    .filter(j => j.over <= 30)
    .sort((a, b) => a.over - b.over)

  return (
    <>
      <div className="z-raster" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))' }}>
        <Stat label="Leden" waarde={leden.length} voet={`${leden.filter(l => l.player_id).length} met spelersfiche`} />
        <Stat label="Actief deze week" waarde={actief7} voet={`${Math.round((actief7 / Math.max(leden.length, 1)) * 100)}% van de leden`} />
        <Stat label="Push aan" waarde={metPush} voet={`${data.push.length} toestel${data.push.length === 1 ? '' : 'len'}`} />
        <Stat label="Reacties" waarde={data.reacties.length} voet={emojiLijst[0] ? `meest: ${emojiLijst[0][0]}` : 'nog geen'} />
        <Stat label="Voorspellingen" waarde={data.voorspellingen.length} voet={`${new Set(data.voorspellingen.map(v => v.user_id)).size} leden doen mee`} />
      </div>

      <Activiteit data={data} totaal={leden.length} />

      <div className="z-raster z-raster-2" style={{ alignItems: 'start' }}>
        <Blok titel="Slapende leden" meta={`${SLAPEND_NA}+ dagen niet online`}>
          <div className="z-kaart z-lijst">
            {slapend.length === 0 ? <LeegKaart>Iedereen was de laatste maand nog online.</LeegKaart> : slapend.map(l => (
              <div key={l.id} className="z-rij" style={{ padding: '10px 16px', minHeight: 0 }}>
                <Naam lid={l} />
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--z-tekst-4)', whiteSpace: 'nowrap' }}>{sindsTekst(l.last_seen, nu)}</span>
              </div>
            ))}
          </div>
        </Blok>

        <Blok titel="Verjaardagen" meta="komende 30 dagen">
          <div className="z-kaart z-lijst">
            {jarig.length === 0 ? <LeegKaart>Niemand jarig de komende maand.</LeegKaart> : jarig.map(j => (
              <div key={j.lid.id} className="z-rij" style={{ padding: '10px 16px', minHeight: 0 }}>
                <Naam lid={j.lid}><span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', whiteSpace: 'nowrap' }}>wordt {j.leeftijd}</span></Naam>
                <span style={{ marginLeft: 'auto', fontSize: '12px', whiteSpace: 'nowrap', color: j.over === 0 ? 'var(--z-winst)' : 'var(--z-tekst-3)', fontWeight: j.over === 0 ? 700 : 500 }}>
                  {j.over === 0 ? 'Vandaag 🎂' : j.over === 1 ? 'Morgen' : hoofdletter(j.volgende.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }))}
                </span>
              </div>
            ))}
          </div>
        </Blok>

        <Blok titel="Emoji's">
          <div className="z-kaart z-kaart-pad">
            {emojiLijst.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--z-tekst-4)', margin: 0 }}>Nog geen reacties.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {emojiLijst.map(([e, n]) => (
                  <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '22px', width: '30px', textAlign: 'center' }}>{e}</span>
                    <div className="z-gebruik-balk"><div style={{ width: `${(n / emojiLijst[0][1]) * 100}%` }} /></div>
                    <span className="z-tab-nums" style={{ width: '32px', textAlign: 'right', fontWeight: 700, color: 'var(--z-tekst)' }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Blok>

        <Blok titel="Laatste reacties">
          <div className="z-kaart z-lijst">
            {recent.length === 0 ? <LeegKaart>Nog geen reacties.</LeegKaart> : recent.map((r, i) => (
              <div key={i} className="z-rij" style={{ padding: '10px 16px', minHeight: 0, gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{r.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst)' }}>{naamVanId(r.user_id)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.match.home_team?.name} – {r.match.away_team?.name}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', whiteSpace: 'nowrap' }}>{kortDatum(r.match.date)}</span>
              </div>
            ))}
          </div>
        </Blok>
      </div>
    </>
  )
}

// Unieke leden per week, de laatste 12 weken (tabel app_bezoeken)
function Activiteit({ data, totaal }) {
  if (!data.bezoekenBeschikbaar) {
    return (
      <Blok titel="Activiteit per week">
        <div className="z-kaart z-kaart-pad" style={{ fontSize: '13px', color: 'var(--z-tekst-3)', lineHeight: 1.6 }}>
          Nog niet beschikbaar. Voer de migratie <code>supabase/migrations/app_bezoeken.sql</code> uit in Supabase.
          Vanaf dan houdt de app per dag bij wie ze opende, en vult deze grafiek zich week na week.
        </div>
      </Blok>
    )
  }

  const maandag = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
  const dezeWeek = maandag(data.nu)
  const weken = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(dezeWeek); start.setDate(start.getDate() - (11 - i) * 7)
    return { start, leden: new Set() }
  })
  for (const b of data.bezoeken) {
    const m = maandag(`${b.dag}T00:00:00`).getTime()
    weken.find(w => w.start.getTime() === m)?.leden.add(b.user_id)
  }
  const max = Math.max(totaal, 1)

  return (
    <Blok titel="Activiteit per week" meta="unieke leden die de app openden">
      <div className="z-kaart z-kaart-pad">
        <div className="z-gebruik-grafiek">
          {weken.map((w, i) => {
            const n = w.leden.size
            return (
              <div key={i} className="z-gebruik-kolom" title={`Week van ${kortDatum(w.start.toISOString())}: ${n} leden`}>
                <span className="z-tab-nums">{n || ''}</span>
                <div style={{ height: `${Math.max((n / max) * 100, n ? 4 : 0)}%`, opacity: i === 11 ? 1 : 0.7 }} />
                <small>{kortDatum(w.start.toISOString())}</small>
              </div>
            )
          })}
        </div>
      </div>
    </Blok>
  )
}

// ─── Per lid ─────────────────────────────────────────────────────────────────

function PerLid({ data, leden }) {
  const [sorteer, setSorteer] = useState('online')
  const { nu } = data

  const lijst = useMemo(() => {
    const kopie = [...leden]
    const naam = (a, b) => a.naam.localeCompare(b.naam)
    if (sorteer === 'online') kopie.sort((a, b) => (b.last_seen ?? '').localeCompare(a.last_seen ?? '') || naam(a, b))
    if (sorteer === 'reacties') kopie.sort((a, b) => b.reacties - a.reacties || naam(a, b))
    if (sorteer === 'badges') kopie.sort((a, b) => b.badges.length - a.badges.length || naam(a, b))
    if (sorteer === 'naam') kopie.sort(naam)
    return kopie
  }, [leden, sorteer])

  return (
    <Blok titel={`${leden.length} leden`}>
      <div style={{ marginBottom: '10px' }}>
        <Segment waarde={sorteer} onChange={setSorteer} opties={[
          { waarde: 'online', label: 'Laatst online' },
          { waarde: 'reacties', label: 'Reacties' },
          { waarde: 'badges', label: 'Badges' },
          { waarde: 'naam', label: 'Naam' },
        ]} />
      </div>
      <div className="z-kaart" style={{ overflowX: 'auto' }}>
        <table className="z-tabel z-gebruik">
          <thead>
            <tr>
              <th className="links">Lid</th>
              <th className="links">Laatst online</th>
              <th>Push</th>
              <th className="links">Reacties</th>
              <th title="Doet mee / doet niet mee / komt kijken">Opgave</th>
              <th title="Voorspellingen in de pronostiek">Pronostiek</th>
              <th>Badges</th>
              <th>Feedback</th>
              <th className="links" title="Wat ontbreekt er nog aan het profiel?">Profiel</th>
            </tr>
          </thead>
          <tbody>
            {lijst.map(l => {
              const ontbreekt = [!l.avatar_url && 'foto', !l.birth_date && 'verjaardag', !l.player_id && 'fiche'].filter(Boolean)
              return (
                <tr key={l.id}>
                  <td className="links">
                    <Naam lid={l} grootte={28}>
                      {l.role === 'admin' && <Chip toon="blauw">Admin</Chip>}
                      {!l.player_id && <Chip>Supporter</Chip>}
                    </Naam>
                  </td>
                  <td className="links" style={{ whiteSpace: 'nowrap', color: l.last_seen ? 'var(--z-tekst-2)' : 'var(--z-tekst-4)' }}>{sindsTekst(l.last_seen, nu)}</td>
                  <td>
                    {l.toestellen > 0 ? (
                      <span title={`${l.toestellen} toestel${l.toestellen === 1 ? '' : 'len'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--z-winst)', fontWeight: 600 }}>
                        <Icoon naam="bel" grootte={15} dikte={2} />{l.toestellen > 1 ? l.toestellen : ''}
                      </span>
                    ) : <Leeg />}
                  </td>
                  <td className="links">
                    {l.reacties > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {Object.entries(l.emojis).sort((a, b) => b[1] - a[1]).map(([e, n]) => (
                          <span key={e} className="z-gebruik-emoji">{e}<b>{n}</b></span>
                        ))}
                      </div>
                    ) : <Leeg />}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {l.opgave.mee + l.opgave.niet + l.opgave.kijken > 0 ? (
                      <span className="z-tab-nums">
                        <span style={{ color: 'var(--z-winst)' }}>{l.opgave.mee}</span>
                        <span style={{ color: 'var(--z-tekst-4)' }}> / </span>
                        <span style={{ color: 'var(--z-verlies)' }}>{l.opgave.niet}</span>
                        <span style={{ color: 'var(--z-tekst-4)' }}> / </span>
                        <span style={{ color: 'var(--z-tekst-3)' }}>{l.opgave.kijken}</span>
                      </span>
                    ) : <Leeg />}
                  </td>
                  <td>{l.voorspellingen || <Leeg />}</td>
                  <td>{l.badges.length || <Leeg />}</td>
                  <td>{l.feedback || <Leeg />}</td>
                  <td className="links" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {ontbreekt.length === 0
                      ? <span style={{ color: 'var(--z-winst)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icoon naam="vink" grootte={14} dikte={2.4} /> volledig</span>
                      : <span style={{ color: 'var(--z-tekst-4)' }}>geen {ontbreekt.join(', ')}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '8px' }}>
        Opgave: <span style={{ color: 'var(--z-winst)' }}>doet mee</span> / <span style={{ color: 'var(--z-verlies)' }}>doet niet mee</span> / komt kijken.
        Push telt de toestellen waarop meldingen aanstaan.
      </p>
    </Blok>
  )
}

// ─── Meldingen: wie las wat? ─────────────────────────────────────────────────

function Meldingen({ data, leden }) {
  const [open, setOpen] = useState(null)
  const gelezenPer = groepeer(data.gelezen, 'announcement_id')

  if (data.meldingen.length === 0) {
    return <div className="z-kaart"><LeegKaart>Er zijn nog geen meldingen verstuurd.</LeegKaart></div>
  }

  return (
    <Blok titel="Bereik van meldingen" meta="klik op een melding voor wie ze nog niet las">
      <div className="z-kaart z-lijst">
        {data.meldingen.map(m => {
          const lezers = new Set((gelezenPer[m.id] ?? []).map(r => r.user_id))
          // Enkel leden die er al waren toen de melding verscheen
          const doelgroep = leden.filter(l => !l.created_at || !m.created_at || l.created_at <= m.created_at || lezers.has(l.id))
          const aantal = doelgroep.filter(l => lezers.has(l.id)).length
          const pct = Math.round((aantal / Math.max(doelgroep.length, 1)) * 100)
          const nietGelezen = doelgroep.filter(l => !lezers.has(l.id))
          const isOpen = open === m.id
          return (
            <div key={m.id}>
              <div className="z-rij z-rij-klik" style={{ padding: '12px 16px', gap: '12px' }} onClick={() => setOpen(isOpen ? null : m.id)}>
                <span style={{ fontSize: '20px', width: '26px', textAlign: 'center' }}>{m.emoji ?? '📣'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title ?? 'Zonder titel'}</span>
                    {m.is_active && <Chip toon="winst">Actief</Chip>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <div className="z-gebruik-balk" style={{ maxWidth: '260px' }}><div style={{ width: `${pct}%` }} /></div>
                    <span className="z-tab-nums" style={{ fontSize: '12px', color: 'var(--z-tekst-3)', whiteSpace: 'nowrap' }}>{aantal} van {doelgroep.length} gelezen</span>
                  </div>
                </div>
                {m.created_at && <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', whiteSpace: 'nowrap' }}>{kortDatum(m.created_at)}</span>}
                <Icoon naam="chevronOmlaag" grootte={16} className="z-chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {isOpen && (
                <div style={{ padding: '4px 16px 14px 54px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {nietGelezen.length === 0
                    ? <span style={{ fontSize: '13px', color: 'var(--z-winst)' }}>Iedereen heeft ze gelezen.</span>
                    : <>
                      <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)', width: '100%' }}>Nog niet gelezen:</span>
                      {nietGelezen.map(l => <Chip key={l.id}>{l.naam}</Chip>)}
                    </>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Blok>
  )
}

// ─── Opgave: wie reageert per wedstrijd? ─────────────────────────────────────

function OpgavePerMatch({ data, leden }) {
  const spelers = leden.filter(l => l.player_id)
  const opgavePerMatch = groepeer(data.opgaves, 'match_id')
  // ZVK-wedstrijden van dit seizoen met een opgave, of al gespeeld
  const matchen = data.wedstrijden
    .filter(w => (w.home_team?.is_zvk || w.away_team?.is_zvk) && (opgavePerMatch[w.id]?.length || isGespeeld(w)))
    .sort((a, b) => b.date.localeCompare(a.date))

  // Hoe vaak reageerde elke speler op de opgave?
  const metOpgave = matchen.filter(w => opgavePerMatch[w.id]?.length)
  const respons = spelers.map(l => {
    const n = metOpgave.filter(w => opgavePerMatch[w.id].some(o => o.user_id === l.id)).length
    return { lid: l, n, pct: metOpgave.length ? Math.round((n / metOpgave.length) * 100) : 0 }
  }).sort((a, b) => a.pct - b.pct || a.lid.naam.localeCompare(b.lid.naam))

  if (matchen.length === 0) {
    return <div className="z-kaart"><LeegKaart>Nog geen wedstrijden met een opgave dit seizoen.</LeegKaart></div>
  }

  return (
    <div className="z-raster z-raster-2" style={{ alignItems: 'start' }}>
      <Blok titel="Per wedstrijd" meta={`${spelers.length} spelers met fiche`}>
        <div className="z-kaart z-lijst">
          {matchen.map(w => {
            const rijen = opgavePerMatch[w.id] ?? []
            const tel = s => rijen.filter(o => o.status === s).length
            const gereageerd = new Set(rijen.filter(o => spelers.some(s => s.id === o.user_id)).map(o => o.user_id)).size
            const tegenstander = w.home_team?.is_zvk ? w.away_team?.name : w.home_team?.name
            return (
              <div key={w.id} className="z-rij" style={{ padding: '12px 16px', gap: '12px', alignItems: 'flex-start' }}>
                <span className="z-tab-nums" style={{ width: '44px', fontSize: '12px', color: 'var(--z-tekst-4)', paddingTop: '2px' }}>{kortDatum(w.date)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.home_team?.is_zvk ? 'Tegen' : 'Bij'} {tegenstander}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <Chip toon="winst">{tel('mee')} mee</Chip>
                    <Chip toon="verlies">{tel('niet')} niet</Chip>
                    <Chip>{tel('kijken')} kijken</Chip>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="z-tab-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--z-tekst)' }}>{gereageerd}/{spelers.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--z-tekst-4)' }}>reageerden</div>
                </div>
              </div>
            )
          })}
        </div>
      </Blok>

      <Blok titel="Reageert op de opgave" meta={`over ${metOpgave.length} wedstrijd${metOpgave.length === 1 ? '' : 'en'}`}>
        <div className="z-kaart z-lijst">
          {respons.length === 0 ? <LeegKaart>Nog geen spelers met een fiche.</LeegKaart> : respons.map(r => (
            <div key={r.lid.id} className="z-rij" style={{ padding: '10px 16px', minHeight: 0, gap: '12px' }}>
              <Naam lid={r.lid} />
              <div className="z-gebruik-balk" style={{ maxWidth: '110px', marginLeft: 'auto' }}>
                <div style={{ width: `${r.pct}%`, background: r.pct < 50 ? 'var(--z-verlies)' : r.pct < 80 ? 'var(--z-gelijk)' : 'var(--z-winst)' }} />
              </div>
              <span className="z-tab-nums" style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst-2)' }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </Blok>
    </div>
  )
}

// ─── Pronostiek ──────────────────────────────────────────────────────────────

function Pronostiek({ leden }) {
  const lijst = leden
    .filter(l => l.prono?.voorspellingen > 0)
    .sort((a, b) => (b.prono.punten ?? 0) - (a.prono.punten ?? 0) || a.naam.localeCompare(b.naam))
  const zonder = leden.filter(l => !(l.prono?.voorspellingen > 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Blok titel="Klassement" meta={`${lijst.length} van ${leden.length} leden doen mee`}>
        <div className="z-kaart" style={{ overflowX: 'auto' }}>
          {lijst.length === 0 ? <LeegKaart>Nog niemand voorspelde een wedstrijd.</LeegKaart> : (
            <table className="z-tabel z-gebruik">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="links">Lid</th>
                  <th>Voorspeld</th>
                  <th>Exact</th>
                  <th title="Durfbonussen">Durf</th>
                  <th title="Gemiddeld aantal punten per voorspelling">Gem.</th>
                  <th>Punten</th>
                </tr>
              </thead>
              <tbody>
                {lijst.map((l, i) => (
                  <tr key={l.id}>
                    <td style={{ color: 'var(--z-tekst-4)', fontWeight: 700 }}>{i + 1}</td>
                    <td className="links"><Naam lid={l} /></td>
                    <td>{l.prono.voorspellingen}</td>
                    <td>{l.prono.exacte ?? 0}</td>
                    <td>{l.prono.durfbonussen ?? 0}</td>
                    <td>{((l.prono.punten ?? 0) / l.prono.voorspellingen).toFixed(1).replace('.', ',')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--z-tekst)' }}>{l.prono.punten ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Blok>

      {zonder.length > 0 && (
        <Blok titel="Deed nog nooit mee" meta={`${zonder.length} leden`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {zonder.map(l => <Chip key={l.id}>{l.naam}</Chip>)}
          </div>
        </Blok>
      )}
    </div>
  )
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function Badges({ leden }) {
  const lijst = [...leden].sort((a, b) => b.badges.length - a.badges.length || a.naam.localeCompare(b.naam))
  const verdiendDoor = {}
  for (const l of leden) for (const b of l.badges) (verdiendDoor[b.id] ??= []).push(l)
  const niemand = BADGES.filter(b => !b.placeholder && !verdiendDoor[b.id])
  const zeldzaam = BADGES
    .filter(b => verdiendDoor[b.id]?.length)
    .sort((a, b) => verdiendDoor[a.id].length - verdiendDoor[b.id].length)
    .slice(0, 6)

  return (
    <div className="z-raster z-raster-2" style={{ alignItems: 'start' }}>
      <Blok titel="Meeste badges">
        <div className="z-kaart z-lijst">
          {lijst.map((l, i) => (
            <div key={l.id} className="z-rij" style={{ padding: '10px 16px', minHeight: 0, gap: '10px' }}>
              <span className="z-tab-nums" style={{ width: '20px', fontSize: '12px', fontWeight: 700, color: 'var(--z-tekst-4)' }}>{i + 1}</span>
              <Naam lid={l} />
              <span style={{ marginLeft: 'auto', display: 'flex', gap: '2px', fontSize: '15px' }} title={l.badges.map(b => b.naam).join(', ')}>
                {l.badges.slice(0, 6).map(b => <span key={b.id}>{b.emoji}</span>)}
              </span>
              <span className="z-tab-nums" style={{ width: '28px', textAlign: 'right', fontWeight: 700, color: 'var(--z-tekst)' }}>{l.badges.length}</span>
            </div>
          ))}
        </div>
      </Blok>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Blok titel="Zeldzaamste badges">
          <div className="z-kaart z-lijst">
            {zeldzaam.length === 0 ? <LeegKaart>Nog geen badges verdiend.</LeegKaart> : zeldzaam.map(b => (
              <div key={b.id} className="z-rij" style={{ padding: '10px 16px', minHeight: 0, gap: '10px' }}>
                <span style={{ fontSize: '20px', width: '26px', textAlign: 'center' }}>{b.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--z-tekst)' }}>{b.naam}</div>
                  <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {verdiendDoor[b.id].map(l => l.naam).join(', ')}
                  </div>
                </div>
                <Chip>{verdiendDoor[b.id].length}×</Chip>
              </div>
            ))}
          </div>
        </Blok>

        <Blok titel="Nog door niemand verdiend" meta={`${niemand.length} badges`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {niemand.map(b => (
              <span key={b.id} className="z-gebruik-emoji" style={{ height: '28px', padding: '0 10px', fontSize: '12px', fontWeight: 500 }}>
                {b.emoji} {b.naam}
              </span>
            ))}
          </div>
        </Blok>
      </div>
    </div>
  )
}
