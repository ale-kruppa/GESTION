/* Gestión Técnica: guarda la app en el aparato para que abra sin internet.
   Con internet trae siempre la última versión (si tarda más de 6 s, abre la guardada). */
const CACHE = 'gestion-v1';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const red = fetch(r, { cache: 'no-cache' }).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; });
    red.catch(() => {});
    const guardada = (await c.match(r, { ignoreSearch: true })) || (r.mode === 'navigate' ? await c.match('./index.html') : null);
    if (!guardada) return red;
    return Promise.race([red, new Promise(ok => setTimeout(() => ok(null), 6000))]).then(x => x || guardada).catch(() => guardada);
  })());
});
