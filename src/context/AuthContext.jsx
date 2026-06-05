import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Haal huidige sessie op
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Luister naar auth wijzigingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true) // Wacht op profiel voor ProtectedRoute evalueert
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) console.error('Profiel ophalen mislukt:', error.message)
    setProfile(data ?? null)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, voornaam, naam) {
    const displayName = [voornaam, naam].filter(Boolean).join(' ')
    // Geef naam mee als user_metadata — de DB-trigger leest dit bij aanmaken
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || null,
        },
      },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  // Lokale profielupdate zonder re-fetch (voor onboarding, account etc.)
  function patchProfile(changes) {
    setProfile(prev => prev ? { ...prev, ...changes } : prev)
  }

  const isAdmin = profile?.role === 'admin'
  const isApproved = profile?.approved === true

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isApproved, signIn, signUp, signOut, refreshProfile, patchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
