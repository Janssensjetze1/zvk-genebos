import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Route die enkel toegankelijk is voor ingelogde, goedgekeurde gebruikers
export function ProtectedRoute({ children, skipOnboarding = false }) {
  const { user, profile, isApproved, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <LoadingScreen /> // Profiel laadt nog
  if (!isApproved) return <Navigate to="/pending" replace />
  if (!skipOnboarding && !profile.onboarding_done) return <Navigate to="/onboarding" replace />

  return children
}

// Route die enkel toegankelijk is voor admins
export function AdminRoute({ children, skipOnboarding = true }) {
  const { user, profile, isApproved, isAdmin, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <LoadingScreen /> // Profiel laadt nog
  if (!isApproved) return <Navigate to="/pending" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  if (!skipOnboarding && !profile.onboarding_done) return <Navigate to="/onboarding" replace />

  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Laden...</div>
    </div>
  )
}
