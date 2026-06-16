import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Workbox injects the precache manifest here at build time
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Push notificaties ─────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch { data = { title: event.data?.text() } }

  const title = data.title ?? 'ZVK Genebos'
  const options = {
    body:    data.body  ?? '',
    icon:    '/logo.png',
    badge:   '/logo.png',
    tag:     data.tag   ?? 'zvk-push',
    data:    { url: data.url ?? '/app' },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notificatie klik ──────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Breng een open venster naar voren als dat bestaat
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Anders: open nieuw venster
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
