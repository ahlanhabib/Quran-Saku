self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listening for push events to trigger notifications
self.addEventListener('push', (event) => {
  let title = 'Pemberitahuan Quran Saku';
  let options = {
    body: '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: '/'
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      title = pushData.title || title;
      options.body = pushData.body || options.body;
      if (pushData.icon) options.icon = pushData.icon;
      if (pushData.badge) options.badge = pushData.badge;
      if (pushData.tag) options.tag = pushData.tag;
      if (pushData.vibrate) options.vibrate = pushData.vibrate;
      
      if (pushData.isAdhan) {
        // As a fallback for browsers that support it (like Firefox/some Android configurations)
        const audioUrl = pushData.prayerName === 'Subuh' ? '/Subuh.mp3' : '/Azan.mp3';
        options.sound = audioUrl;
        
        // Notify any open clients to play the audio (so it rings even if tab is in background)
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
              client.postMessage({
                type: 'PLAY_ADHAN',
                prayerName: pushData.prayerName
              });
            }
          })
        );
      }
    } catch (e) {
      console.error('Error handling push event data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
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
