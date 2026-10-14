import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Geeft de OpenAPI-beschrijving van de database terug, voor het schema in
// Beheer → Database. Supabase geeft die enkel vrij met de service-sleutel, en
// die mag nooit in de app terechtkomen. Daarom loopt het via deze functie,
// en enkel voor admins.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Niet geautoriseerd' }, 401)

    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Niet ingelogd' }, 401)

    const admin = createClient(url, serviceKey)
    const { data: profiel } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profiel?.role !== 'admin') return json({ error: 'Geen admin rechten' }, 403)

    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/openapi+json' },
    })
    if (!res.ok) return json({ error: `Schema ophalen mislukt (${res.status})` }, 502)

    // Enkel wat het schema nodig heeft: tabellen en kolommen
    const spec = await res.json()
    return json({ definitions: spec.definitions ?? {} })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
