import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ververseQuotes } from '../lib/quotes'

const AuthContext = createContext({})

// Bijhouden wanneer iemand de app laatst opende. Een sessie blijft maanden
// geldig, dus de logindatum zegt niets over wie er nog actief is.
// Hoogstens een keer per kwartier schrijven, anders gaat dit bij elke
// paginalading naar de database.
const ONLINE_INTERVAL = 15 * 60 * 1000

async function markeerOnline(userId) {
  if (!userId) return
  try {
    // Sleutel per gebruiker: delen twee accounts één browser, dan houdt de
    // ene de andere niet tegen.
    const sleutel = `last_seen_${userId}`
    const vorige = Number(localStorage.getItem(sleutel) ?? 0)
    if (Date.now() - vorige < ONLINE_INTERVAL) return
    localStorage.setItem(sleutel, String(Date.now()))
  } catch {
    // Privémodus zonder localStorage: dan schrijven we gewoon elke keer
  }
  await supabase.rpc('markeer_online')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Voor wie het profiel geladen is (of wordt). Supabase meldt ook SIGNED_IN
  // en TOKEN_REFRESHED als de app terug op de voorgrond komt, bv. na de
  // fotokiezer of een andere app. Zou dat het laadscherm tonen, dan wordt de
  // pagina opnieuw opgebouwd en is alles wat je nog niet bewaarde weg.
  // Daarom enkel opnieuw laden als er echt iemand anders aangemeld is.
  const geladenVoor = useRef(null)

  useEffect(() => {
    function laadVoor(userId) {
      if (geladenVoor.current === userId) return
      geladenVoor.current = userId
      setLoading(true) // Wacht op profiel voor ProtectedRoute evalueert
      fetchProfile(userId)
    }

    // Haal huidige sessie op
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        laadVoor(session.user.id)
        markeerOnline(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Luister naar auth wijzigingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        laadVoor(session.user.id)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          markeerOnline(session.user.id)
        }
      } else {
        geladenVoor.current = null
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
    // Quotes voor de laadpagina op de achtergrond verversen, de laadpagina
    // zelf wacht hier niet op, ze leest de cache van de vorige keer.
    if (data?.approved) ververseQuotes()
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, voornaam, naam) {
    const displayName = [voornaam, naam].filter(Boolean).join(' ')
    // Geef naam mee als user_metadata, de DB-trigger leest dit bij aanmaken
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
