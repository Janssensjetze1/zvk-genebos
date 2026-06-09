import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SeasonProvider } from './context/SeasonContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'

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
import Invullen from './pages/Invullen'

export default function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
      <BrowserRouter>
        <Routes>
          {/* Publieke routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<PendingApproval />} />

          {/* Beschermde routes voor leden */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Leden routes */}
          <Route path="/spelers" element={
            <ProtectedRoute>
              <Layout><Spelers /></Layout>
            </ProtectedRoute>
          } />

          {/* Wedstrijden route */}
          <Route path="/wedstrijden" element={
            <ProtectedRoute>
              <Layout><Wedstrijden /></Layout>
            </ProtectedRoute>
          } />

          {/* Klassement route */}
          <Route path="/klassement" element={
            <ProtectedRoute>
              <Layout><Klassement /></Layout>
            </ProtectedRoute>
          } />

          {/* Account route */}
          <Route path="/account" element={
            <ProtectedRoute>
              <Layout><Account /></Layout>
            </ProtectedRoute>
          } />

          {/* PWA invulpagina — geen sidebar */}
          <Route path="/invullen" element={
            <AdminRoute>
              <Invullen />
            </AdminRoute>
          } />

          {/* Gouden Jaar route */}
          <Route path="/gouden-jaar" element={
            <ProtectedRoute>
              <Layout><GoudenJaar /></Layout>
            </ProtectedRoute>
          } />

          {/* Onboarding route */}
          <Route path="/onboarding" element={
            <ProtectedRoute skipOnboarding={true}>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute skipOnboarding={true}>
              <Layout><Admin /></Layout>
            </AdminRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SeasonProvider>
    </AuthProvider>
  )
}
