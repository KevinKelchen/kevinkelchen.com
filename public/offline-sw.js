import { OFFLINE_FALLBACK_HTML } from '/offline-fallback.js';

// Bump CACHE_NAME whenever this worker's logic or the /offline.html fallback
// changes: activation deletes superseded caches, and the version change is what
// pushes a fresh fallback to long-idle installs at their next update check.
const CACHE_NAME = 'kevinkelchen-offline-reading-v7';
const CACHE_PREFIX = 'kevinkelchen-offline-reading-';
const OFFLINE_FALLBACK_URL = '/offline.html';
const CACHEABLE_DESTINATIONS = new Set([
  'document',
  'style',
  'script',
  'image',
  'font',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.add(new Request(OFFLINE_FALLBACK_URL, { cache: 'reload' })),
      ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  cacheName.startsWith(CACHE_PREFIX) &&
                  cacheName !== CACHE_NAME,
              )
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CACHE_URLS') {
    return;
  }

  const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
  const replyPort = event.ports[0];

  event.waitUntil(
    cacheUrls(urls)
      .then((cachedCount) => {
        if (replyPort) {
          replyPort.postMessage({ type: 'CACHE_URLS_COMPLETE', cachedCount });
        }
      })
      .catch((error) => {
        if (replyPort) {
          replyPort.postMessage({
            type: 'CACHE_URLS_COMPLETE',
            cachedCount: 0,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
  );
});

self.addEventListener('fetch', (event) => {
  if (!shouldHandleRequest(event.request)) {
    return;
  }

  event.respondWith(networkFirst(event.request, event));
});

function shouldHandleRequest(request) {
  if (request.method !== 'GET' || request.headers.has('range')) {
    return false;
  }

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname === '/offline-sw.js'
  ) {
    return false;
  }

  if (
    request.mode === 'navigate' ||
    CACHEABLE_DESTINATIONS.has(request.destination)
  ) {
    return true;
  }

  return (
    url.pathname.startsWith('/_astro/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/favicon.ico'
  );
}

async function networkFirst(request, event) {
  try {
    return await fetchAndCache(request, event);
  } catch (error) {
    const cachedResponse = await matchCached(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const fallbackResponse = await caches.match(OFFLINE_FALLBACK_URL, {
        ignoreVary: true,
      });

      if (fallbackResponse) {
        return fallbackResponse;
      }

      return new Response(OFFLINE_FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Browsers may request a favicon for the self-contained fallback even
    // when no cached icon is available. It is optional UI, so keep the miss
    // from becoming an uncaught fetch-event error in DevTools.
    if (isFaviconRequest(request)) {
      return new Response(null, { status: 204 });
    }

    throw error;
  }
}

function isFaviconRequest(request) {
  const pathname = new URL(request.url).pathname;

  return pathname === '/favicon.ico' || pathname === '/favicon.svg';
}

async function fetchAndCache(request, event) {
  const response = await fetch(request);

  if (isCacheableResponse(response)) {
    if (request.mode === 'navigate') {
      // Once an updated page finishes loading, an immediate offline reload
      // must not be able to fall back to the previous deployment's document.
      await cacheResponse(request, response.clone());
      event.waitUntil(refreshOfflineFallback());
    } else {
      event.waitUntil(cacheResponse(request, response.clone()));
    }
  }

  return response;
}

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(normalizeRequest(request), await stripRedirect(response));
  } catch {
    // A full or unavailable cache should never make fresh network responses look offline.
  }
}

// /offline.html is only precached at install, so an edit to it would otherwise
// never reach existing users until this file also changes. Revalidate it once
// per worker startup, piggybacked on a successful navigation.
let fallbackRefreshed = false;

async function refreshOfflineFallback() {
  if (fallbackRefreshed) {
    return;
  }

  fallbackRefreshed = true;

  try {
    const response = await fetch(
      new Request(OFFLINE_FALLBACK_URL, { cache: 'no-cache' }),
    );

    if (isCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(OFFLINE_FALLBACK_URL, await stripRedirect(response));
    } else {
      fallbackRefreshed = false;
    }
  } catch {
    // Keep the installed copy and retry on a later navigation.
    fallbackRefreshed = false;
  }
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  const requests = urls.map(toRequest).filter(Boolean);
  const results = await Promise.allSettled(
    requests.map(async (request) => {
      const cachedResponse = await cache.match(request, { ignoreVary: true });

      if (cachedResponse) {
        return false;
      }

      const response = await fetch(request);

      if (isCacheableResponse(response)) {
        await cache.put(request, await stripRedirect(response));
        return true;
      }

      return false;
    }),
  );

  return results.filter(
    (result) => result.status === 'fulfilled' && result.value,
  ).length;
}

// Static hosts may 301 `/blog/x` to `/blog/x/`, so a page can be cached under
// either spelling; offline navigations try both before giving up.
async function matchCached(request) {
  const cachedResponse = await caches.match(request, { ignoreVary: true });

  if (cachedResponse || request.mode !== 'navigate') {
    return cachedResponse;
  }

  const variant = trailingSlashVariant(request.url);

  return variant ? caches.match(variant, { ignoreVary: true }) : undefined;
}

function trailingSlashVariant(value) {
  const url = new URL(value);
  const pathname = url.pathname;

  if (pathname === '/') {
    return null;
  }

  if (pathname.endsWith('/')) {
    url.pathname = pathname.slice(0, -1);
  } else if (pathname.slice(pathname.lastIndexOf('/') + 1).includes('.')) {
    return null;
  } else {
    url.pathname = `${pathname}/`;
  }

  return url.href;
}

// Chromium refuses to serve a cached `redirected` response to a navigation, so
// cached copies are rebuilt without the redirect flag.
async function stripRedirect(response) {
  if (!response.redirected) {
    return response;
  }

  const body = await response.blob();

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function toSameOriginUrl(value) {
  try {
    const url = new URL(value, self.location.origin);
    url.hash = '';

    if (
      url.origin !== self.location.origin ||
      url.pathname === '/offline-sw.js'
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function toRequest(value) {
  const url = toSameOriginUrl(value);

  return url ? new Request(url.href, { credentials: 'same-origin' }) : null;
}

function normalizeRequest(request) {
  const url = toSameOriginUrl(request.url);

  return url
    ? new Request(url.href, { credentials: request.credentials })
    : request;
}

function isCacheableResponse(response) {
  return (
    response.ok && (response.type === 'basic' || response.type === 'default')
  );
}
