import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Chip, Icoon, Laden } from '../../../ui'
import { TabKop } from '../ui'

// Visueel schema van de database: elke tabel als kaart, gegroepeerd per
// onderwerp, met lijnen voor de verwijzingen (foreign keys). Het schema komt
// live uit de OpenAPI-beschrijving van Supabase (PostgREST) via de functie
// db-schema, want Supabase geeft die enkel vrij met de service-sleutel. Is die
// functie (nog) niet gedeployed, dan tonen we het schema zoals het uit de code
// en de migraties af te leiden is.

const GROEPEN = [
  { id: 'leden', titel: 'Leden', kleur: '#2f63ef', tabellen: ['profiles', 'players', 'push_subscriptions', 'app_bezoeken', 'player_badges', 'feedback'] },
  { id: 'competitie', titel: 'Competitie', kleur: '#15803d', tabellen: ['seasons', 'teams', 'matches', 'goals', 'match_players', 'match_availability', 'match_reactions'] },
  { id: 'pronostiek', titel: 'Pronostiek', kleur: '#7c3aed', tabellen: ['predictions', 'pronostiek_scores', 'pronostiek_stats', 'pronostiek_klassement', 'pronostiek_tellers'] },
  { id: 'communicatie', titel: 'Communicatie', kleur: '#d97706', tabellen: ['announcements', 'announcement_reads', 'quotes'] },
]

const UITLEG = {
  profiles: 'Account van elk lid: naam, rol, goedkeuring, koppeling met een spelersfiche',
  players: 'Spelersfiche: wie op het veld staat en in de stats verschijnt',
  push_subscriptions: 'Toestellen waarop pushmeldingen aanstaan',
  app_bezoeken: 'Per lid de dagen waarop de app geopend werd',
  player_badges: 'Badges die een admin met de hand toekende',
  feedback: 'Berichten via het feedbackformulier',
  seasons: 'Seizoenen',
  teams: 'Ploegen in de competitie, ZVK inbegrepen',
  matches: 'Alle wedstrijden, van ZVK en van de andere ploegen',
  goals: 'Doelpunten van ZVK, met scorer en assist',
  match_players: 'Wie meespeelde in een wedstrijd',
  match_availability: 'Opgave: doet mee, doet niet mee of komt kijken',
  match_reactions: "Emoji's onder een uitslag",
  predictions: 'Voorspellingen in de pronostiek',
  pronostiek_scores: 'View: punten per voorspelling',
  pronostiek_stats: 'View: pronostiektotalen per lid',
  pronostiek_klassement: 'View: klassement van de pronostiek',
  pronostiek_tellers: 'View: aantal voorspellingen per wedstrijd',
  announcements: 'Meldingen die als popup verschijnen',
  announcement_reads: 'Wie welke melding al las',
  quotes: 'Quotes op het startscherm',
}

// Terugval: afgeleid uit de migraties en de queries in de code.
// Formaat: kolom, type, en optioneel 'pk' of een verwijzing 'tabel.kolom'.
const VAST = {
  profiles: [['id', 'uuid', 'pk'], ['display_name', 'text'], ['email', 'text'], ['role', 'text'], ['approved', 'boolean'], ['player_id', 'uuid', 'players.id'], ['avatar_url', 'text'], ['nickname', 'text'], ['birth_date', 'date'], ['onboarding_done', 'boolean'], ['last_seen', 'timestamptz']],
  players: [['id', 'uuid', 'pk'], ['name', 'text'], ['photo_url', 'text'], ['nickname', 'text'], ['birth_date', 'date']],
  push_subscriptions: [['id', 'uuid', 'pk'], ['user_id', 'uuid', 'profiles.id'], ['endpoint', 'text'], ['subscription', 'jsonb'], ['created_at', 'timestamptz']],
  app_bezoeken: [['user_id', 'uuid', 'profiles.id'], ['dag', 'date']],
  player_badges: [['id', 'uuid', 'pk'], ['player_id', 'uuid', 'players.id'], ['badge_id', 'text'], ['earned_at', 'timestamptz'], ['notes', 'text'], ['awarded_by', 'uuid']],
  feedback: [['id', 'uuid', 'pk'], ['user_id', 'uuid', 'profiles.id'], ['categorie', 'text'], ['bericht', 'text'], ['created_at', 'timestamptz'], ['read_at', 'timestamptz']],
  seasons: [['id', 'uuid', 'pk'], ['name', 'text'], ['start_date', 'date']],
  teams: [['id', 'uuid', 'pk'], ['name', 'text'], ['is_zvk', 'boolean']],
  matches: [['id', 'uuid', 'pk'], ['season_id', 'uuid', 'seasons.id'], ['date', 'date'], ['time', 'time'], ['type', 'text'], ['location', 'text'], ['home_team_id', 'uuid', 'teams.id'], ['away_team_id', 'uuid', 'teams.id'], ['home_score', 'int'], ['away_score', 'int'], ['report', 'text'], ['availability_opens_at', 'timestamptz']],
  goals: [['id', 'uuid', 'pk'], ['match_id', 'uuid', 'matches.id'], ['scorer_id', 'uuid', 'players.id'], ['assist_id', 'uuid', 'players.id'], ['minute', 'int']],
  match_players: [['match_id', 'uuid', 'matches.id'], ['player_id', 'uuid', 'players.id']],
  match_availability: [['id', 'uuid', 'pk'], ['match_id', 'uuid', 'matches.id'], ['player_id', 'uuid', 'players.id'], ['user_id', 'uuid', 'profiles.id'], ['status', 'text'], ['updated_at', 'timestamptz']],
  match_reactions: [['match_id', 'uuid', 'matches.id'], ['user_id', 'uuid', 'profiles.id'], ['emoji', 'text']],
  predictions: [['id', 'uuid', 'pk'], ['match_id', 'uuid', 'matches.id'], ['user_id', 'uuid', 'profiles.id'], ['naam', 'text'], ['home_score', 'smallint'], ['away_score', 'smallint'], ['created_at', 'timestamptz'], ['updated_at', 'timestamptz']],
  pronostiek_scores: [['match_id', 'uuid'], ['user_id', 'uuid'], ['punten', 'int'], ['durfbonus', 'boolean']],
  pronostiek_stats: [['user_id', 'uuid'], ['player_id', 'uuid'], ['voorspellingen', 'int'], ['exacte', 'int'], ['durfbonussen', 'int'], ['punten', 'int']],
  pronostiek_klassement: [['user_id', 'uuid'], ['naam', 'text'], ['punten', 'int']],
  pronostiek_tellers: [['match_id', 'uuid'], ['aantal', 'int']],
  announcements: [['id', 'uuid', 'pk'], ['emoji', 'text'], ['title', 'text'], ['message', 'text'], ['image_url', 'text'], ['is_active', 'boolean'], ['created_at', 'timestamptz']],
  announcement_reads: [['announcement_id', 'uuid', 'announcements.id'], ['user_id', 'uuid', 'profiles.id']],
  quotes: [['id', 'uuid', 'pk'], ['tekst', 'text'], ['auteur', 'text'], ['actief', 'boolean'], ['created_at', 'timestamptz']],
}

function vastSchema() {
  return Object.fromEntries(Object.entries(VAST).map(([tabel, kolommen]) => [tabel, kolommen.map(([naam, type, extra]) => ({
    naam, type,
    pk: extra === 'pk',
    fk: extra && extra !== 'pk' ? { tabel: extra.split('.')[0], kolom: extra.split('.')[1] } : null,
  }))]))
}

// PostgREST zet sleutels in de beschrijving van een kolom:
//   "This is a Primary Key.<pk/>"
//   "This is a Foreign Key to `teams.id`.<fk table='teams' column='id'/>"
function leesOpenApi(spec) {
  const uit = {}
  for (const [tabel, def] of Object.entries(spec?.definitions ?? {})) {
    uit[tabel] = Object.entries(def.properties ?? {}).map(([naam, p]) => {
      const fk = /<fk table='([^']+)' column='([^']+)'\/>/.exec(p.description ?? '')
      return {
        naam,
        type: (p.format ?? p.type ?? '').replace('timestamp with time zone', 'timestamptz').replace('character varying', 'varchar'),
        pk: (p.description ?? '').includes('<pk/>'),
        fk: fk ? { tabel: fk[1], kolom: fk[2] } : null,
      }
    })
  }
  return uit
}

async function haalSchema() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-schema`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const schema = leesOpenApi(await res.json())
    if (Object.keys(schema).length === 0) throw new Error('leeg schema')
    // Views en tabellen die PostgREST verbergt, vullen we aan uit het vaste schema
    for (const [tabel, kolommen] of Object.entries(vastSchema())) schema[tabel] ??= kolommen
    return { schema, live: true }
  } catch {
    return { schema: vastSchema(), live: false }
  }
}

// ─── Tabblad ─────────────────────────────────────────────────────────────────

export default function TabDatabase() {
  const [data, setData] = useState(null)
  const [actief, setActief] = useState(null) // geselecteerde tabel
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    let levend = true
    haalSchema().then(r => { if (levend) setData(r) })
    return () => { levend = false }
  }, [])

  // Groepen aanvullen met tabellen die nergens bij staan
  const groepen = useMemo(() => {
    if (!data) return []
    const bekend = new Set(GROEPEN.flatMap(g => g.tabellen))
    const overig = Object.keys(data.schema).filter(t => !bekend.has(t)).sort()
    const lijst = GROEPEN.map(g => ({ ...g, tabellen: g.tabellen.filter(t => data.schema[t]) }))
    if (overig.length) lijst.push({ id: 'overig', titel: 'Overig', kleur: '#64748b', tabellen: overig })
    return lijst.filter(g => g.tabellen.length)
  }, [data])

  const verbanden = useMemo(() => {
    if (!data) return []
    const lijst = []
    for (const [tabel, kolommen] of Object.entries(data.schema)) {
      for (const k of kolommen) if (k.fk && data.schema[k.fk.tabel]) lijst.push({ van: tabel, kolom: k.naam, naar: k.fk.tabel, naarKolom: k.fk.kolom })
    }
    return lijst
  }, [data])

  if (!data) return <Laden regels={6} />

  const kleurVan = Object.fromEntries(groepen.flatMap(g => g.tabellen.map(t => [t, g.kleur])))
  const buren = actief ? new Set([actief, ...verbanden.filter(v => v.van === actief || v.naar === actief).flatMap(v => [v.van, v.naar])]) : null
  const term = zoek.trim().toLowerCase()
  const treft = t => !term || t.includes(term) || data.schema[t].some(k => k.naam.includes(term))
  const aantalKolommen = Object.values(data.schema).reduce((n, k) => n + k.length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TabKop
        titel="Database"
        subtitel={`${Object.keys(data.schema).length} tabellen en views · ${aantalKolommen} kolommen · ${verbanden.length} verwijzingen`}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Chip toon={data.live ? 'winst' : 'gelijk'}>
          {data.live ? 'Live uit Supabase' : 'Afgeleid uit de code'}
        </Chip>
        {!data.live && (
          <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>
            Deploy de functie <code>db-schema</code> voor het live schema.
          </span>
        )}
        <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>
          Klik op een tabel om haar verbanden te zien.
        </span>
        <div className="z-zoekveld" style={{ marginLeft: 'auto' }}>
          <Icoon naam="zoek" grootte={16} dikte={2} />
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek tabel of kolom" aria-label="Zoek tabel of kolom" />
        </div>
      </div>

      <Diagram
        groepen={groepen}
        schema={data.schema}
        verbanden={verbanden}
        kleurVan={kleurVan}
        actief={actief}
        buren={buren}
        treft={treft}
        term={term}
        onKies={t => setActief(a => (a === t ? null : t))}
      />

      <Legende />
    </div>
  )
}

// ─── Diagram met lijnen ──────────────────────────────────────────────────────

function Diagram({ groepen, schema, verbanden, kleurVan, actief, buren, treft, term, onKies }) {
  const vlak = useRef(null)
  const [lijnen, setLijnen] = useState([])
  const [maat, setMaat] = useState({ b: 0, h: 0 })

  // Posities meten na elke render en bij elke formaatwijziging
  useLayoutEffect(() => {
    const el = vlak.current
    if (!el) return
    function meet() {
      const basis = el.getBoundingClientRect()
      const rij = (tabel, kolom) => el.querySelector(`[data-rij="${tabel}.${kolom}"]`)
      const uit = []
      for (const v of verbanden) {
        const a = rij(v.van, v.kolom)
        const b = rij(v.naar, v.naarKolom) ?? el.querySelector(`[data-tabel="${v.naar}"]`)
        if (!a || !b) continue
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
        const ay = ra.top + ra.height / 2 - basis.top
        const by = rb.top + Math.min(rb.height, 34) / 2 - basis.top
        // Vertrek aan de kant die naar het doel wijst
        const rechts = rb.left + rb.width / 2 > ra.left + ra.width / 2
        const zelfdeKolom = Math.abs(ra.left - rb.left) < 20
        const ax = (rechts || zelfdeKolom ? ra.right : ra.left) - basis.left
        const bx = (zelfdeKolom ? rb.right : rechts ? rb.left : rb.right) - basis.left
        const boog = zelfdeKolom ? 46 : Math.max(40, Math.abs(bx - ax) / 2)
        const c1 = zelfdeKolom || rechts ? ax + boog : ax - boog
        const c2 = zelfdeKolom ? bx + boog : rechts ? bx - boog : bx + boog
        uit.push({ ...v, d: `M ${ax} ${ay} C ${c1} ${ay}, ${c2} ${by}, ${bx} ${by}`, bx, by })
      }
      setLijnen(uit)
      setMaat({ b: el.scrollWidth, h: el.scrollHeight })
    }
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    return () => ro.disconnect()
  }, [verbanden, groepen, term])

  return (
    <div className="z-kaart" style={{ overflowX: 'auto', background: 'var(--z-vlak)' }}>
      <div ref={vlak} className="z-db-vlak">
        <svg className="z-db-lijnen" width={maat.b} height={maat.h} aria-hidden="true">
          {lijnen.map((l, i) => {
            const aan = !actief || l.van === actief || l.naar === actief
            const kleur = kleurVan[l.van] ?? '#94a3b8'
            return (
              <g key={i} style={{ opacity: aan ? (actief ? 1 : 0.45) : 0.06, transition: 'opacity 0.2s' }}>
                <path d={l.d} fill="none" stroke={kleur} strokeWidth={actief && aan ? 2 : 1.4} />
                <circle cx={l.bx} cy={l.by} r="3.2" fill={kleur} />
              </g>
            )
          })}
        </svg>

        {groepen.map(g => (
          <div key={g.id} className="z-db-groep">
            <div className="z-db-groepkop" style={{ color: g.kleur }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.kleur }} />
              {g.titel}
            </div>
            {g.tabellen.map(t => (
              <TabelKaart
                key={t}
                naam={t}
                kolommen={schema[t]}
                kleur={g.kleur}
                actief={actief === t}
                gedimd={(buren && !buren.has(t)) || !treft(t)}
                term={term}
                onKies={() => onKies(t)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TabelKaart({ naam, kolommen, kleur, actief, gedimd, term, onKies }) {
  const isView = UITLEG[naam]?.startsWith('View')
  return (
    <div
      data-tabel={naam}
      className="z-db-tabel"
      onClick={onKies}
      style={{
        opacity: gedimd ? 0.3 : 1,
        borderColor: actief ? kleur : undefined,
        boxShadow: actief ? `0 0 0 3px ${kleur}33, var(--z-schaduw)` : undefined,
      }}
      title={UITLEG[naam]}
    >
      <div className="z-db-tabelkop" style={{ borderTopColor: kleur }}>
        <Icoon naam={isView ? 'zoek' : 'archief'} grootte={14} style={{ color: kleur }} />
        <span>{naam}</span>
        {isView && <span className="z-db-view">view</span>}
      </div>
      {UITLEG[naam] && <div className="z-db-uitleg">{UITLEG[naam]}</div>}
      <div>
        {kolommen.map(k => (
          <div
            key={k.naam}
            data-rij={`${naam}.${k.naam}`}
            className="z-db-kolom"
            style={term && k.naam.includes(term) ? { background: 'var(--z-gelijk-bg)' } : undefined}
          >
            <span className="z-db-sleutel">
              {k.pk ? <span title="Primaire sleutel" style={{ color: 'var(--z-goud)' }}>PK</span>
                : k.fk ? <span title={`Verwijst naar ${k.fk.tabel}.${k.fk.kolom}`} style={{ color: kleur }}>FK</span> : null}
            </span>
            <span className="z-db-naam" style={{ fontWeight: k.pk ? 700 : 500 }}>{k.naam}</span>
            <span className="z-db-type">{k.fk ? `→ ${k.fk.tabel}` : k.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Legende() {
  const stuk = { display: 'inline-flex', alignItems: 'center', gap: '6px' }
  return (
    <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--z-tekst-3)' }}>
      <span style={stuk}><b style={{ color: 'var(--z-goud)', fontSize: '10px' }}>PK</b> primaire sleutel</span>
      <span style={stuk}><b style={{ color: 'var(--z-blauw)', fontSize: '10px' }}>FK</b> verwijst naar een andere tabel</span>
      <span style={stuk}><svg width="28" height="8"><path d="M0 4 H22" stroke="var(--z-tekst-4)" strokeWidth="1.4" /><circle cx="24" cy="4" r="3" fill="var(--z-tekst-4)" /></svg> lijn eindigt bij de tabel waarnaar verwezen wordt</span>
      <span style={stuk}><span className="z-db-view">view</span> berekende tabel, alleen lezen</span>
    </div>
  )
}
