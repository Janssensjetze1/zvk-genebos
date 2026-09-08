import { supabase } from './supabase'

// ─── Badge-statistieken ──────────────────────────────────────────────────────
// Eén implementatie, gebruikt door zowel de desktop- als de PWA-badgepagina.
// Wijzig je hier iets, dan verandert het op beide plaatsen mee.

export function computeStats({ goalsArr, assistsArr, matchesArr, seizoenId, userCreatedAt }) {
  const goalsByMatch   = {}
  const assistsByMatch = {}
  goalsArr.forEach(g => { if (g.match_id) goalsByMatch[g.match_id] = (goalsByMatch[g.match_id] || 0) + 1 })
  assistsArr.forEach(a => { if (a.match_id) assistsByMatch[a.match_id] = (assistsByMatch[a.match_id] || 0) + 1 })
  const hattrickMatchIds = Object.entries(goalsByMatch).filter(([, n]) => n >= 3).map(([id]) => id)
  const goalMatchSet   = new Set(Object.keys(goalsByMatch))
  const assistMatchSet = new Set(Object.keys(assistsByMatch))
  return {
    aantalGoals:       goalsArr.length,
    aantalAssists:     assistsArr.length,
    aantalWedstrijden: matchesArr.length,
    seizoenGoals:      goalsArr.filter(g => g.match?.season_id === seizoenId).length,
    hattricks:               hattrickMatchIds.length,
    maxGoalsInWedstrijd:     Math.max(0, ...Object.values(goalsByMatch)),
    maxAssistsInWedstrijd:   Math.max(0, ...Object.values(assistsByMatch)),
    hattrickMetAssist:          hattrickMatchIds.filter(id => assistsByMatch[id] >= 1).length,
    wedstrijdenMetGoalEnAssist: [...goalMatchSet].filter(id => assistMatchSet.has(id)).length,
    seizoenenMetGoal:   new Set(goalsArr.map(g => g.match?.season_id).filter(Boolean)).size,
    aantalSeizoenen:    new Set(matchesArr.map(m => m.match?.season_id).filter(Boolean)).size,
    accountLeeftijdDagen: userCreatedAt ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000) : 0,
    nooitGespeeld: matchesArr.length === 0 && (userCreatedAt ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / 86400000) : 0) >= 60,
    cleanSheets: matchesArr.filter(m => {
      const match = m.match; if (!match) return false
      const zvkIsThuis = match.home_team?.is_zvk
      const tegScore = zvkIsThuis ? match.away_score : match.home_score
      return tegScore !== null && tegScore === 0
    }).length,
    aantalWedstrijdenRij: 0, maxWedstrijdenRij: 0,
    seizoenenVolledigAanwezig: 0, topScorerSeizoenen: 0,
    grootsteWinstMarge: 0, nachtbraker: false, gewonnenOpVerjaardag: false,
  }
}

// Haalt alles op wat nodig is om de badges van één speler te bepalen:
// de berekende stats en de badge-ids die een admin handmatig toekende.
export async function haalBadgeData({ playerId, seizoenId, userCreatedAt }) {
  const [goalsRes, assistsRes, matchesRes, dbRes] = await Promise.all([
    supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('scorer_id', playerId),
    supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('assist_id', playerId),
    supabase.from('match_players').select('match_id, match:match_id(season_id, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk))').eq('player_id', playerId),
    supabase.from('player_badges').select('badge_id').eq('player_id', playerId),
  ])

  return {
    stats: computeStats({
      goalsArr:      goalsRes.data   ?? [],
      assistsArr:    assistsRes.data ?? [],
      matchesArr:    matchesRes.data ?? [],
      seizoenId,
      userCreatedAt,
    }),
    dbBadgeIds: new Set((dbRes.data ?? []).map(r => r.badge_id)),
  }
}

// Combineert de badge-definities met wat deze speler verdiend heeft
export function badgesMetStatus(badges, stats, dbBadgeIds) {
  return badges.map(b => ({
    ...b,
    verdiend: dbBadgeIds.has(b.id) || (stats ? veiligeConditie(b, stats) : false),
  }))
}

function veiligeConditie(badge, stats) {
  try { return !!badge.conditie(stats) }
  catch { return false }
}
