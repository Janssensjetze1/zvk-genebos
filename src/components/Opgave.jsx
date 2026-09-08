import { MAX_MEE, OPGAVE_STATUSSEN, opgaveIsOpen, useOpgave } from '../hooks/useOpgave'

// Opgave voor een aankomende wedstrijd: elke speler duidt zelf aan of hij meedoet.
// variant: 'pwa' (compacter) of 'desktop'
export default function Opgave({ wedstrijd, variant = 'pwa' }) {
  const { perStatus, mijnStatus, zetStatus, loading, bezig, spelerId, aantalMee, vol, fout } = useOpgave(wedstrijd.id)
  const compact = variant === 'pwa'

  // De ouder verbergt dit blok al, dit is enkel een vangnet
  if (!opgaveIsOpen(wedstrijd)) return null

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '10px 0' }}>
        Opgave laden...
      </div>
    )
  }

  const volzet = aantalMee >= MAX_MEE
  const niemand = OPGAVE_STATUSSEN.every(s => perStatus[s.id].length === 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Kop met teller */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontSize: '11px', fontWeight: '700', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          ✋ Wie doet mee?
        </span>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          padding: '3px 9px', borderRadius: '20px',
          background: volzet ? '#fef2f2' : aantalMee > 0 ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${volzet ? '#fecaca' : aantalMee > 0 ? '#bbf7d0' : '#e2e8f0'}`,
          color: volzet ? '#ef4444' : aantalMee > 0 ? '#16a34a' : '#94a3b8',
        }}>
          {aantalMee}/{MAX_MEE}{volzet ? ' · volzet' : ''}
        </span>
      </div>

      {/* Bezettingsbalk */}
      <div style={{ height: '5px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, (aantalMee / MAX_MEE) * 100)}%`,
          height: '100%',
          background: volzet ? '#ef4444' : '#16a34a',
          transition: 'width 0.25s',
        }} />
      </div>

      {/* Keuzeknoppen */}
      {spelerId ? (
        <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', gap: '6px' }}>
          {OPGAVE_STATUSSEN.map(s => {
            const actief = mijnStatus === s.id
            const geblokkeerd = s.id === 'mee' && vol
            const uit = bezig || geblokkeerd
            return (
              <button
                key={s.id}
                type="button"
                disabled={uit}
                title={geblokkeerd ? `Volzet — er kunnen maar ${MAX_MEE} spelers meedoen` : undefined}
                onClick={e => { e.stopPropagation(); zetStatus(s.id) }}
                style={{
                  flex: compact ? 'none' : 1,
                  width: compact ? '100%' : 'auto',
                  display: 'flex', alignItems: 'center',
                  justifyContent: compact ? 'flex-start' : 'center',
                  gap: '8px',
                  padding: compact ? '11px 14px' : '10px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${actief ? s.rand : '#e2e8f0'}`,
                  background: actief ? s.bg : geblokkeerd ? '#f8fafc' : 'white',
                  color: actief ? s.kleur : geblokkeerd ? '#cbd5e1' : '#64748b',
                  fontSize: compact ? '12px' : '13px',
                  fontWeight: actief ? '700' : '500',
                  cursor: uit ? 'not-allowed' : 'pointer',
                  opacity: bezig ? 0.6 : 1,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '14px', opacity: geblokkeerd ? 0.4 : 1 }}>{s.emoji}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
                {geblokkeerd && (
                  <span style={{ marginLeft: compact ? 'auto' : '0', fontSize: '11px', fontWeight: '600' }}>
                    Volzet
                  </span>
                )}
                {actief && compact && !geblokkeerd && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700' }}>Jouw keuze</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{
          fontSize: '12px', color: '#94a3b8', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px',
        }}>
          Je account is nog niet aan een spelersfiche gekoppeld — vraag een admin om dit te doen, dan kan je je opgeven.
        </div>
      )}

      {/* Foutmelding */}
      {fout && (
        <div style={{
          fontSize: '12px', color: '#b91c1c', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px',
        }}>
          {fout}
        </div>
      )}

      {/* Overzicht per status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {OPGAVE_STATUSSEN.map(s => {
          const lijst = perStatus[s.id]
          if (lijst.length === 0) return null
          return (
            <div key={s.id}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: s.kleur, marginBottom: '6px' }}>
                {s.emoji} {s.kort} ({lijst.length}{s.id === 'mee' ? `/${MAX_MEE}` : ''})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {lijst
                  .slice()
                  .sort((a, b) => (a.player?.name ?? '').localeCompare(b.player?.name ?? ''))
                  .map(o => (
                    <span key={o.player_id} style={{
                      fontSize: '12px', color: '#475569', background: s.bg,
                      border: `1px solid ${s.rand}`, borderRadius: '20px', padding: '3px 10px',
                    }}>
                      {o.player?.name ?? 'Onbekend'}
                    </span>
                  ))}
              </div>
            </div>
          )
        })}
        {niemand && (
          <div style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>
            Nog niemand heeft zich opgegeven.
          </div>
        )}
      </div>
    </div>
  )
}
