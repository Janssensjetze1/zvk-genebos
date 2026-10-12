import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../context/SeasonContext'
import { badgesVoor, CAT, SHINE, CATEGORIE_VOLGORDE, verborgen } from '../data/badges'
import { haalBadgeData } from '../lib/badgeStats'
import { PaginaKop } from '../ui'


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

  // Ook zonder spelersfiche laden: de pronostiekbadges hangen aan het account.
  useEffect(() => {
    let levend = true

    function laad() {
      if (!user?.id) return
      setLoading(true)
      haalBadgeData({
        playerId: profile?.player_id ?? null,
        seizoenId: seizoen?.id,
        userCreatedAt: user?.created_at,
        userId: user.id,
      }).then(({ stats, dbBadgeIds }) => {
        if (!levend) return
        setBadgeStats(stats)
        setDbBadgeIds(dbBadgeIds)
        setLoading(false)
      })
    }

    laad()
    return () => { levend = false }
  }, [profile?.player_id, seizoen?.id, user?.created_at, user?.id])

  const heeftFiche = !!profile?.player_id
  const zichtbaar = badgesVoor(heeftFiche)
  const badgesMetStatus = badgeStats
    ? zichtbaar.map(b => ({
        ...b,
        verdiend: dbBadgeIds.has(b.id) || (() => { try { return b.conditie(badgeStats) } catch { return false } })(),
      }))
    : zichtbaar.map(b => ({ ...b, verdiend: false }))

  const aantalVerdiend = badgesMetStatus.filter(b => b.verdiend).length
  const totaal = badgesMetStatus.length
  const progPct = totaal > 0 ? (aantalVerdiend / totaal) * 100 : 0

  return (
    <div>
      <PaginaKop
        bovenlabel={seizoen ? `Seizoen ${seizoen.name}` : null}
        titel="Badges"
        ondertitel={loading ? 'Berekenen…' : totaal === 0 ? 'Binnenkort beschikbaar' : `${aantalVerdiend} van ${totaal} verdiend`}
      />

      {/* Zonder spelersfiche zie je enkel wat aan je account hangt */}
      {!heeftFiche && !loading && (
        <div style={{
          background: 'var(--z-blauw-50)', border: '1px solid var(--z-blauw-200)', borderRadius: 'var(--z-r)',
          padding: '14px 18px', marginBottom: '20px', maxWidth: '560px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--z-blauw)', marginBottom: '3px' }}>
            🔗 Nog geen spelersfiche gekoppeld
          </div>
          <p style={{ fontSize: '13px', color: 'var(--z-blauw-500)', margin: 0, lineHeight: 1.55 }}>
            De badges voor wedstrijden, goals en assists komen zodra een admin je koppelt. De pronostiekbadges
            hieronder kan je nu al verdienen.
          </p>
        </div>
      )}

      {/* Voortgang: enkel tonen als er badges zijn */}
      {totaal > 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--z-lijn)', borderRadius: 'var(--z-r)',
          padding: '20px 24px', marginBottom: '28px', boxShadow: 'var(--z-schaduw-s)',
          display: 'flex', alignItems: 'center', gap: '20px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--z-tekst)' }}>Voortgang</span>
              <span style={{ fontSize: '13px', color: 'var(--z-tekst-3)' }}>{aantalVerdiend}/{totaal}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--z-lijn-zacht)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progPct}%`,
                background: 'var(--z-blauw)',
                borderRadius: '99px', transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--z-tekst)', lineHeight: 1 }}>
              {Math.round(progPct)}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>voltooid</div>
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
                fontSize: '12px', color: 'var(--z-tekst-4)', flexShrink: 0, fontWeight: '600',
                background: 'var(--z-vlak)', border: '1px solid var(--z-lijn)',
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
                    onClick={() => setGeselecteerd(badge)}
                    style={{
                      background: badge.verdiend ? c.lb : 'white',
                      border: `1.5px solid ${badge.verdiend ? c.lbo : 'var(--z-lijn)'}`,
                      borderRadius: '20px', padding: '24px 16px 18px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      cursor: 'pointer',
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
                      background: badge.verdiend ? '#dcfce7' : 'var(--z-lijn-zacht)',
                      border: `1.5px solid ${badge.verdiend ? '#86efac' : 'var(--z-lijn)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px',
                    }}>
                      {badge.verdiend ? '✓' : '🔒'}
                    </div>

                    <BadgeHex emoji={badge.emoji} categorie={badge.categorie} size={80} verdiend={badge.verdiend} />

                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '700', marginBottom: '6px',
                        color: badge.verdiend ? 'var(--z-tekst)' : 'var(--z-tekst-4)',
                      }}>
                        {verborgen(badge) ? '???' : badge.naam}
                      </div>
                      <p style={{
                        fontSize: '11px', color: badge.verdiend ? 'var(--z-tekst-3)' : 'var(--z-lijn-sterk)',
                        margin: 0, lineHeight: 1.5,
                      }}>
                        {verborgen(badge) ? '' : badge.beschrijving}
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
                <BadgeHex emoji={geselecteerd.emoji} categorie={geselecteerd.categorie} size={108} verdiend={geselecteerd.verdiend} />
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--z-tekst)', margin: '0 0 10px' }}>
                    {verborgen(geselecteerd) ? '???' : geselecteerd.naam}
                  </h2>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    padding: '4px 12px', borderRadius: '99px',
                    background: cat.lb, color: cat.lc, border: `1px solid ${cat.lbo}`,
                  }}>
                    {cat.label}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--z-tekst-2)', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
                  {(verborgen(geselecteerd) ? '' : geselecteerd.beschrijving) || 'Deze badge is nog geheim.'}
                </p>
                <button
                  onClick={() => setGeselecteerd(null)}
                  style={{
                    width: '100%', background: 'var(--z-lijn-zacht)', border: 'none',
                    borderRadius: '12px', padding: '13px', fontSize: '14px',
                    fontWeight: '600', color: 'var(--z-tekst-2)', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--z-lijn)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--z-lijn-zacht)')}
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
