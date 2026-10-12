import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../components/ConfirmDialog'
import { Icoon } from '../ui'

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
        background: 'radial-gradient(120% 80% at 50% 0%, #1b3a8f 0%, #13234d 45%, #0c1a3d 100%)',
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
            background: 'rgba(127,162,255,0.14)',
            border: '1px solid rgba(127,162,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c7d6ff', margin: '0 auto 20px',
          }}>
            <Icoon naam="klok" grootte={28} />
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
                background: 'rgba(199,214,255,0.7)',
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
