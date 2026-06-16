import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../components/ConfirmDialog'

export default function PendingApproval() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { bevestig, ConfirmUI } = useConfirm()

  async function handleSignOut() {
    if (!await bevestig('Wil je uitloggen?', { bevestigLabel: 'Uitloggen' })) return
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {ConfirmUI}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0a0a14',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {/* Logo */}
        <img
          src="/logo.png"
          alt="ZVK Genebos"
          style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '40px', opacity: 0.9 }}
        />

        {/* Kaart */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '36px 32px',
          width: '100%', maxWidth: '360px',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Icoon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(234,179,8,0.12)',
            border: '1.5px solid rgba(234,179,8,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 20px',
          }}>
            ⏳
          </div>

          <h2 style={{
            fontSize: '20px', fontWeight: '700',
            color: 'rgba(255,255,255,0.92)',
            margin: '0 0 10px',
          }}>
            Wachten op goedkeuring
          </h2>

          <p style={{
            fontSize: '14px', color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.65, margin: '0 0 32px',
          }}>
            Je account is aangemaakt maar nog niet goedgekeurd door een admin.
            Neem contact op met de beheerder van ZVK Genebos.
          </p>

          {/* Pulserende wacht-indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', marginBottom: '32px',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'rgba(234,179,8,0.6)',
                animation: `pulse-soft 1.4s ${i * 0.22}s ease-in-out infinite`,
              }} />
            ))}
          </div>

          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px', fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', width: '100%',
            }}
          >
            Uitloggen
          </button>
        </div>
      </div>
    </>
  )
}
