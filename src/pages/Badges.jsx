import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { supabase } from '../lib/supabase'
import { BADGES, CAT, SHINE, CATEGORIE_VOLGORDE } from '../data/badges'

// Zelfde stats-berekening als PWAAccount
function computeStats({ goalsArr, assistsArr, matchesArr, seizoenId, userCreatedAt }) {
  const goalsByMatch   = {}
  const assistsByMatch = {}
  goalsArr.forEach(g => { if (g.match_id) goalsByMatch[g.match_id] = (goalsByMatch[g.match_id] || 0) + 1 })
  assistsArr.forEach(a => { if (a.match_id) assistsByMatch[a.match_id] = (assistsByMatch[a.match_id] || 0) + 1 })
  const hattrickMatchIds = Object.entries(goalsByMatch).filter(([, n]) => n >= 3).map(([id]) => id)
  const goalMatchSet   = new Set(Object.keys(goalsByMatch))
  const assistMatchSet = new Set(Object.keys(assistsByMatch))
  return {
    aantalGoals:       goalsArr.length,
    aantalAssists:     assistsArr.length,
    aantalWedstrijden: matchesArr.length,
    seizoenGoals:      goalsArr.filter(g => g.match?.season_id === seizoenId).length,
    hattricks:               hattrickMatchIds.length,
    maxGoalsInWedstrijd:     Math.max(0, ...Object.values(goalsByMatch)),
    maxAssistsInWedstrijd:   Math.max(0, ...Object.values(assistsByMatch)),
    hattrickMetAssist:          hattrickMatchIds.filter(id => assistsByMatch[id] >= 1).length,
    wedstrijdenMetGoalEnAssist: [...goalMatchSet].filter(id => assistMatchSet.has(id)).length,
    seizoenenMetGoal:   new Set(goalsArr.map(g => g.match?.season_id).filter(Boolean)).size,
    aantalSeizoenen:    new Set(matchesArr.map(m => m.match?.season_id).filter(Boolean)).size,
    accountLeeftijdDagen: userCreatedAt ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000) : 0,
    nooitGespeeld: matchesArr.length === 0 && (userCreatedAt ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000) : 0) >= 60,
    cleanSheets: matchesArr.filter(m => {
      const match = m.match; if (!match) return false
      const zvkIsThuis = match.home_team?.is_zvk
      const tegScore = zvkIsThuis ? match.away_score : match.home_score
      return tegScore !== null && tegScore === 0
    }).length,
    aantalWedstrijdenRij: 0, maxWedstrijdenRij: 0,
    seizoenenVolledigAanwezig: 0, topScorerSeizoenen: 0,
    grootsteWinstMarge: 0, nachtbraker: false, gewonnenOpVerjaardag: false,
  }
}

const HEX = 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)'

function BadgeHex({ emoji, categorie, size = 80, verdiend }) {
  const cat = CAT[categorie]   ?? CAT.brons
  const sh  = SHINE[categorie] ?? SHINE.zilver
  const H   = Math.round(size * 1.155)
  const iW  = Math.round(size * 0.8125)
  const iH  = Math.round(iW * 1.155)
  const iL  = Math.round((size - iW) / 2)
  const iT  = Math.round((H - iH) / 2)
  const cD  = Math.round(iW * 0.70)
  const fs  = Math.round(cD * 0.52)

  return (
    <div style={{
      position: 'relative', width: size, height: H, flexShrink: 0,
      filter: verdiend
        ? `drop-shadow(0 2px 8px ${sh.glow}) drop-shadow(0 0 16px ${sh.glow})`
        : 'grayscale(1)',
      opacity: verdiend ? 1 : 0.35,
      transition: 'opacity 0.2s, filter 0.2s',
    }}>
      <div style={{
        position: 'absolute', inset: 0, clipPath: HEX,
        background: verdiend ? sh.outerGrad : cat.ro,
      }} />
      <div style={{
        position: 'absolute', left: iL, top: iT, width: iW, height: iH,
        clipPath: HEX,
        background: verdiend ? sh.innerGrad : cat.ri,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: cD, height: cD, borderRadius: '50%',
          background: verdiend ? sh.circleGrad : cat.rc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, lineHeight: 1,
        }}>
          {verdiend ? emoji : '❓'}
        </div>
      </div>
      {/* Platina glitter sterretjes */}
      {verdiend && categorie === 'platina' && [
        { top: '-14%', left:  '8%',  s: 0.20, d: '0.0s', t: '1.8s' },
        { top:  '-5%', left: '72%',  s: 0.16, d: '0.5s', t: '1.6s' },
        { top:  '38%', left: '108%', s: 0.18, d: '1.1s', t: '2.0s' },
        { top:  '90%', left: '68%',  s: 0.17, d: '0.3s', t: '1.7s' },
        { top:  '85%', left: '-10%', s: 0.15, d: '0.8s', t: '1.9s' },
        { top:  '22%', left: '-8%',  s: 0.14, d: '1.4s', t: '1.5s' },
      ].map((sp, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: sp.top, left: sp.left,
          fontSize: Math.max(6, Math.round(size * sp.s)),
          color: 'white',
          textShadow: '0 0 5px #bae6fd, 0 0 10px #7dd3fc',
          animation: `glitter ${sp.t} ${sp.d} ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 10, lineHeight: 1,
        }}>✦</div>
      ))}
    </div>
  )
}

export default function Badges() {
  const { user, profile } = useAuth()
  const { actief: seizoen } = useSeason()
  const [geselecteerd,  setGeselecteerd]  = useState(null)
  const [badgeStats,    setBadgeStats]    = useState(null)
  const [dbBadgeIds,    setDbBadgeIds]    = useState(new Set())
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    if (!profile?.player_id) return
    async function fetchBadgeData() {
      setLoading(true)
      const playerId = profile.player_id
      const [goalsRes, assistsRes, matchesRes, dbRes] = await Promise.all([
        supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('scorer_id', playerId),
        supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('assist_id', playerId),
        supabase.from('match_players').select('match_id, match:match_id(season_id, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk))').eq('player_id', playerId),
        supabase.from('player_badges').select('badge_id').eq('player_id', playerId),
      ])
      setBadgeStats(computeStats({
        goalsArr:     goalsRes.data   ?? [],
        assistsArr:   assistsRes.data  ?? [],
        matchesArr:   matchesRes.data  ?? [],
        seizoenId:    seizoen?.id,
        userCreatedAt: user?.created_at,
      }))
      setDbBadgeIds(new Set((dbRes.data ?? []).map(r => r.badge_id)))
      setLoading(false)
    }
    fetchBadgeData()
  }, [profile?.player_id, seizoen?.id])

  // Geen spelersfiche → geen badges
  if (!profile?.player_id) {
    return (
      <div style={{ maxWidth: '480px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>Jouw verdiende badges</p>
        <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
          padding: '40px 32px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔗</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
            Geen spelersfiche gekoppeld
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Je account is nog niet gekoppeld aan een spelersfiche.
            Een admin doet dit voor je. Pas dan worden jouw badges berekend.
          </p>
        </div>
      </div>
    )
  }

  const badgesMetStatus = badgeStats
    ? BADGES.map(b => ({
        ...b,
        verdiend: dbBadgeIds.has(b.id) || (() => { try { return b.conditie(badgeStats) } catch { return false } })(),
      }))
    : BADGES.map(b => ({ ...b, verdiend: false }))

  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length
  const totaal = badgesMetStatus.length
  const progPct = totaal > 0 ? (aantalVerdiend / totaal) * 100 : 0

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px' }}>Badges</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {loading ? 'Berekenen...' : totaal === 0 ? 'Binnenkort beschikbaar' : `${aantalVerdiend} van ${totaal} verdiend`}
          </p>
        </div>
        {loading && (
          <div style={{
            width: '18px', height: '18px', marginLeft: '4px',
            border: '2.5px solid #e2e8f0', borderTopColor: '#3b82f6',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          }} />
        )}
      </div>

      {/* Voortgang — enkel tonen als er badges zijn */}
      {totaal > 0 && (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', gap: '20px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Voortgang</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{aantalVerdiend}/{totaal}</span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progPct}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '99px', transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
              {Math.round(progPct)}%
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>voltooid</div>
          </div>
        </div>
      )}

      {/* Lege staat */}
      {totaal === 0 && (
        <div className="badge-card" style={{
          padding: '64px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          textAlign: 'center', maxWidth: '480px',
        }}>
          <span style={{ fontSize: '48px', position: 'relative', zIndex: 1 }}>🏅</span>
          <p style={{ fontSize: '16px', fontWeight: '700', color: 'rgba(255,255,255,0.85)', margin: 0, position: 'relative', zIndex: 1 }}>
            Binnenkort beschikbaar
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6, maxWidth: '280px', position: 'relative', zIndex: 1 }}>
            Er zijn op dit moment nog geen badges. Kom later terug!
          </p>
        </div>
      )}

      {/* Badges per categorie */}
      {CATEGORIE_VOLGORDE.map(cat => {
        const groep = badgesMetStatus.filter(b => b.categorie === cat)
        if (groep.length === 0) return null
        const catInfo = CAT[cat]
        const verdiendInGroep = groep.filter(b => b.verdiend).length
        return (
          <div key={cat} style={{ marginBottom: '36px' }}>
            {/* Categorie header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <span style={{
                fontSize: '12px', fontWeight: '800', color: catInfo.lc,
                textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0,
              }}>
                {catInfo.label}
              </span>
              <div style={{ flex: 1, height: '1px', background: catInfo.lbo }} />
              <span style={{
                fontSize: '12px', color: '#94a3b8', flexShrink: 0, fontWeight: '600',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '99px', padding: '2px 10px',
              }}>
                {verdiendInGroep}/{groep.length}
              </span>
            </div>

            {/* Badge kaarten */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {groep.map(badge => {
                const c = CAT[badge.categorie]
                return (
                  <div
                    key={badge.id}
                    onClick={() => badge.verdiend && setGeselecteerd(badge)}
                    style={{
                      background: badge.verdiend ? c.lb : 'white',
                      border: `1.5px solid ${badge.verdiend ? c.lbo : '#e2e8f0'}`,
                      borderRadius: '20px', padding: '24px 16px 18px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      cursor: badge.verdiend ? 'pointer' : 'default',
                      position: 'relative',
                      transition: 'transform 0.12s, box-shadow 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (badge.verdiend) {
                        e.currentTarget.style.transform = 'translateY(-3px)'
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: badge.verdiend ? '#dcfce7' : '#f1f5f9',
                      border: `1.5px solid ${badge.verdiend ? '#86efac' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      {badge.verdiend ? '✓' : '🔒'}
                    </div>

                    <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend={badge.verdiend} />

                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                        color: badge.verdiend ? '#0f172a' : '#94a3b8',
                      }}>
                        {badge.naam}
                      </div>
                      <p style={{
                        fontSize: '11px', color: badge.verdiend ? '#64748b' : '#cbd5e1',
                        margin: 0, lineHeight: 1.5,
                      }}>
                        {badge.beschrijving}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Modal */}
      {geselecteerd && (() => {
        const cat = CAT[geselecteerd.categorie]
        return (
          <>
            <div
              onClick={() => setGeselecteerd(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              }}
            />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', zIndex: 201,
              transform: 'translate(-50%, -50%)',
              background: 'white', borderRadius: '24px',
              padding: '36px 40px', width: '380px', maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={108} verdiend />
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                    {geselecteerd.naam}
                  </h2>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    padding: '4px 12px', borderRadius: '99px',
                    background: cat.lb, color: cat.lc, border: `1px solid ${cat.lbo}`,
                  }}>
                    {cat.label}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
                  {geselecteerd.beschrijving}
                </p>
                <div style={{
                  width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '14px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#dcfce7', border: '1.5px solid #86efac',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', flexShrink: 0,
                  }}>✓</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>Verdiend!</div>
                </div>
                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{
                    width: '100%', background: '#f1f5f9', border: 'none',
                    borderRadius: '12px', padding: '13px', fontSize: '14px',
                    fontWeight: '600', color: '#475569', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                >
                  Sluiten
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
