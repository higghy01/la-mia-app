// La mia app si è spostata su https://la-mia-app-sv.web.app: questo service worker cancella la vecchia cache e si toglie.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate('https://la-mia-app-sv.web.app/');
})()));
