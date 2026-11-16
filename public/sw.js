/* Local Connect service worker (hand-written, no dependencies).
   Bump VERSION to invalidate every cache on the next deploy. */
const VERSION = 'v1';
const STATIC_CACHE = `lc-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('lc-') && k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableAsset(url, request) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (request.destination === 'image') return true;
  return PRECACHE.includes(url.pathname);
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Never touch cross-origin requests (Supabase, map tiles, fonts) or API routes.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (isCacheableAsset(url, request)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
