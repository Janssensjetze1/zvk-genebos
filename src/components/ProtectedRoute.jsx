import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QUOTES } from '../pwa/PWASplashScreen'

export function ProtectedRoute({ children, skipOnboarding = false }) {
  const { user, profile, isApproved, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!profile) return <LoadingScreen />
  if (!isApproved) return <Navigate to="/pending" replace />
  if (!skipOnboarding && !profile.onboarding_done) return <Navigate to="/onboarding" replace />

  return children
}

export function AdminRoute({ children, skipOnboarding = true }) {
  const { user, profile, isApproved, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!profile) return <LoadingScreen />
  if (!isApproved) return <Navigate to="/pending" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  if (!skipOnboarding && !profile.onboarding_done) return <Navigate to="/onboarding" replace />

  return children
}

function LoadingScreen() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px',
    }}>
      {/* Logo */}
      <img
        src="/logo.png"
        alt="ZVK Genebos"
        style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '48px' }}
      />

      {/* Quote */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '340px' }}>
        <p style={{
          fontSize: '15px', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.65, marginBottom: '12px', fontWeight: '400',
        }}>
          "{quote.text}"
        </p>
        <p style={{
          fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          — {quote.auteur}
        </p>
      </div>

      {/* Pulserende loading bar */}
      <div style={{
        width: '180px', height: '3px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '100px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: '40%',
          background: 'linear-gradient(90deg, transparent, #3b82f6, #93c5fd, transparent)',
          borderRadius: '100px',
          animation: 'loading-shimmer 1.4s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes loading-shimmer {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
