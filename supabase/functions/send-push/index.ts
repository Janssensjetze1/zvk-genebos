import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── VAPID signing via Web Crypto (Deno native, geen npm nodig) ────────────────
async function importVapidPrivateKey(base64urlKey: string): Promise<CryptoKey> {
  const padding = '='.repeat((4 - (base64urlKey.length % 4)) % 4)
  const base64 = (base64urlKey + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'raw', raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveKey', 'deriveBits']
  ).catch(() =>
    // Fallback: probeer als pkcs8
    crypto.subtle.importKey(
      'pkcs8', raw,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true, ['sign']
    )
  ) as Promise<CryptoKey>
}

async function signVapidJwt(audience: string, subject: string, publicKey: string, privateKeyB64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header  = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: subject })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsigned = `${header}.${payload}`

  // Importeer private key als PKCS8 (DER formaat)
  const padding = '='.repeat((4 - (privateKeyB64.length % 4)) % 4)
  const b64 = (privateKeyB64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))

  // Web Crypto verwacht PKCS8 voor ES256 signing
  // Bouw PKCS8 wrapper rond de raw private key (32 bytes P-256)
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
    0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ])
  const pkcs8 = new Uint8Array(pkcs8Header.length + rawBytes.length)
  pkcs8.set(pkcs8Header)
  pkcs8.set(rawBytes, pkcs8Header.length)

  const key = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${unsigned}.${sigB64}`
}

// ── Stuur één push naar een subscription ─────────────────────────────────────
async function sendPushMessage(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, vapidPublic: string, vapidPrivate: string, subject: string) {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await signVapidJwt(audience, subject, vapidPublic, vapidPrivate)
  const vapidHeader = `vapid t=${jwt},k=${vapidPublic}`

  // Encrypt payload met ECDH + AES-GCM
  const encrypted = await encryptPayload(payload, subscription.keys.p256dh, subscription.keys.auth)

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type':   'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization':  vapidHeader,
      'TTL':            '86400',
      ...encrypted.headers,
    },
    body: encrypted.body,
  })

  if (!res.ok && res.status !== 201) {
    throw new Error(`Push endpoint ${res.status}: ${await res.text()}`)
  }
}

// ── AES128GCM payload encryptie (RFC 8291) ────────────────────────────────────
async function encryptPayload(plaintext: string, p256dhB64: string, authB64: string) {
  const decoder = new TextDecoder()

  function b64decode(s: string) {
    const pad = '='.repeat((4 - (s.length % 4)) % 4)
    return Uint8Array.from(atob((s + pad).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  }

  const receiverPublicKeyBytes = b64decode(p256dhB64)
  const authSecret = b64decode(authB64)

  // Genereer ephemeral key pair
  const senderKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const senderPublicKey = await crypto.subtle.exportKey('raw', senderKeyPair.publicKey)

  // Import receiver public key
  const receiverPublicKey = await crypto.subtle.importKey(
    'raw', receiverPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  )

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverPublicKey },
    senderKeyPair.privateKey, 256
  )

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // HKDF voor content encryption key en nonce
  const enc = new TextEncoder()

  async function hkdf(ikm: ArrayBuffer, salt: Uint8Array, info: Uint8Array, length: number) {
    const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
    return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, ikmKey, length * 8)
  }

  // PRK via HKDF-Extract met auth secret als salt
  const keyInfo = concat(enc.encode('WebPush: info\x00'), receiverPublicKeyBytes, new Uint8Array(senderPublicKey))
  const prk = await hkdf(sharedSecret, authSecret, keyInfo, 32)

  const cekInfo = enc.encode('Content-Encoding: aes128gcm\x00')
  const nonceInfo = enc.encode('Content-Encoding: nonce\x00')

  const cek = await hkdf(prk, salt, cekInfo, 16)
  const nonce = await hkdf(prk, salt, nonceInfo, 12)

  // Importeer content encryption key
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])

  // Pad plaintext (minimaal 1 byte padding)
  const plaintextBytes = enc.encode(plaintext)
  const padded = new Uint8Array(plaintextBytes.length + 2)
  padded.set(plaintextBytes)
  padded[plaintextBytes.length] = 0x02  // record delimiter

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey, padded
  )

  // Bouw aes128gcm content coding header
  const header = new Uint8Array(21 + senderPublicKey.byteLength)
  header.set(salt, 0)                          // 16 bytes salt
  new DataView(header.buffer).setUint32(16, 4096, false)  // rs = 4096
  header[20] = senderPublicKey.byteLength      // keyid length
  header.set(new Uint8Array(senderPublicKey), 21)

  const body = concat(header, new Uint8Array(ciphertext))

  return {
    body,
    headers: { 'Content-Length': body.length.toString() },
  }
}

function concat(...arrays: Uint8Array[]) {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { result.set(a, offset); offset += a.length }
  return result
}

// ── Hoofdfunctie ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Niet geautoriseerd' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Controleer of aanvrager admin is
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Geen admin rechten' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const { title, body, url } = await req.json()
    if (!title || !body) return new Response(JSON.stringify({ error: 'Titel en bericht zijn verplicht' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const payload = JSON.stringify({ title, body, url: url ?? '/app' })
    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? ''
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@zvkgenebos.be'

    // Haal alle subscriptions op
    const { data: subs, error: subsError } = await supabaseAdmin.from('push_subscriptions').select('endpoint, subscription')
    if (subsError) throw subsError

    if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent: 0, failed: 0, message: 'Geen abonnees' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    // Stuur naar alle subscriptions
    const results = await Promise.allSettled(
      subs.map(row => sendPushMessage(row.subscription, payload, vapidPublic, vapidPrivate, vapidSubject))
    )

    // Verwijder verlopen subscriptions (410 Gone)
    const expiredEndpoints: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected' && r.reason?.message?.includes('410')) {
        expiredEndpoints.push(subs[i].endpoint)
      }
    })
    if (expiredEndpoints.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
    }

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected' && !r.reason?.message?.includes('410')).length

    return new Response(JSON.stringify({ sent, failed, total: subs.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
