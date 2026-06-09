import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function lokaalVandaag() {
  const nu = new Date()
  const y = nu.getFullYear()
  const m = String(nu.getMonth() + 1).padStart(2, '0')
  const d = String(nu.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useMatchdayCountdown(seizoenId) {
  const [wedstrijd, setWedstrijd] = useState(null)
  const [restTijd, setRestTijd] = useState(null) // null = laden, false = voorbij/geen match

  useEffect(() => {
    if (!seizoenId) return
    const vandaag = lokaalVandaag()
    supabase
      .from('matches')
      .select('id, time, home_team:home_team_id(name, is_zvk), away_team:away_team_id(name, is_zvk)')
      .eq('season_id', seizoenId)
      .eq('date', vandaag)
      .not('time', 'is', null)
      .order('time', { ascending: true })
      .limit(1)
      .then(({ data }) => setWedstrijd(data?.[0] ?? null))
  }, [seizoenId])

  useEffect(() => {
    if (!wedstrijd?.time) {
      if (wedstrijd !== null) setRestTijd(false) // wedstrijd geladen maar geen time
      return
    }

    function bereken() {
      const nu = new Date()
      const tijdStr = wedstrijd.time.slice(0, 5) // "HH:MM"
      const [uur, min] = tijdStr.split(':').map(Number)
      const aftrap = new Date()
      aftrap.setHours(uur, min, 0, 0)
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
