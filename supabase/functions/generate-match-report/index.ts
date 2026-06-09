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
      goals(id, minute, scorer:scorer_id(name), assist:assist_id(name)),
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

  const doelpunten = (match.goals ?? [])
    .map((g: any) => `${g.scorer?.name ?? 'Onbekend'}${g.minute ? ` (${g.minute}')` : ''}${g.assist?.name ? `, assist: ${g.assist.name}` : ''}`)
    .join('\n')

  const spelers = (match.match_players ?? [])
    .map((mp: any) => mp.player?.name)
    .filter(Boolean)
    .join(', ')

  const prompt = `Schrijf een overdreven dramatisch en grappig wedstrijdverslag in het Vlaams dialect over volgende zaalvoetbalwedstrijd.
Gebruik typisch Vlaamse uitdrukkingen en spreektaal (amai, godverdamme, ge, gij, den, nen, ne, da, ne keer, etc.).
Doe alsof het om een WK-finale gaat. Wees melodramatisch, overdreven en een beetje humoristisch.
Schrijf in paragrafen (geen bullets). Ongeveer 3-4 paragrafen. Gebruik de echte spelersnamen.

WEDSTRIJD:
${zvkTeam} ${zvkScore} - ${tegScore} ${tegenstander}
Datum: ${datum}
Thuis/Uit: ${isThuis ? 'Thuis' : 'Uit'}
Resultaat: ${resultaat}

DOELPUNTEN:
${doelpunten || 'Geen doelpunten geregistreerd'}

AANWEZIGE SPELERS:
${spelers || 'Geen spelers geregistreerd'}

Schrijf het verslag nu:`

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const verslag = (message.content[0] as any).text

  // Sla op in de database
  await supabase.from('matches').update({ report: verslag }).eq('id', match_id)

  return new Response(JSON.stringify({ report: verslag }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
