(() => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const SERVICE_WORKER_URL = '/offline-sw.js';
  const CACHE_PREFIX = 'kevinkelchen-offline-reading-';
  const CACHE_MESSAGE_TYPE = 'CACHE_URLS';
  const offlineReadingEnabled =
    document.currentScript?.dataset.offlineReading === 'enabled';

  const removeOfflineReading = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations
        .filter((registration) =>
          [registration.installing, registration.waiting, registration.active].some(
            (worker) => worker && new URL(worker.scriptURL).pathname === SERVICE_WORKER_URL,
          ),
        )
        .map((registration) => registration.unregister()),
    );

    if ('caches' in window) {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
          .map((cacheName) => caches.delete(cacheName)),
      );
    }
  };

  if (!offlineReadingEnabled) {
    const cleanup = () => {
      removeOfflineReading().catch(() => {
        // Development cleanup is best-effort and must not disrupt the page.
      });
    };

    if (document.readyState === 'complete') {
      cleanup();
    } else {
      window.addEventListener('load', cleanup, { once: true });
    }

    return;
  }

  const addSameOriginUrl = (urls, value) => {
    try {
      const url = new URL(value, window.location.href);
      url.hash = '';

      if (url.origin === window.location.origin) {
        urls.add(url.href);
      }
    } catch (error) {
      // Ignore malformed URLs from browser-provided resource metadata.
    }
  };

  const addSrcsetUrls = (urls, value) => {
    value.split(',').forEach((candidate) => {
      const url = candidate.trim().split(/\s+/)[0];

      if (url) {
        addSameOriginUrl(urls, url);
      }
    });
  };

  const collectCurrentPageUrls = () => {
    const urls = new Set();

    addSameOriginUrl(urls, window.location.href);

    if (typeof performance.getEntriesByType === 'function') {
      performance.getEntriesByType('resource').forEach((entry) => {
        addSameOriginUrl(urls, entry.name);
      });
    }

    document
      .querySelectorAll(
        'link[rel~="stylesheet"], link[rel~="icon"], link[rel="modulepreload"], script[src], img[src], source[src], video[src], audio[src]',
      )
      .forEach((element) => {
        addSameOriginUrl(urls, element.href || element.src);
      });

    document.querySelectorAll('img[srcset], source[srcset]').forEach((element) => {
      addSrcsetUrls(urls, element.getAttribute('srcset') || '');
    });

    return Array.from(urls);
  };

  const cacheCurrentPage = (worker) => {
    if (!worker) {
      return;
    }

    worker.postMessage({
      type: CACHE_MESSAGE_TYPE,
      urls: collectCurrentPageUrls(),
    });
  };

  // An updated worker can replace the controller after this page has loaded.
  // Re-send the current resources because activation removes the prior
  // worker's cache.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    cacheCurrentPage(navigator.serviceWorker.controller);
  });

  const registerOfflineReading = async () => {
    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: '/',
        type: 'module',
      });
      await navigator.serviceWorker.ready;

      const worker = registration.active || navigator.serviceWorker.controller;
      cacheCurrentPage(worker);
    } catch (error) {
      // Offline reading is progressive enhancement; registration failures should stay silent.
    }
  };

  if (document.readyState === 'complete') {
    registerOfflineReading();
  } else {
    window.addEventListener('load', registerOfflineReading, { once: true });
  }
})();
