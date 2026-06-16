import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

// Status: 'loading' | 'unsupported' | 'denied' | 'idle' | 'subscribed' | 'error'
export function usePush() {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading')
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (user) check()
  }, [user])

  async function check() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied'); return
    }
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout')), 5000)),
      ])
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        // Controleer of de subscription ook in de DB staat
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('endpoint', sub.endpoint)
          .maybeSingle()

        if (!data) {
          // Lokale subscription bestaat maar niet in DB — hersync
          const subJson = sub.toJSON()
          const { error } = await supabase.from('push_subscriptions').upsert({
            user_id:      user.id,
            endpoint:     subJson.endpoint,
            subscription: subJson,
          }, { onConflict: 'endpoint' })
          if (error) console.warn('Hersync push subscription mislukt:', error.message)
        }
        setStatus('subscribed')
      } else {
        setStatus('idle')
      }
    } catch (e) {
      console.warn('Push check fout:', e.message)
      setStatus('idle')
    }
  }

  async function subscribe() {
    if (!user) return
    setStatus('loading')
    setFout(null)

    try {
      // 1. Toestemming vragen
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      // 2. Wacht op service worker (max 8 sec)
      let reg
      try {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, rej) => setTimeout(() => rej(new Error('Service worker niet beschikbaar. Probeer de pagina te herladen.')), 8000)),
        ])
      } catch (e) {
        throw new Error(e.message)
      }

      // 3. Maak push subscription aan in browser
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID sleutel niet geconfigureerd. Herstart de dev server na het toevoegen van VITE_VAPID_PUBLIC_KEY in .env.local')
      }
      let sub
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      } catch (e) {
        throw new Error(`Browser push fout: ${e.message ?? String(e)}`)
      }

      // 4. Sla op in Supabase — controleer fout expliciet
      const subJson = sub.toJSON()
      const { error: dbFout } = await supabase.from('push_subscriptions').upsert({
        user_id:      user.id,
        endpoint:     subJson.endpoint,
        subscription: subJson,
      }, { onConflict: 'endpoint' })

      if (dbFout) {
        // Browser subscription ongedaan maken want DB save mislukte
        await sub.unsubscribe()
        throw new Error(`Database fout: ${dbFout.message}`)
      }

      setStatus('subscribed')
    } catch (e) {
      console.error('Push subscribe fout:', e.message)
      setFout(e.message)
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    setFout(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch (e) {
      console.error('Push unsubscribe fout:', e)
      setFout(e.message)
      setStatus('subscribed')
    }
  }

  return { status, fout, subscribe, unsubscribe }
}
