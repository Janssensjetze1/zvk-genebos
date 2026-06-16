import { useState } from 'react'

// ─── In-app bevestigingsdialoog ───────────────────────────────────────────────
export function ConfirmDialog({ bericht, bevestigLabel = 'Bevestigen', annuleerLabel = 'Annuleren', gevaar = false, onBevestig, onAnnuleer }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onAnnuleer}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 1001,
        transform: 'translate(-50%, -50%)',
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '28px 28px 24px',
        width: '320px', maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <p style={{
          fontSize: '15px', color: 'rgba(255,255,255,0.88)',
          lineHeight: 1.55, margin: '0 0 24px', textAlign: 'center',
        }}>
          {bericht}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onAnnuleer}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {annuleerLabel}
          </button>
          <button
            onClick={onBevestig}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              background: gevaar
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #6366f1, #22d3ee)',
              border: 'none',
              color: 'white',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              boxShadow: gevaar
                ? '0 4px 16px rgba(220,38,38,0.35)'
                : '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            {bevestigLabel}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Hook: gebruik als vervanger van window.confirm() ─────────────────────────
// Gebruik: const { bevestig, ConfirmUI } = useConfirm()
// Dan: if (!await bevestig('Weet je het zeker?', { gevaar: true })) return
// En in JSX: {ConfirmUI}
export function useConfirm() {
  const [staat, setSstaat] = useState(null)

  function bevestig(bericht, opties = {}) {
    return new Promise(resolve => {
      setSstaat({ bericht, opties, resolve })
    })
  }

  const ConfirmUI = staat ? (
    <ConfirmDialog
      bericht={staat.bericht}
      bevestigLabel={staat.opties.bevestigLabel ?? 'Bevestigen'}
      annuleerLabel={staat.opties.annuleerLabel ?? 'Annuleren'}
      gevaar={staat.opties.gevaar ?? false}
      onBevestig={() => { staat.resolve(true);  setSstaat(null) }}
      onAnnuleer={() => { staat.resolve(false); setSstaat(null) }}
    />
  ) : null

  return { bevestig, ConfirmUI }
}
