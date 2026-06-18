self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listening for push events to trigger notifications
self.addEventListener('push', (event) => {
  let title = 'Waktu Sholat Telah Tiba';
  let options = {
    body: 'Mari tunaikan ibadah sholat.',
    icon: '/quran-icon.png', // Assuming we have an icon, fallback to default
    badge: '/quran-icon.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {action: 'explore', title: 'Buka Aplikasi', icon: '/checkmark.png'},
      {action: 'close', title: 'Tutup', icon: '/xmark.png'},
    ]
  };

  if (event.data) {
    const pushData = event.data.json();
    title = pushData.title || title;
    options.body = pushData.body || options.body;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'Pemberitahuan Quran Saku';
      const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-192x192.png',
        vibrate: data.vibrate || [300, 100, 300],
        tag: data.tag || 'quran-saku-notification',
        data: { url: '/' }
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error handling push event data:', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle message from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title, event.data.options)
    );
  }
});
