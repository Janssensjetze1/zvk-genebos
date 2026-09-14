import { supabase } from './supabase'

// ─── Badge-statistieken ──────────────────────────────────────────────────────
// Eén implementatie, gebruikt door zowel de desktop- als de PWA-badgepagina.
// Wijzig je hier iets, dan verandert het op beide plaatsen mee.

export function computeStats({ goalsArr, assistsArr, matchesArr, seizoenId, userCreatedAt, pronostiek }) {
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
    // Pronostiek — komt uit de view pronostiek_stats en hangt aan het account,
    // niet aan een spelersfiche. Ook leden zonder fiche verdienen deze badges.
    voorspellingen:       pronostiek?.voorspellingen ?? 0,
    exacteVoorspellingen: pronostiek?.exacte ?? 0,
    durfbonussen:         pronostiek?.durfbonussen ?? 0,
    pronostiekPunten:     pronostiek?.punten ?? 0,

    aantalWedstrijdenRij: 0, maxWedstrijdenRij: 0,
    seizoenenVolledigAanwezig: 0, topScorerSeizoenen: 0,
    grootsteWinstMarge: 0, nachtbraker: false, gewonnenOpVerjaardag: false,
  }
}

// Haalt alles op wat nodig is om de badges van één speler te bepalen:
// de berekende stats en de badge-ids die een admin handmatig toekende.
// playerId mag null zijn: dan hangt het account (nog) niet aan een speler en
// blijven enkel de pronostiekstatistieken over.
export async function haalBadgeData({ playerId, seizoenId, userCreatedAt, userId }) {
  const leeg = { data: [] }
  const [goalsRes, assistsRes, matchesRes, dbRes, pronoRes] = await Promise.all([
    playerId ? supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('scorer_id', playerId) : leeg,
    playerId ? supabase.from('goals').select('id, match_id, match:match_id(season_id)').eq('assist_id', playerId) : leeg,
    playerId ? supabase.from('match_players').select('match_id, match:match_id(season_id, home_score, away_score, home_team:home_team_id(is_zvk), away_team:away_team_id(is_zvk))').eq('player_id', playerId) : leeg,
    playerId ? supabase.from('player_badges').select('badge_id').eq('player_id', playerId) : leeg,
    haalPronostiekStats({ userId }),
  ])

  return {
    stats: computeStats({
      goalsArr:      goalsRes.data   ?? [],
      assistsArr:    assistsRes.data ?? [],
      matchesArr:    matchesRes.data ?? [],
      seizoenId,
      userCreatedAt,
      pronostiek:    pronoRes,
    }),
    dbBadgeIds: new Set((dbRes.data ?? []).map(r => r.badge_id)),
  }
}

// Pronostiektotalen van één persoon. Zoek op userId (jezelf) of op playerId
// (een ploegmaat in SpelerDetail). Geeft null als er nog niets is.
export async function haalPronostiekStats({ userId, playerId }) {
  if (!userId && !playerId) return null
  let query = supabase
    .from('pronostiek_stats')
    .select('voorspellingen, exacte, durfbonussen, punten')
  query = userId ? query.eq('user_id', userId) : query.eq('player_id', playerId)
  const { data } = await query.maybeSingle()
  return data ?? null
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
