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

// Detailpagina van één wedstrijd: alles wat over deze match te weten valt op
// één plek, zodat de lijsten zelf kort kunnen blijven.
// Route: /wedstrijd/:id (desktop) en /app/wedstrijd/:id (PWA)

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}

function Blok({ titel, children, rechts }) {
  return (
    <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#fcfdff',
      }}>
        <span style={{
          flex: 1, fontSize: '11px', fontWeight: '800', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{titel}</span>
        {rechts}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </section>
  )
}

function Namenrij({ namen }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {namen.map((naam, i) => (
        <span key={`${naam}-${i}`} style={{
          fontSize: '12px', color: '#475569', background: '#f8fafc',
          borderRadius: '20px', padding: '4px 10px', border: '1px solid #e2e8f0',
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
          match_players(player_id, player:player_id(name))
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

  const buiten = variant === 'pwa' ? '16px 16px 100px' : '0'

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Laden...</div>
  }

  if (!w) {
    return (
      <div style={{ padding: buiten, maxWidth: '680px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Deze wedstrijd bestaat niet (meer).</p>
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
    <div style={{ padding: buiten, maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Terug */}
      <button
        onClick={() => navigate(-1)}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748b', fontSize: '13px', fontWeight: '600', padding: '4px 0',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </button>

      {/* Kop */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '18px',
        padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
            background: typeKleur.bg, color: typeKleur.color,
          }}>{TYPE_LABELS[w.type] ?? w.type}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {datum.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {w.time ? ` · ${w.time.slice(0, 5)}` : ''}
          </span>
          {w.location && <span style={{ fontSize: '12px', color: '#94a3b8' }}>· {w.location}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ flex: 1, fontSize: '17px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>
            {w.home_team?.name}
          </span>
          <span style={{
            flexShrink: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px',
            color: gewonnen ? '#16a34a' : verloren ? '#ef4444' : '#0f172a',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '12px', padding: '6px 14px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {gespeeld ? `${w.home_score}–${w.away_score}` : 'vs'}
          </span>
          <span style={{ flex: 1, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
            {w.away_team?.name}
          </span>
        </div>
      </div>

      {/* Pronostiek — op deze pagina meteen open, dat is waarvoor je hier bent */}
      {pronostiekStatus(w) !== 'geen' && (
        <Blok titel="🔮 Pronostiek">
          <Pronostiek wedstrijd={w} standaardOpen />
        </Blok>
      )}

      {/* Opgave — met een regeltje zolang ze nog niet open staat */}
      {!gespeeld && onze && (
        <Blok titel="✋ Opgave">
          {opgaveIsOpen(w) ? (
            <Opgave wedstrijd={w} variant={variant} />
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              De opgave opent {opgaveOpentOp(w)?.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })} om 10u.
            </p>
          )}
        </Blok>
      )}

      {/* Doelpunten */}
      {gespeeld && w.goals?.length > 0 && (
        <Blok titel={`⚽ Doelpunten (${w.goals.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {w.goals.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', borderRadius: '9px', background: '#f8fafc',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', flex: 1, minWidth: 0 }}>
                  {g.scorer?.name ?? 'Onbekend'}
                </span>
                {g.assist?.name && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>assist: {g.assist.name}</span>
                )}
                {g.minute != null && (
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>{g.minute}'</span>
                )}
              </div>
            ))}
          </div>
        </Blok>
      )}

      {/* Aanwezig */}
      {gespeeld && spelers.length > 0 && (
        <Blok titel={`👥 Wie speelde er (${spelers.length})`}>
          <Namenrij namen={spelers} />
        </Blok>
      )}

      {/* Verslag — eigen component, zodat useVerslag de wedstrijd al kent */}
      {gespeeld && onze && (
        <Blok titel="📰 Wedstrijdverslag">
          <VerslagBlok wedstrijd={w} variant={variant} />
        </Blok>
      )}
    </div>
  )
}
