import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'
import Opgave from '../components/Opgave'
import { opgaveIsOpen } from '../hooks/useOpgave'
import { isGespeeld } from '../lib/wedstrijd'
import { WedstrijdenPerWeekend } from '../components/WedstrijdenPerDag'
import { Chip, Icoon, Kaart, Knop, Laden, LegeStaat, PaginaKop, Rij, Sectie, Segment, TypeChip, UitslagLetter } from '../ui'
import WedstrijdFormulier from '../components/WedstrijdFormulier'

const REACTIE_EMOJIS = ['💪', '❤️', '🎯', '😭']

export default function Wedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [weergave, setWeergave] = useState('zvk') // 'zvk' | 'alle'
  const [formulierOpen, setFormulierOpen] = useState(false)
  const { isAdmin } = useAuth()

  useEffect(() => { if (seizoen) fetchWedstrijden() }, [seizoen])

  async function fetchWedstrijden() {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name, is_zvk),
        away_team:away_team_id(id, name, is_zvk),
        goals(id, scorer_id, assist_id, minute, scorer:scorer_id(name), assist:assist_id(name)),
        match_players(player_id, player:player_id(name))
      `)
      .eq('season_id', seizoen.id)
      .order('date', { ascending: false })
    setWedstrijden(data ?? [])
    setLoading(false)
  }

  const zvkWedstrijden = wedstrijden.filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
  // Alle wedstrijden van de competitie, die van ZVK inbegrepen
  const alleGespeeld = wedstrijden.filter(w => isGespeeld(w))
  const alleAankomend = wedstrijden.filter(w => !isGespeeld(w))

  const aankomend = zvkWedstrijden.filter(w => !isGespeeld(w)).reverse() // chronologisch
  const gespeeld = zvkWedstrijden.filter(w => isGespeeld(w)) // meest recent eerst

  if (!seizoen) return (
    <>
      <PaginaKop titel="Wedstrijden" />
      <LegeStaat titel="Geen seizoen" tekst="Maak eerst een seizoen aan via Beheer → Seizoenen." icoon="kalender" />
    </>
  )

  return (
    <div style={{ maxWidth: '880px' }}>
      <PaginaKop
        bovenlabel={`Seizoen ${seizoen.name}`}
        titel="Wedstrijden"
        ondertitel={loading ? ' ' : `${gespeeld.length} gespeeld · ${aankomend.length} op de kalender`}
      >
        <Segment
          waarde={weergave}
          onChange={setWeergave}
          opties={[{ waarde: 'zvk', label: 'ZVK Genebos' }, { waarde: 'alle', label: 'Alle wedstrijden' }]}
        />
        {isAdmin && (
          <Knop soort="primair" icoon="plus" onClick={() => setFormulierOpen(true)}>Wedstrijd toevoegen</Knop>
        )}
      </PaginaKop>

      {formulierOpen && (
        <WedstrijdFormulier onSluiten={() => setFormulierOpen(false)} onOpgeslagen={fetchWedstrijden} />
      )}

      {loading ? (
        <Laden regels={5} />
      ) : weergave === 'zvk' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {aankomend.length > 0 && (
            <Sectie titel="Aankomend" meta={`${aankomend.length} ${aankomend.length === 1 ? 'wedstrijd' : 'wedstrijden'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aankomend.map(w => <AankomendeKaart key={w.id} wedstrijd={w} />)}
              </div>
            </Sectie>
          )}

          <Sectie titel="Uitslagen" meta={gespeeld.length > 0 ? `${gespeeld.length} gespeeld` : null}>
            {gespeeld.length === 0 ? (
              <LegeStaat tekst="Nog geen gespeelde wedstrijden dit seizoen." icoon="bal" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {gespeeld.map(w => <GespeeldeKaart key={w.id} wedstrijd={w} />)}
              </div>
            )}
          </Sectie>
        </div>
      ) : (
        <div className="z-raster z-raster-2" style={{ alignItems: 'start' }}>
          <Sectie titel="Programma">
            {alleAankomend.length > 0
              ? <WedstrijdenPerWeekend wedstrijden={alleAankomend} variant="desktop" />
              : <LegeStaat tekst="Geen wedstrijden meer gepland." icoon="kalender" />}
          </Sectie>
          <Sectie titel="Uitslagen">
            {alleGespeeld.length > 0
              ? <WedstrijdenPerWeekend wedstrijden={alleGespeeld} variant="desktop" nieuwsteEerst />
              : <LegeStaat tekst="Nog geen uitslagen." icoon="bal" />}
          </Sectie>
        </div>
      )}
    </div>
  )
}

// ── Aankomende wedstrijd kaart ───────────────────────────────────────────────

function AankomendeKaart({ wedstrijd: w }) {
  const navigate = useNavigate()
  const isThuis = w.home_team?.is_zvk
  const datum = new Date(`${w.date}T00:00:00`)
  const vandaag = new Date(); vandaag.setHours(0,0,0,0)
  const diff = Math.round((datum - vandaag) / 86400000)

  const aftel = diff <= 0 ? { tekst: 'Vandaag', toon: 'winst' }
    : diff === 1 ? { tekst: 'Morgen', toon: 'gelijk' }
    : { tekst: `Over ${diff} dagen`, toon: null }

  return (
    <Kaart style={{ overflow: 'hidden' }}>
      <Rij onClick={() => navigate(`/wedstrijd/${w.id}`)} style={{ padding: '16px 20px', gap: '18px' }}>
        <DatumBlok datum={datum} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {w.home_team?.name} – {w.away_team?.name}
          </div>
          <Meta w={w} isThuis={isThuis} />
        </div>

        <Chip toon={aftel.toon}>{aftel.tekst}</Chip>
      </Rij>

      {opgaveIsOpen(w) && (
        <div style={{ borderTop: '1px solid var(--z-lijn-zacht)', background: 'var(--z-vlak)', padding: '16px 20px' }}>
          <Opgave wedstrijd={w} />
        </div>
      )}
    </Kaart>
  )
}

// ── Gespeelde wedstrijd kaart ────────────────────────────────────────────────

function GespeeldeKaart({ wedstrijd: w }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reacties, setReacties] = useState([])
  const [mijneReactie, setMijneReactie] = useState(null)
  const isThuis = w.home_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const datum = new Date(`${w.date}T00:00:00`)

  useEffect(() => { fetchReacties() }, [w.id])

  async function fetchReacties() {
    const { data } = await supabase.from('match_reactions').select('emoji, user_id').eq('match_id', w.id)
    setReacties(data ?? [])
    const mijn = (data ?? []).find(r => r.user_id === user?.id)
    setMijneReactie(mijn?.emoji ?? null)
  }

  async function handleReactie(emoji) {
    if (!user) return
    if (mijneReactie === emoji) {
      await supabase.from('match_reactions').delete().eq('match_id', w.id).eq('user_id', user.id)
      setReacties(prev => prev.filter(r => r.user_id !== user.id))
      setMijneReactie(null)
    } else {
      await supabase.from('match_reactions').upsert(
        { match_id: w.id, user_id: user.id, emoji },
        { onConflict: 'match_id,user_id' }
      )
      setReacties(prev => [...prev.filter(r => r.user_id !== user.id), { emoji, user_id: user.id }])
      setMijneReactie(emoji)
    }
  }

  const reactieTellers = {}
  for (const r of reacties) reactieTellers[r.emoji] = (reactieTellers[r.emoji] || 0) + 1

  const uitslag = zvkScore > tegScore ? 'W' : zvkScore < tegScore ? 'V' : 'G'

  return (
    <Kaart style={{ overflow: 'hidden' }}>
      <Rij onClick={() => navigate(`/wedstrijd/${w.id}`)} style={{ padding: '16px 20px', gap: '18px' }}>
        <UitslagLetter uitslag={uitslag} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--z-tekst)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {w.home_team?.name} – {w.away_team?.name}
          </div>
          <Meta w={w} isThuis={isThuis} datum={datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })} />
        </div>

        <div className="z-tab-nums" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--z-tekst)', flexShrink: 0 }}>
          {w.home_score}<span style={{ color: 'var(--z-tekst-4)', margin: '0 6px' }}>–</span>{w.away_score}
        </div>
      </Rij>

      {/* Reacties */}
      <div
        style={{ display: 'flex', gap: '6px', padding: '10px 20px', borderTop: '1px solid var(--z-lijn-zacht)', background: 'var(--z-vlak)' }}
        onClick={e => e.stopPropagation()}
      >
        {REACTIE_EMOJIS.map(emoji => {
          const count = reactieTellers[emoji] || 0
          const actief = mijneReactie === emoji
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReactie(emoji)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                height: '28px', padding: '0 10px', borderRadius: '99px',
                border: `1px solid ${actief ? 'var(--z-blauw-200)' : 'var(--z-lijn)'}`,
                background: actief ? 'var(--z-blauw-50)' : 'var(--z-kaart)',
                cursor: 'pointer', fontSize: '14px', transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {emoji}
              {count > 0 && (
                <span className="z-tab-nums" style={{ fontSize: '12px', fontWeight: 600, color: actief ? 'var(--z-blauw)' : 'var(--z-tekst-3)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Kaart>
  )
}

// ── Hulpcomponenten ──────────────────────────────────────────────────────────

function DatumBlok({ datum }) {
  return (
    <div style={{
      flexShrink: 0, width: '48px', textAlign: 'center', padding: '6px 0',
      borderRadius: 'var(--z-r-s)', border: '1px solid var(--z-lijn)', background: 'var(--z-kaart)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--z-blauw)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {datum.toLocaleDateString('nl-BE', { month: 'short' }).replace('.', '')}
      </div>
      <div className="z-tab-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--z-tekst)', lineHeight: 1.1 }}>
        {datum.getDate()}
      </div>
    </div>
  )
}

function Meta({ w, isThuis, datum }) {
  const stuk = { display: 'inline-flex', alignItems: 'center', gap: '5px' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 14px', marginTop: '5px', fontSize: '13px', color: 'var(--z-tekst-3)' }}>
      {datum && <span>{datum}</span>}
      <TypeChip type={w.type} />
      <span>{isThuis ? 'Thuis' : 'Uit'}</span>
      {w.time && <span style={stuk}><Icoon naam="klok" grootte={14} />{w.time.slice(0, 5)}</span>}
      {w.location && <span style={stuk}><Icoon naam="locatie" grootte={14} />{w.location}</span>}
    </div>
  )
}
