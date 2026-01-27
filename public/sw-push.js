// Push Notification Service Worker
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'MirCafe',
    body: 'Yangi xabar!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
    requireInteraction: true,
    tag: 'mircafe-notification',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MirCafe', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If there's already an open window, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push subscription changed');
  // Handle subscription change - the app will re-subscribe on next load
});
