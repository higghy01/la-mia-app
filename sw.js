// Service worker di "La mia app": notifiche push e copia per l'uso offline.
// Offline: prima la rete; se non c'è (o se dopo 4 secondi non ha ancora risposto), l'ultima copia salvata
// (i dati restano cifrati anche nella copia).
// Una sola copia per file, salvata senza "?t=…" (review 1/11: con l'ora nell'indirizzo ogni lettura aggiungeva una copia
// in più, e senza rete tornava la più vecchia). La cache vecchia "lma-offline-1", piena di copie, si cancella.
const CACHE = 'lma-offline-3'; // v37 (review 3/11): nuova cache, riempita già all'installazione
const ATTESA = 4000;
// review 3/11: all'installazione si salvano subito i file della pagina, così anche la prima apertura senza rete funziona
const PRECACHE = ['./', 'd3.min.js', 'f1.js', 'manifest.json', 'icona-180.png'];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  const prendi = (k, rel) => {
    const req = new Request(new URL(rel, self.registration.scope).href, { cache: 'reload' });
    return fetch(req).then(async (r) => {
      if (!r.ok || r.type !== 'basic') return;
      await k.put(chiave(req), r.clone());
      if (rel === './') { // la pagina chiama f1.js con ?v=…: si salva anche quello
        const m = /f1\.js\?v=\w+/.exec(await r.text());
        if (m) await prendi(k, m[0]);
      }
    }).catch(() => {});
  };
  e.waitUntil(caches.open(CACHE).then((k) => Promise.all(PRECACHE.map((p) => prendi(k, p)))));
});
self.addEventListener('activate', (e) => e.waitUntil(caches.keys()
  .then((k) => Promise.all(k.filter((x) => x.startsWith('lma-offline-') && x !== CACHE).map((x) => caches.delete(x))))
  .then(() => self.clients.claim())));

// review 3/11: si toglie solo "?t=…" (l'ora della richiesta); "?v=…" resta, così f1.js vecchio non torna con la pagina nuova
const chiave = (req) => { const u = new URL(req.url); u.searchParams.delete('t'); u.hash = ''; return u.href; };
// la pagina capisce dall'intestazione che sta usando la copia salvata
const copia = (req) => caches.open(CACHE).then((k) => k.match(chiave(req))).then((r) => {
  if (!r) return null;
  const h = new Headers(r.headers); h.set('X-LMA-Offline', '1');
  return r.blob().then((b) => new Response(b, { status: r.status, statusText: r.statusText, headers: h }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // review v35: la pagina si chiede sempre al server (no-cache), così il tasto Aggiorna prende l'ultima versione dell'app
  let salvato = Promise.resolve();
  const rete = fetch(req.mode === 'navigate' ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : req).then((r) => {
    if (r.ok && r.type === 'basic') { const c = r.clone(); salvato = caches.open(CACHE).then((k) => k.put(chiave(req), c)).catch(() => {}); }
    return r;
  });
  e.waitUntil(rete.then(() => salvato, () => {})); // la copia nuova si salva (e il worker resta vivo) anche se intanto si è usata quella vecchia
  e.respondWith((async () => {
    try {
      const r = await Promise.race([rete, new Promise((ok) => setTimeout(ok, ATTESA, null))]);
      // review 3/11: se GitHub risponde con un errore (503, 404) si usa la copia salvata, se c'è
      if (r) return r.ok ? r : ((await copia(req)) || r);
      // rete lenta: la copia salvata, se c'è; altrimenti si aspetta la rete
      return (await copia(req)) || (await rete);
    } catch (err) {
      return (await copia(req)) || Response.error();
    }
  })());
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
    // review 3/11: solo le finestre di questa app (le altre app su higghy01.github.io non si toccano)
    for (const c of cs) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
