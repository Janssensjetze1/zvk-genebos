import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SeasonProvider } from './context/SeasonContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import PWALayout from './pwa/PWALayout'
import { useIsMobile } from './hooks/useIsMobile'
import { useIsPWA } from './hooks/useIsPWA'

// Desktop pagina's
import Login from './pages/Login'
import Register from './pages/Register'
import PendingApproval from './pages/PendingApproval'
import Dashboard from './pages/Dashboard'
import Admin from './pages/admin/Admin'
import Spelers from './pages/Spelers'
import Account from './pages/Account'
import Onboarding from './pages/Onboarding'
import Klassement from './pages/Klassement'
import Wedstrijden from './pages/Wedstrijden'
import GoudenJaar from './pages/GoudenJaar'
import MobileGate from './pages/MobileGate'

// PWA pagina's
import PWAWedstrijden from './pwa/PWAWedstrijden'
import PWAKlassement from './pwa/PWAKlassement'
import PWAStats from './pwa/PWAStats'
import PWASpelers from './pwa/PWASpelers'
import Invullen from './pages/Invullen'

function AppRoutes() {
  const isMobile = useIsMobile()
  const isPWA = useIsPWA()

  // Mobile browser (niet als PWA geïnstalleerd) → blokkeer
  if (isMobile && !isPWA) {
    return (
      <Routes>
        <Route path="*" element={<MobileGate />} />
      </Routes>
    )
  }

  // PWA op mobile → eigen layout met bottom nav
  if (isPWA) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/onboarding" element={
          <ProtectedRoute skipOnboarding={true}><Onboarding /></ProtectedRoute>
        } />

        <Route path="/app" element={
          <ProtectedRoute>
            <PWALayout><PWAWedstrijden /></PWALayout>
          </ProtectedRoute>
        } />
        <Route path="/app/klassement" element={
          <ProtectedRoute>
            <PWALayout><PWAKlassement /></PWALayout>
          </ProtectedRoute>
        } />
        <Route path="/app/stats" element={
          <ProtectedRoute>
            <PWALayout><PWAStats /></PWALayout>
          </ProtectedRoute>
        } />
        <Route path="/app/spelers" element={
          <ProtectedRoute>
            <PWALayout><PWASpelers /></PWALayout>
          </ProtectedRoute>
        } />
        <Route path="/app/invullen" element={
          <AdminRoute>
            <Invullen />
          </AdminRoute>
        } />

        {/* Alles → PWA home */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    )
  }

  // Desktop → normale layout
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pending" element={<PendingApproval />} />
      <Route path="/onboarding" element={
        <ProtectedRoute skipOnboarding={true}><Onboarding /></ProtectedRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/spelers" element={
        <ProtectedRoute><Layout><Spelers /></Layout></ProtectedRoute>
      } />
      <Route path="/wedstrijden" element={
        <ProtectedRoute><Layout><Wedstrijden /></Layout></ProtectedRoute>
      } />
      <Route path="/klassement" element={
        <ProtectedRoute><Layout><Klassement /></Layout></ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>
      } />
      <Route path="/gouden-jaar" element={
        <ProtectedRoute><Layout><GoudenJaar /></Layout></ProtectedRoute>
      } />
      <Route path="/invullen" element={
        <AdminRoute><Invullen /></AdminRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute skipOnboarding={true}><Layout><Admin /></Layout></AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SeasonProvider>
    </AuthProvider>
  )
}
