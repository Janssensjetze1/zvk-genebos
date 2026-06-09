import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'
import { useAuth } from '../context/AuthContext'

const REACTIE_EMOJIS = ['💪', '❤️', '🎯', '😭']

const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}
const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }

export default function PWAWedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('aankomend')

  useEffect(() => { if (seizoen) fetchWedstrijden() }, [seizoen])

  async function fetchWedstrijden() {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id,name,is_zvk),
        away_team:away_team_id(id,name,is_zvk),
        goals(id,scorer_id,scorer:scorer_id(name)),
        match_players(player_id, player:player_id(name))
      `)
      .eq('season_id', seizoen.id)
      .order('date', { ascending: true })
    setWedstrijden(data ?? [])
    setLoading(false)
  }

  const vandaag = new Date().toISOString().split('T')[0]
  const zvkWedstrijden = wedstrijden.filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
  const aankomend = zvkWedstrijden.filter(w => w.date >= vandaag)
  const gespeeld = zvkWedstrijden.filter(w => w.date < vandaag).reverse()

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Wedstrijden</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
        {[['aankomend', 'Aankomend'], ['gespeeld', 'Gespeeld']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: tab === id ? '700' : '500',
            background: tab === id ? 'white' : 'transparent',
            color: tab === id ? '#0f172a' : '#64748b',
            boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(tab === 'aankomend' ? aankomend : gespeeld).map(w => (
            <WedstrijdKaart key={w.id} wedstrijd={w} />
          ))}
          {(tab === 'aankomend' ? aankomend : gespeeld).length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
              Geen wedstrijden gevonden.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WedstrijdKaart({ wedstrijd: w }) {
  const { user, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [detailTab, setDetailTab] = useState('details')
  const [reacties, setReacties] = useState([])
  const [mijneReactie, setMijneReactie] = useState(null)
  const [gepoptEmoji, setGepoptEmoji] = useState(null)
  const [verslag, setVerslag] = useState(w.report ?? null)
  const [genereert, setGenereert] = useState(false)

  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const isPast = w.date < new Date().toISOString().split('T')[0]
  const gewonnen = isPast && zvkScore > tegScore
  const verloren = isPast && zvkScore < tegScore
  const datum = new Date(w.date)
  async function genereerVerslag() {
    setGenereert(true)
    setDetailTab('verslag')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-match-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ match_id: w.id }),
      })
      const json = await res.json()
      if (json.report) setVerslag(json.report)
    } finally {
      setGenereert(false)
    }
  }

  const heeftDetail = isPast && (w.goals?.length > 0 || w.match_players?.length > 0 || verslag)

  const dagNaam = datum.toLocaleDateString('nl-BE', { weekday: 'short' })
  const dagNr = datum.getDate()
  const maand = datum.toLocaleDateString('nl-BE', { month: 'short' })

  useEffect(() => {
    if (isPast) fetchReacties()
  }, [w.id, isPast])

  async function fetchReacties() {
    const { data } = await supabase
      .from('match_reactions')
      .select('emoji, user_id')
      .eq('match_id', w.id)
    setReacties(data ?? [])
    const mijn = (data ?? []).find(r => r.user_id === user?.id)
    setMijneReactie(mijn?.emoji ?? null)
  }

  async function handleReactie(emoji) {
    if (!user) return
    // Pop-animatie triggeren
    setGepoptEmoji(emoji)
    setTimeout(() => setGepoptEmoji(null), 350)

    if (mijneReactie === emoji) {
      await supabase.from('match_reactions').delete()
        .eq('match_id', w.id).eq('user_id', user.id)
      setReacties(prev => prev.filter(r => r.user_id !== user.id))
      setMijneReactie(null)
    } else {
      await supabase.from('match_reactions').upsert(
        { match_id: w.id, user_id: user.id, emoji },
        { onConflict: 'match_id,user_id' }
      )
      setReacties(prev => {
        const zonder = prev.filter(r => r.user_id !== user.id)
        return [...zonder, { emoji, user_id: user.id }]
      })
      setMijneReactie(emoji)
    }
  }

  // Tel reacties per emoji
  const reactieTellers = {}
  for (const r of reacties) {
    reactieTellers[r.emoji] = (reactieTellers[r.emoji] || 0) + 1
  }

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: `1.5px solid ${gewonnen ? '#bbf7d0' : verloren ? '#fecaca' : '#e2e8f0'}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Hoofdrij */}
      <div
        style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: heeftDetail ? 'pointer' : 'default' }}
        onClick={() => heeftDetail && setOpen(o => !o)}
      >
        {/* Datum blok */}
        <div style={{
          width: '48px', textAlign: 'center', flexShrink: 0,
          background: '#f8fafc', borderRadius: '10px', padding: '8px 4px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{dagNaam}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>{dagNr}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{maand}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            vs {tegenstander?.name}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              ...TYPE_COLORS[w.type],
            }}>{TYPE_LABELS[w.type]}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isThuis ? 'Thuis' : 'Uit'}</span>
            {w.time && <span style={{ fontSize: '12px', color: '#94a3b8' }}>· {w.time.slice(0, 5)}</span>}
          </div>
        </div>

        {/* Score / status */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {isPast ? (
            <>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>
                {zvkScore}–{tegScore}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: gewonnen ? '#16a34a' : verloren ? '#ef4444' : '#64748b' }}>
                {gewonnen ? '✓ Gewonnen' : verloren ? '✗ Verloren' : '= Gelijkspel'}
              </div>
            </>
          ) : (
            <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', borderRadius: '8px', padding: '5px 10px', fontWeight: '500' }}>
              Gepland
            </span>
          )}
        </div>

        {/* Uitklappijl */}
        {heeftDetail && (
          <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Emoji-reacties — altijd zichtbaar bij gespeelde wedstrijden */}
      {isPast && (
        <div
          style={{ padding: '0 16px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}
          onClick={e => e.stopPropagation()}
        >
          {REACTIE_EMOJIS.map(emoji => {
            const count = reactieTellers[emoji] || 0
            const actief = mijneReactie === emoji
            const popping = gepoptEmoji === emoji
            return (
              <button
                key={emoji}
                onClick={() => handleReactie(emoji)}
                className={popping ? 'emoji-pop' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '20px', border: '1.5px solid',
                  borderColor: actief ? '#6366f1' : '#e2e8f0',
                  background: actief ? '#eef2ff' : count > 0 ? '#f8fafc' : 'transparent',
                  cursor: 'pointer', fontSize: '15px',
                  transition: 'border-color 0.15s, background 0.15s',
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
      )}

      {/* Uitklapdetail */}
      {open && heeftDetail && (
        <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 16px' }}>
            {[['details', '📋 Details'], ['verslag', '📰 Verslag']].map(([id, label]) => (
              <button key={id} onClick={() => setDetailTab(id)} style={{
                padding: '10px 12px', fontSize: '12px', fontWeight: detailTab === id ? '700' : '500',
                color: detailTab === id ? '#1d4ed8' : '#94a3b8',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: detailTab === id ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-1px',
              }}>{label}</button>
            ))}
          </div>

          {/* Details tab */}
          {detailTab === 'details' && (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {w.goals?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>⚽ Doelpunten</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {w.goals.map(g => (
                      <span key={g.id} style={{ fontSize: '12px', color: '#475569', background: 'white', borderRadius: '20px', padding: '4px 10px', border: '1px solid #e2e8f0' }}>
                        {g.scorer?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {w.match_players?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>👥 Aanwezig ({w.match_players.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {w.match_players.slice().sort((a, b) => (a.player?.name ?? '').localeCompare(b.player?.name ?? '')).map(mp => (
                      <span key={mp.player_id} style={{ fontSize: '12px', color: '#475569', background: 'white', borderRadius: '20px', padding: '4px 10px', border: '1px solid #e2e8f0' }}>
                        {mp.player?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verslag tab */}
          {detailTab === 'verslag' && (
            <div style={{ padding: '14px 16px' }}>
              {genereert ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                  <div className="pulse-soft" style={{ fontSize: '26px', marginBottom: '8px' }}>📝</div>
                  <p style={{ fontSize: '13px' }}>Verslag wordt gegenereerd...</p>
                </div>
              ) : verslag ? (
                <div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{verslag}</p>
                  {isAdmin && (
                    <button onClick={genereerVerslag} style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                      Opnieuw genereren
                    </button>
                  )}
                </div>
              ) : isAdmin ? (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Nog geen verslag.</p>
                  <button
                    onClick={genereerVerslag}
                    style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ✨ Genereer verslag
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>Nog geen verslag beschikbaar.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
