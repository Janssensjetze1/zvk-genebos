import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { match_id } = await req.json()
  if (!match_id) return new Response(JSON.stringify({ error: 'match_id vereist' }), { status: 400, headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Wedstrijddata ophalen
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:home_team_id(name, is_zvk),
      away_team:away_team_id(name, is_zvk),
      goals(id, minute, scorer:scorer_id(id, name), assist:assist_id(name)),
      match_players(player:player_id(name))
    `)
    .eq('id', match_id)
    .single()

  if (error || !match) {
    return new Response(JSON.stringify({ error: 'Wedstrijd niet gevonden' }), { status: 404, headers: corsHeaders })
  }

  const isThuis = match.home_team?.is_zvk
  const zvkTeam = 'ZVK Genebos'
  const tegenstander = isThuis ? match.away_team?.name : match.home_team?.name
  const zvkScore = isThuis ? match.home_score : match.away_score
  const tegScore = isThuis ? match.away_score : match.home_score
  const datum = new Date(match.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const resultaat = zvkScore > tegScore ? 'WINST' : zvkScore < tegScore ? 'VERLIES' : 'GELIJKSPEL'

  // Seizoenstotaal per doelpuntenmaker ophalen
  const scorerIds = [...new Set((match.goals ?? []).map((g: any) => g.scorer?.id).filter(Boolean))]
  const seizoenTotalen: Record<string, number> = {}

  if (scorerIds.length > 0) {
    // Haal alle goals van dit seizoen op voor de betrokken scorers
    const { data: alleGoals } = await supabase
      .from('goals')
      .select('scorer_id, match:match_id(season_id)')
      .in('scorer_id', scorerIds)

    for (const g of alleGoals ?? []) {
      const sid = g.scorer_id
      if ((g.match as any)?.season_id === match.season_id) {
        seizoenTotalen[sid] = (seizoenTotalen[sid] ?? 0) + 1
      }
    }
  }

  const doelpunten = (match.goals ?? [])
    .map((g: any) => {
      const totaal = seizoenTotalen[g.scorer?.id]
      const totaalStr = totaal ? ` (${totaal} goals dit seizoen in totaal)` : ''
      return `${g.scorer?.name ?? 'Onbekend'}${totaalStr}${g.minute ? ` - minuut ${g.minute}` : ''}${g.assist?.name ? `, assist van ${g.assist.name}` : ''}`
    })
    .join('\n')

  const spelers = (match.match_players ?? [])
    .map((mp: any) => mp.player?.name)
    .filter(Boolean)
    .join(', ')

  const prompt = `Ge zijt de enthousiaste clubverslaggever van ZVK Genebos, een zaalvoetbalploeg uit het Zuiderkempens (Tessenderlo/Ham). Schrijf een kort, grappig wedstrijdverslag in het Zuiderkempens dialect.

TAALREGELS (strikt volgen!):
- Echt Zuiderkempens: "ge", "gij", "da", "nen", "ne", "ze emme", "ik em", "wa ne", "moste zien", "amai", "och", "da's", "nen echten", "ze hadde", "emme", "'t was"
- ZVK is ONZE ploeg — schrijf partijdig, vanuit supporter/clubperspectief
- Bij winst: trots en uitgelaten; bij verlies: dramatisch maar met zelfspot; bij gelijkspel: een beetje teleurgesteld maar sportief
- Als een speler meerdere goals heeft dit seizoen: vermeld dat grappig (bv. "da's zijn 6de al, den kerel schiet nie meer mis")
- EXACT 2 alinea's, niet meer, niet minder
- Geen opsommingen, gewoon lopende tekst
- Mag grappig en overdreven zijn, maar niet té lang

WEDSTRIJD:
ZVK Genebos ${zvkScore} - ${tegScore} ${tegenstander}
Datum: ${datum}
${isThuis ? 'Thuiswedstrijd' : 'Uitwedstrijd'}
Resultaat: ${resultaat}

DOELPUNTEN ZVK:
${doelpunten || 'Geen doelpunten geregistreerd'}

AANWEZIGE SPELERS:
${spelers || 'Niet geregistreerd'}

Schrijf het verslag nu in het Zuiderkempens dialect (exact 2 alinea's):`

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const verslag = (message.content[0] as any).text

  // Sla op in de database
  await supabase.from('matches').update({ report: verslag }).eq('id', match_id)

  return new Response(JSON.stringify({ report: verslag }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
