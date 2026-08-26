// ─────────────────────────────────────────
//  ENLACE · Service Worker
//  Versión: 1.0.0
//  Estrategia: Cache-first para assets,
//              Network-first para datos
// ─────────────────────────────────────────

const CACHE_NAME = 'enlace-v1';
const STATIC_CACHE = 'enlace-static-v1';
const FONT_CACHE   = 'enlace-fonts-v1';

// Archivos que se cachean al instalar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Fuentes de Google (se cachean la primera vez que se usan)
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ── INSTALL: precachear assets estáticos ──
self.addEventListener('install', event => {
  console.log('[SW] Instalando Enlace v1...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('[SW] Assets estáticos cacheados');
        return self.skipWaiting(); // activar inmediatamente
      })
  );
});

// ── ACTIVATE: limpiar caches antiguas ──
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== FONT_CACHE)
          .map(key => {
            console.log('[SW] Eliminando caché antigua:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de recurso ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome y peticiones de otras pestañas
  if (url.protocol === 'chrome-extension:') return;

  // ── Fuentes de Google: Cache-first ──
  if (FONT_ORIGINS.some(origin => url.origin === new URL(origin).origin)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ── Assets estáticos propios: Cache-first ──
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Todo lo demás (APIs externas): Network-first ──
  event.respondWith(networkFirst(request));
});

// ── Estrategia: Cache-first ──
// Sirve desde caché si existe; si no, descarga y guarda
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sin red y sin caché: devolver página offline si existe
    const fallback = await cache.match('/index.html');
    return fallback || new Response('Sin conexión', { status: 503 });
  }
}

// ── Estrategia: Network-first ──
// Intenta red primero; si falla, usa caché
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

// ── Mensaje desde la app: forzar actualización ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
