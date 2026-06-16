import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Converteer VAPID public key van base64url naar Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

// Status: 'loading' | 'unsupported' | 'denied' | 'idle' | 'subscribed'
export function usePush() {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading')

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
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'idle')
    } catch {
      setStatus('idle')
    }
  }

  async function subscribe() {
    if (!user) return
    setStatus('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subJson = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({
        user_id:      user.id,
        endpoint:     subJson.endpoint,
        subscription: subJson,
      }, { onConflict: 'endpoint' })

      setStatus('subscribed')
    } catch (e) {
      console.error('Push subscribe fout:', e)
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
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
      setStatus('subscribed')
    }
  }

  return { status, subscribe, unsubscribe }
}
