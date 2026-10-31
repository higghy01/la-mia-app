// Service worker di "La mia app": notifiche push e copia per l'uso offline.
// Offline: prima la rete; se non c'è, l'ultima copia salvata (i dati restano cifrati anche nella copia).
const CACHE = 'lma-offline-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((r) => {
    if (r.ok && r.type === 'basic') { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)).catch(() => {}); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => {
    if (!r) return Response.error();
    // la pagina capisce dall'intestazione che sta usando la copia salvata
    const h = new Headers(r.headers); h.set('X-LMA-Offline', '1');
    return r.blob().then((b) => new Response(b, { status: r.status, statusText: r.statusText, headers: h }));
  })));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  // su iPhone ogni push deve mostrare una notifica, altrimenti Safari toglie il permesso
  e.waitUntil(self.registration.showNotification(d.title || 'La mia app', {
    body: d.body || '', tag: d.tag || undefined, icon: 'icona-180.png', badge: 'icona-180.png', data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
