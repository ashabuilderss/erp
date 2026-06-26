// Asha Builders - Service Worker
// Version: 1.0.0
const CACHE_NAME = "asha-builders-v1";

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/favicon.ico",
];

// Install event: pre-cache critical assets and take control immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

// Activate event: clean up old cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// Fetch event: apply caching strategies based on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API calls (/api/): network-first strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets (scripts, styles, fonts, images): cache-first strategy
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image" ||
    /\.(js|css|woff2?|png|svg|ico|jpg|jpeg|webp|avif)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Navigation requests: network-first (falls back to cached HTML)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Everything else: network only
  event.respondWith(fetch(request));
});

/**
 * Cache-first strategy:
 * 1. Return cached response if available
 * 2. Otherwise fetch from network, cache for next time
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Clone response because it can only be consumed once
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Network-first strategy:
 * 1. Try fetching from network
 * 2. If successful, update cache and return
 * 3. If network fails, return cached version (if available)
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}
