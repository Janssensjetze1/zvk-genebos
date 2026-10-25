import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isGespeeld } from '../lib/wedstrijd'
import { opgaveIsOpen } from '../hooks/useOpgave'
import { pronostiekStatus } from '../hooks/usePronostiek'
import { useVerslag } from '../hooks/useVerslag'
import { opgaveOpentOp } from '../hooks/useOpgave'
import Opgave from './Opgave'
import Pronostiek from './Pronostiek'
import VerslagPaneel from './VerslagPaneel'
import MvpBlok from './MvpBlok'
import { naPenaltys } from '../lib/beker'
import { hoofdletter, Icoon, Laden, LegeStaat, TypeChip } from '../ui'

// Detailpagina van één wedstrijd: alles wat over deze match te weten valt op
// één plek, zodat de lijsten zelf kort kunnen blijven.
// Route: /wedstrijd/:id (desktop) en /app/wedstrijd/:id (PWA)

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const RONDE_ENKEL = { poule: 'Poulefase', achtste: 'Achtste finale', kwart: 'Kwartfinale', halve: 'Halve finale', finale: 'Finale' }

// "Eindstand", "Halve finale · eindstand", "… · na strafschoppen 4-3"
function kopTekst(w, gespeeld) {
  const ronde = w.type === 'beker' && w.beker_ronde ? `${RONDE_ENKEL[w.beker_ronde]} · ` : ''
  const stand = gespeeld ? 'eindstand' : 'nog te spelen'
  const pens = naPenaltys(w) ? ` · na strafschoppen ${w.home_pen}-${w.away_pen}` : ''
  const tekst = ronde + stand + pens
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}
const TYPE_COLORS = {
  competitie: { bg: 'var(--z-blauw-50)', color: 'var(--z-blauw)' },
  beker: { bg: 'var(--z-paars-bg)', color: 'var(--z-paars)' },
  vriendschappelijk: { bg: 'var(--z-lijn-zacht)', color: 'var(--z-tekst-2)' },
}

function Blok({ titel, children, rechts }) {
  return (
    <section className="z-kaart" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '14px 20px', borderBottom: '1px solid var(--z-lijn-zacht)',
      }}>
        <h2 style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--z-tekst)' }}>{titel}</h2>
        {rechts}
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </section>
  )
}

function Namenrij({ namen }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {namen.map((naam, i) => (
        <span key={`${naam}-${i}`} style={{
          fontSize: '12px', color: 'var(--z-tekst-2)', background: 'var(--z-vlak)',
          borderRadius: '20px', padding: '4px 10px', border: '1px solid var(--z-lijn)',
        }}>{naam}</span>
      ))}
    </div>
  )
}

function VerslagBlok({ wedstrijd, variant }) {
  const verslagState = useVerslag(wedstrijd)
  return <VerslagPaneel verslagState={verslagState} variant={variant} />
}

export default function WedstrijdDetail({ variant = 'pwa' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [w, setW] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let levend = true

    async function laad() {
      setLoading(true)
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(id,name,is_zvk),
          away_team:away_team_id(id,name,is_zvk),
          goals(id, scorer_id, assist_id, minute, scorer:scorer_id(name), assist:assist_id(name)),
          match_players(player_id, player:player_id(name, photo_url))
        `)
        .eq('id', id)
        .maybeSingle()
      if (!levend) return
      setW(data ?? null)
      setLoading(false)
    }

    laad()
    return () => { levend = false }
  }, [id])

  const buiten = variant === 'pwa' ? '16px 16px 24px' : '0'

  if (loading) {
    if (variant === 'desktop') return <div style={{ maxWidth: '760px' }}><Laden regels={4} /></div>
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--z-tekst-4)' }}>Laden...</div>
  }

  if (!w) {
    return (
      <div style={{ padding: buiten, maxWidth: '760px' }}>
        <LegeStaat titel="Niet gevonden" tekst="Deze wedstrijd bestaat niet (meer)." icoon="kalender" />
      </div>
    )
  }

  const gespeeld = isGespeeld(w)
  const datum = new Date(w.date)
  const isThuis = w.home_team?.is_zvk
  const onze = w.home_team?.is_zvk || w.away_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const gewonnen = gespeeld && onze && zvkScore > tegScore
  const verloren = gespeeld && onze && zvkScore < tegScore
  const typeKleur = TYPE_COLORS[w.type] ?? TYPE_COLORS.competitie

  const spelers = (w.match_players ?? [])
    .map(mp => mp.player?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  return (
    <div style={{ padding: buiten, maxWidth: variant === 'desktop' ? '760px' : '680px', display: 'flex', flexDirection: 'column', gap: variant === 'desktop' ? '20px' : '14px' }}>

      {/* Terug */}
      <button
        onClick={() => navigate(-1)}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--z-tekst-3)', fontSize: '13px', fontWeight: '600', padding: '4px 0',
        }}
      >
        <Icoon naam="terug" grootte={16} dikte={2.2} />
        Terug
      </button>

      {/* Kop */}
      {variant === 'desktop' ? (
        <Scorebord w={w} gespeeld={gespeeld} datum={datum} />
      ) : variant === 'pwa' ? (
        <ScorebordCompact w={w} gespeeld={gespeeld} datum={datum} />
      ) : (
      <div style={{
        background: 'var(--z-kaart)', border: '1px solid var(--z-lijn)', borderRadius: '18px',
        padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
            background: typeKleur.bg, color: typeKleur.color,
          }}>{TYPE_LABELS[w.type] ?? w.type}</span>
          <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>
            {datum.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {w.time ? ` · ${w.time.slice(0, 5)}` : ''}
          </span>
          {w.location && <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>· {w.location}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ flex: 1, fontSize: '17px', fontWeight: '700', color: 'var(--z-tekst)', textAlign: 'right' }}>
            {w.home_team?.name}
          </span>
          <span style={{
            flexShrink: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px',
            color: gewonnen ? 'var(--z-winst)' : verloren ? 'var(--z-verlies)' : 'var(--z-tekst)',
            background: 'var(--z-vlak)', border: '1px solid var(--z-lijn)',
            borderRadius: '12px', padding: '6px 14px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {gespeeld ? `${w.home_score}–${w.away_score}` : 'vs'}
          </span>
          <span style={{ flex: 1, fontSize: '17px', fontWeight: '700', color: 'var(--z-tekst)' }}>
            {w.away_team?.name}
          </span>
        </div>
      </div>
      )}

      {/* MVP: stemmen tot 48 uur na de aftrap, daarna de winnaar */}
      {gespeeld && onze && <MvpBlok wedstrijd={w} />}

      {/* Pronostiek: op deze pagina meteen open, dat is waarvoor je hier bent */}
      {pronostiekStatus(w) !== 'geen' && (
        <Blok titel="Pronostiek">
          <Pronostiek wedstrijd={w} standaardOpen />
        </Blok>
      )}

      {/* Opgave: met een regeltje zolang ze nog niet open staat */}
      {!gespeeld && onze && (
        <Blok titel="Opgave">
          {opgaveIsOpen(w) ? (
            <Opgave wedstrijd={w} />
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', margin: 0, lineHeight: 1.5 }}>
              De opgave opent {opgaveOpentOp(w)?.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })} om 10u.
            </p>
          )}
        </Blok>
      )}

      {/* Doelpunten */}
      {gespeeld && w.goals?.length > 0 && (
        <Blok titel={`Doelpunten (${w.goals.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {w.goals.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', borderRadius: '9px', background: 'var(--z-vlak)',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--z-tekst)', flex: 1, minWidth: 0 }}>
                  {g.scorer?.name ?? 'Onbekend'}
                </span>
                {g.assist?.name && (
                  <span style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>assist: {g.assist.name}</span>
                )}
                {g.minute != null && (
                  <span style={{ fontSize: '12px', color: 'var(--z-lijn-sterk)', fontVariantNumeric: 'tabular-nums' }}>{g.minute}'</span>
                )}
              </div>
            ))}
          </div>
        </Blok>
      )}

      {/* Aanwezig */}
      {gespeeld && spelers.length > 0 && (
        <Blok titel={`Wie speelde er (${spelers.length})`}>
          <Namenrij namen={spelers} />
        </Blok>
      )}

      {/* Verslag: eigen component, zodat useVerslag de wedstrijd al kent */}
      {gespeeld && onze && (
        <Blok titel="Wedstrijdverslag">
          <VerslagBlok wedstrijd={w} variant={variant} />
        </Blok>
      )}
    </div>
  )
}

// Desktopkop: scorebord in clubkleuren
function Scorebord({ w, gespeeld, datum }) {
  const ploeg = team => (
    <div style={{
      flex: 1, minWidth: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em',
      color: team?.is_zvk ? 'white' : 'rgba(255,255,255,0.8)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{team?.name}</div>
  )
  const meta = { display: 'inline-flex', alignItems: 'center', gap: '6px' }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 'var(--z-r-l)', padding: '24px 28px',
      background: 'radial-gradient(120% 140% at 100% 0%, #2a4fb8 0%, #13234d 45%, #0c1a3d 100%)',
      color: 'white', boxShadow: 'var(--z-schaduw-l)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
        <TypeChip type={w.type} />
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          {kopTekst(w, gespeeld)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right', display: 'flex' }}>{ploeg(w.home_team)}</div>
        <div className="z-tab-nums" style={{
          flexShrink: 0, minWidth: '120px', textAlign: 'center', padding: '10px 18px',
          borderRadius: 'var(--z-r)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          fontSize: gespeeld ? '34px' : '18px', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.1,
        }}>
          {gespeeld ? <>{w.home_score}<span style={{ opacity: 0.4, margin: '0 8px' }}>–</span>{w.away_score}</> : (w.time?.slice(0, 5) ?? 'vs')}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{ploeg(w.away_team)}</div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 20px', marginTop: '22px',
        paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: 'rgba(255,255,255,0.7)',
      }}>
        <span style={meta}>
          <Icoon naam="kalender" grootte={15} />
          {hoofdletter(datum.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}
        </span>
        {w.time && <span style={meta}><Icoon naam="klok" grootte={15} />{w.time.slice(0, 5)}</span>}
        {w.location && <span style={meta}><Icoon naam="locatie" grootte={15} />{w.location}</span>}
      </div>
    </div>
  )
}

// App-kop: zelfde scorebord, de ploegen onder elkaar zodat lange namen passen
function ScorebordCompact({ w, gespeeld, datum }) {
  const thuisWint = gespeeld && w.home_score > w.away_score
  const uitWint = gespeeld && w.away_score > w.home_score
  const regel = (team, score, wint, verliest) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em',
        color: verliest ? 'rgba(255,255,255,0.6)' : 'white',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{team?.name}</span>
      {gespeeld && (
        <span className="z-tab-nums" style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1, color: wint ? 'white' : 'rgba(255,255,255,0.6)' }}>
          {score}
        </span>
      )}
    </div>
  )

  return (
    <div style={{
      borderRadius: 'var(--z-r-l)', padding: '18px 20px', color: 'white', boxShadow: 'var(--z-schaduw-l)',
      background: 'radial-gradient(120% 140% at 100% 0%, #2a4fb8 0%, #13234d 50%, #0c1a3d 100%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <TypeChip type={w.type} />
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{kopTekst(w, gespeeld)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {regel(w.home_team, w.home_score, thuisWint, uitWint)}
        {regel(w.away_team, w.away_score, uitWint, thuisWint)}
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: '16px', paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: 'rgba(255,255,255,0.7)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Icoon naam="kalender" grootte={14} />
          {hoofdletter(datum.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }))}
        </span>
        {w.time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Icoon naam="klok" grootte={14} />{w.time.slice(0, 5)}</span>}
        {w.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Icoon naam="locatie" grootte={14} />{w.location}</span>}
      </div>
    </div>
  )
}
