import { useState } from 'react'

// ─── In-app bevestigingsdialoog ───────────────────────────────────────────────
export function ConfirmDialog({ bericht, bevestigLabel = 'Bevestigen', annuleerLabel = 'Annuleren', gevaar = false, onBevestig, onAnnuleer }) {
  return (
    <>
      <div className="z-sheet-achter" onClick={onAnnuleer} style={{ zIndex: 1000 }} />
      <div
        role="alertdialog"
        className="z-kaart"
        style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 1001,
          transform: 'translate(-50%, -50%)',
          padding: '24px', width: '340px', maxWidth: 'calc(100vw - 32px)',
          boxShadow: 'var(--z-schaduw-l)', borderRadius: 'var(--z-r-l)',
        }}
      >
        <p style={{ fontSize: '15px', color: 'var(--z-tekst)', lineHeight: 1.55, margin: '0 0 20px' }}>
          {bericht}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="z-knop" onClick={onAnnuleer} style={{ flex: 1, height: '42px' }}>
            {annuleerLabel}
          </button>
          <button
            type="button"
            className="z-knop z-knop-primair"
            onClick={onBevestig}
            style={{ flex: 1, height: '42px', ...(gevaar && { background: 'var(--z-verlies)', borderColor: 'var(--z-verlies)' }) }}
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
