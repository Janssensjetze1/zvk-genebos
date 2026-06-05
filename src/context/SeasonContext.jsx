import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SeasonContext = createContext(null)

export function SeasonProvider({ children }) {
  const [seizoenen, setSeizoen] = useState([])
  const [actief, setActief] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    laadSeizoen()
  }, [])

  async function laadSeizoen() {
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .order('start_date', { ascending: false })
    const lijst = data ?? []
    setSeizoen(lijst)
    const opgeslagen = localStorage.getItem('actief_seizoen_id')
    const gevonden = lijst.find(s => s.id === opgeslagen)
    setActief(gevonden ?? lijst[0] ?? null)
    setLoading(false)
  }

  function switchSeizoen(seizoen) {
    setActief(seizoen)
    localStorage.setItem('actief_seizoen_id', seizoen.id)
  }

  return (
    <SeasonContext.Provider value={{ seizoenen, actief, switchSeizoen, loading }}>
      {children}
    </SeasonContext.Provider>
  )
}

export function useSeason() {
  return useContext(SeasonContext)
}
