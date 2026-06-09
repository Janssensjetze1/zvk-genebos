import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function datumString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useMatchdayCountdown(seizoenId) {
  const [wedstrijd, setWedstrijd] = useState(null)
  const [restTijd, setRestTijd] = useState(null) // null = laden, false = voorbij/geen match

  useEffect(() => {
    if (!seizoenId) return

    const nu = new Date()

    supabase
      .from('matches')
      .select('id, date, time, home_team:home_team_id(name, is_zvk), away_team:away_team_id(name, is_zvk)')
      .eq('season_id', seizoenId)
      .eq('date', datumString(nu))
      .not('time', 'is', null)
      .order('time', { ascending: true })
      .then(({ data }) => {
        // Eerste wedstrijd van vandaag die nog niet begonnen is
        const gevonden = (data ?? []).find(w => {
          const [uur, min] = w.time.slice(0, 5).split(':').map(Number)
          const aftrap = new Date(`${w.date}T${String(uur).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`)
          return aftrap > nu
        })
        setWedstrijd(gevonden ?? null)
      })
  }, [seizoenId])

  useEffect(() => {
    if (!wedstrijd?.time) {
      if (wedstrijd !== null) setRestTijd(false) // wedstrijd geladen maar geen time
      return
    }

    function bereken() {
      const nu = new Date()
      const [uur, min] = wedstrijd.time.slice(0, 5).split(':').map(Number)
      const aftrap = new Date(`${wedstrijd.date}T${String(uur).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`)
      const diff = aftrap - nu
      if (diff <= 0) { setRestTijd(false); return }
      const totMinuten = Math.floor(diff / 60000)
      const uren = Math.floor(totMinuten / 60)
      const minuten = totMinuten % 60
      setRestTijd(uren > 0 ? `${uren}u${minuten < 10 ? '0' : ''}${minuten}m` : `${minuten}m`)
    }

    bereken()
    const interval = setInterval(bereken, 30000)
    return () => clearInterval(interval)
  }, [wedstrijd])

  return { wedstrijd, restTijd }
}
