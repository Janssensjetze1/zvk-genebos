import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'

const REACTIE_EMOJIS = ['💪', '❤️', '🎯', '😭']

const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }
const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}

export default function Wedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alles') // 'alles' | 'aankomend' | 'gespeeld'

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

  const vandaag = new Date().toISOString().split('T')[0]
  const zvkWedstrijden = wedstrijden.filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
  const andereWedstrijden = wedstrijden.filter(w => !w.home_team?.is_zvk && !w.away_team?.is_zvk)

  const aankomend = zvkWedstrijden.filter(w => w.date >= vandaag).reverse() // chronologisch
  const gespeeld = zvkWedstrijden.filter(w => w.date < vandaag) // meest recent eerst

  if (!seizoen) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>Selecteer eerst een seizoen via Beheer → Seizoenen.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Wedstrijden</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>{seizoen.name}</p>
      </div>

      {loading ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Aankomende wedstrijden */}
          {aankomend.length > 0 && (
            <Sectie titel="Aankomend">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aankomend.map(w => <AankomendeKaart key={w.id} wedstrijd={w} />)}
              </div>
            </Sectie>
          )}

          {/* Gespeelde ZVK wedstrijden */}
          <Sectie titel="Uitslagen ZVK">
            {gespeeld.length === 0 ? (
              <Leeg tekst="Nog geen gespeelde wedstrijden dit seizoen." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gespeeld.map(w => <GespeeldeKaart key={w.id} wedstrijd={w} />)}
              </div>
            )}
          </Sectie>

          {/* Andere wedstrijden */}
          {andereWedstrijden.length > 0 && (
            <Sectie titel="Andere wedstrijden" subtitel="Wedstrijden van andere teams in de competitie">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {andereWedstrijden.map(w => <AndereKaart key={w.id} wedstrijd={w} />)}
              </div>
            </Sectie>
          )}

        </div>
      )}
    </div>
  )
}

// ── Aankomende wedstrijd kaart ───────────────────────────────────────────────

function AankomendeKaart({ wedstrijd: w }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const datum = new Date(w.date)
  const vandaag = new Date(); vandaag.setHours(0,0,0,0)
  const diff = Math.round((datum - vandaag) / 86400000)
  const typeKleur = TYPE_COLORS[w.type] ?? TYPE_COLORS.competitie

  let countdownLabel
  if (diff === 0) countdownLabel = { tekst: 'Vandaag!', kleur: '#16a34a', bg: '#f0fdf4' }
  else if (diff === 1) countdownLabel = { tekst: 'Morgen', kleur: '#d97706', bg: '#fffbeb' }
  else countdownLabel = { tekst: `Over ${diff} dagen`, kleur: '#475569', bg: '#f8fafc' }

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    }}>
      {/* Datum blok */}
      <div style={{
        flexShrink: 0, textAlign: 'center', width: '52px',
        background: '#f8fafc', borderRadius: '10px', padding: '8px 0',
      }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>
          {datum.getDate()}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', marginTop: '2px' }}>
          {datum.toLocaleDateString('nl-BE', { month: 'short' })}
        </div>
      </div>

      {/* Wedstrijd info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
            {isThuis ? 'ZVK Genebos' : tegenstander?.name} vs {isThuis ? tegenstander?.name : 'ZVK Genebos'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', background: typeKleur.bg, color: typeKleur.color }}>
            {TYPE_LABELS[w.type]}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {isThuis ? '🏠 Thuis' : '✈️ Uit'}
          </span>
          {w.time && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>· 🕐 {w.time.slice(0, 5)}</span>
          )}
          {w.location && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>· 📍 {w.location}</span>
          )}
        </div>
      </div>

      {/* Countdown */}
      <div style={{
        flexShrink: 0, background: countdownLabel.bg,
        color: countdownLabel.kleur, fontSize: '12px', fontWeight: '600',
        padding: '6px 12px', borderRadius: '20px',
      }}>
        {countdownLabel.tekst}
      </div>
    </div>
  )
}

// ── Gespeelde wedstrijd kaart ────────────────────────────────────────────────

function GespeeldeKaart({ wedstrijd: w }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reacties, setReacties] = useState([])
  const [mijneReactie, setMijneReactie] = useState(null)
  const isThuis = w.home_team?.is_zvk
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const tegenstander = isThuis ? w.away_team : w.home_team
  const datum = new Date(w.date)
  const typeKleur = TYPE_COLORS[w.type] ?? TYPE_COLORS.competitie

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

  const resultaat = zvkScore > tegScore ? 'W' : zvkScore < tegScore ? 'V' : 'G'
  const resultaatKleur = { W: '#16a34a', V: '#ef4444', G: '#d97706' }[resultaat]
  const resultaatBg = { W: '#f0fdf4', V: '#fef2f2', G: '#fffbeb' }[resultaat]
  const resultaatLabel = { W: 'Winst', V: 'Verlies', G: 'Gelijkspel' }[resultaat]

  const heeftBlad = w.match_players?.length > 0 || w.goals?.length > 0
  const zvkGoals = w.goals?.filter(g => {
    // Goal is van ZVK als de scorer speelde voor ZVK (we controleren via match_players)
    return true // toon alle goals in deze wedstrijd
  }) ?? []

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
      overflow: 'hidden', transition: 'box-shadow 0.15s',
    }}>
      {/* Hoofd rij */}
      <div
        onClick={() => heeftBlad && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 18px',
          cursor: heeftBlad ? 'pointer' : 'default',
        }}
      >
        {/* Resultaat badge */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: resultaatBg, color: resultaatKleur,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800',
        }}>
          {resultaat}
        </div>

        {/* Teams & score */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
              {isThuis ? 'ZVK Genebos' : tegenstander?.name}
            </span>
            <span style={{
              fontSize: '15px', fontWeight: '800', color: '#0f172a',
              background: '#f8fafc', padding: '2px 10px', borderRadius: '6px', letterSpacing: '0.05em',
            }}>
              {w.home_score} – {w.away_score}
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
              {isThuis ? tegenstander?.name : 'ZVK Genebos'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>·</span>
            <span style={{ fontSize: '12px', fontWeight: '600', padding: '1px 7px', borderRadius: '5px', background: typeKleur.bg, color: typeKleur.color }}>
              {TYPE_LABELS[w.type]}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {isThuis ? '🏠 Thuis' : '✈️ Uit'}
            </span>
            {w.time && (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>· 🕐 {w.time.slice(0, 5)}</span>
            )}
          </div>
        </div>

        {/* Resultaatlabel + chevron */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: resultaatKleur }}>{resultaatLabel}</span>
          {heeftBlad && (
            <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Emoji-reacties */}
      <div
        style={{ padding: '0 18px 12px', display: 'flex', gap: '6px' }}
        onClick={e => e.stopPropagation()}
      >
        {REACTIE_EMOJIS.map(emoji => {
          const count = reactieTellers[emoji] || 0
          const actief = mijneReactie === emoji
          return (
            <button
              key={emoji}
              onClick={() => handleReactie(emoji)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '20px', border: '1.5px solid',
                borderColor: actief ? '#6366f1' : '#e2e8f0',
                background: actief ? '#eef2ff' : count > 0 ? '#f8fafc' : 'transparent',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s',
              }}
            >
              {emoji}
              {count > 0 && (
                <span style={{ fontSize: '12px', fontWeight: '700', color: actief ? '#6366f1' : '#64748b' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Uitklap: doelpunten + spelers */}
      {open && heeftBlad && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {zvkGoals.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Doelpunten</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {zvkGoals.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>⚽</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{g.scorer?.name}</span>
                    {g.assist?.name && (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>assist: {g.assist.name}</span>
                    )}
                    {g.minute && (
                      <span style={{ fontSize: '12px', color: '#cbd5e1', marginLeft: 'auto' }}>{g.minute}'</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {w.match_players?.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Aanwezig ({w.match_players.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {w.match_players
                  .slice()
                  .sort((a, b) => (a.player?.name ?? '').localeCompare(b.player?.name ?? ''))
                  .map(mp => (
                    <span key={mp.player_id} style={{
                      fontSize: '12px', color: '#475569', background: 'white',
                      border: '1px solid #e2e8f0', borderRadius: '20px', padding: '3px 10px',
                    }}>
                      {mp.player?.name}
                    </span>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Andere wedstrijd kaart ───────────────────────────────────────────────────

function AndereKaart({ wedstrijd: w }) {
  const datum = new Date(w.date)
  const typeKleur = TYPE_COLORS[w.type] ?? TYPE_COLORS.competitie

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0, width: '80px' }}>
        {datum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
      </span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{w.home_team?.name}</span>
        <span style={{
          fontSize: '13px', fontWeight: '700', color: '#0f172a',
          background: '#f1f5f9', padding: '2px 8px', borderRadius: '5px', flexShrink: 0,
        }}>
          {w.home_score} – {w.away_score}
        </span>
        <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{w.away_team?.name}</span>
      </div>
      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '5px', background: typeKleur.bg, color: typeKleur.color, flexShrink: 0 }}>
        {TYPE_LABELS[w.type]}
      </span>
    </div>
  )
}

// ── Hulpcomponenten ──────────────────────────────────────────────────────────

function Sectie({ titel, subtitel, children }) {
  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: subtitel ? '2px' : 0 }}>{titel}</h2>
        {subtitel && <p style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitel}</p>}
      </div>
      {children}
    </div>
  )
}

function Leeg({ tekst }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: '#94a3b8' }}>{tekst}</p>
    </div>
  )
}
