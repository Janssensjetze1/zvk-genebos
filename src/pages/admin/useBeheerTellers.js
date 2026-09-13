import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSeason } from '../../context/SeasonContext'
import { isGespeeld } from '../../lib/wedstrijd'

// Wat vraagt aandacht in het beheer? Drie getallen die ook als teller naast de
// onderdelen in de navigatie staan.
const LEEG = { wachtendeLeden: 0, ongelezenFeedback: 0, bladOntbreekt: 0 }

export function useBeheerTellers() {
  const { actief: seizoen } = useSeason()
  const [tellers, setTellers] = useState(LEEG)

  const herlaad = useCallback(async () => {
    const [leden, feedback, wedstrijden] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('approved', false),
      supabase.from('feedback').select('id', { count: 'exact', head: true }).is('read_at', null),
      seizoen
        ? supabase
            .from('matches')
            .select('id, date, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk), match_players(player_id), goals(id)')
            .eq('season_id', seizoen.id)
        : Promise.resolve({ data: [] }),
    ])

    // Gespeelde ZVK-wedstrijden waarvoor het wedstrijdblad nog leeg is
    const bladOntbreekt = (wedstrijden.data ?? []).filter(w =>
      (w.home_team?.is_zvk || w.away_team?.is_zvk) &&
      isGespeeld(w) &&
      (w.match_players?.length ?? 0) === 0
    ).length

    setTellers({
      wachtendeLeden: leden.count ?? 0,
      ongelezenFeedback: feedback.count ?? 0,
      bladOntbreekt,
    })
  }, [seizoen?.id])

  useEffect(() => { herlaad() }, [herlaad])

  return { ...tellers, herlaad, setTellers }
}
