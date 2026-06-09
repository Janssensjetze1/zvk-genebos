import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Laden...</div>
    </div>
  )
}
