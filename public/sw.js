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
      if (pushData.requireInteraction) Object.assign(options, { requireInteraction: true });
      
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
  } else if (event.data && event.data.type === 'SCHEDULE_LOCAL_NOTIFICATIONS') {
    // Attempt to schedule using Notification Triggers API if supported
    if ('showTrigger' in Notification.prototype) {
      event.waitUntil(
        (async () => {
          try {
            const { schedule, cityName, notifiedPrayers, offsetMs } = event.data;
            const now = new Date();
            
            const prayerTimes = [
              { name: "Subuh", time: schedule.subuh },
              { name: "Dzuhur", time: schedule.dzuhur },
              { name: "Ashar", time: schedule.ashar },
              { name: "Maghrib", time: schedule.maghrib },
              { name: "Isya", time: schedule.isya },
            ];

            // Re-schedule for today
            for (const p of prayerTimes) {
              const canon = p.name.toLowerCase();
              if (!notifiedPrayers[canon]) continue;
              
              if (!p.time) continue;
              const [hr, mn] = p.time.split(':').map(Number);
              const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hr, mn, 0);
              const timeMs = targetTime.getTime() + (offsetMs || 0);
              
              // Only schedule future
              if (timeMs > now.getTime()) {
                await self.registration.showNotification(`Waktu Sholat ${p.name}`, {
                  body: `Telah masuk waktu sholat ${p.name} untuk wilayah ${cityName}.`,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-192x192.png',
                  vibrate: [500, 200, 500, 200, 500],
                  tag: `local-sholat-${canon}`,
                  // @ts-ignore - experimental API
                  showTrigger: new TimestampTrigger(timeMs)
                });
              }
            }
          } catch(e) { console.error('Schedule Error:', e); }
        })()
      );
    }
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-prayer-times') {
    // In a full implementation, we would read city from IndexedDB,
    // fetch new schedule API, and dispatch showTrigger for the new day
    console.log("Running periodic sync for prayer times...");
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: 'PERIODIC_SYNC_TRIGGERED' });
        }
      })
    );
  }
});
