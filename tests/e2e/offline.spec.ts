import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await expect
    .poll(
      () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      {
        timeout: 10_000,
      },
    )
    .toBe(true);
}

async function waitForCachedUrls(page: Page, paths: string[]) {
  await waitForServiceWorker(page);

  await expect
    .poll(
      () =>
        page.evaluate(async (candidatePaths) => {
          const cached = await Promise.all(
            candidatePaths.map(async (path) => {
              const url = new URL(path, window.location.origin);

              if (await caches.match(url.href, { ignoreVary: true })) {
                return true;
              }

              // Static hosting canonicalizes pages to a trailing slash, so the
              // page may be cached under either spelling.
              if (!url.pathname.endsWith('/')) {
                url.pathname = `${url.pathname}/`;
                return Boolean(
                  await caches.match(url.href, { ignoreVary: true }),
                );
              }

              return false;
            }),
          );

          return cached.every(Boolean);
        }, paths),
      { timeout: 10_000 },
    )
    .toBe(true);
}

async function makeCacheWritesFail(context: BrowserContext) {
  const worker = context
    .serviceWorkers()
    .find((candidate) => candidate.url().endsWith('/offline-sw.js'));

  expect(worker).toBeDefined();

  await worker!.evaluate(() => {
    const originalOpen = caches.open.bind(caches);

    caches.open = async (...args) => {
      const cache = await originalOpen(...args);

      return new Proxy(cache, {
        get(target, property, receiver) {
          if (property === 'put') {
            return async () => {
              throw new Error('Forced cache write failure');
            };
          }

          const value = Reflect.get(target, property, receiver);

          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };
  });
}

async function sendCacheUrlsMessage(page: Page, paths: string[]) {
  return page.evaluate(async (candidatePaths) => {
    await navigator.serviceWorker.ready;

    const worker = navigator.serviceWorker.controller;

    if (!worker) {
      throw new Error('Expected an active service worker controller.');
    }

    const urls = candidatePaths.map(
      (path) => new URL(path, window.location.origin).href,
    );

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => {
        channel.port1.close();
        reject(new Error('Timed out waiting for cache message response.'));
      }, 5_000);

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        resolve(event.data);
      };

      worker.postMessage({ type: 'CACHE_URLS', urls }, [channel.port2]);
    });
  }, paths);
}

// Draft Posts are excluded from the production build this suite runs against,
// so a built content page stands in for a visited Post until one is published.
test('visited pages and same-origin assets remain available offline', async ({
  context,
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/about');
  await waitForCachedUrls(page, ['/about', '/favicon.svg']);

  await context.setOffline(true);

  await expect(
    await page.evaluate(() =>
      fetch('/favicon.svg').then((response) => response.ok),
    ),
  ).toBe(true);

  const response = await page.reload();

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(page.getByText('The best way to reach me is on')).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('fresh network navigations win when cache writes fail', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await waitForCachedUrls(page, ['/', '/offline.html']);
  await makeCacheWritesFail(context);

  const response = await page.goto(`/about?cache-write-failure=${Date.now()}`);

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(page.locator('[data-offline-fallback]')).toHaveCount(0);
});

test('a successful navigation replaces its stale offline copy before load completes', async ({
  context,
  page,
}) => {
  await page.goto('/about');
  await waitForCachedUrls(page, ['/about']);

  const worker = context
    .serviceWorkers()
    .find((candidate) => candidate.url().includes('/offline-sw.js'));

  expect(worker).toBeDefined();

  await worker!.evaluate(() => {
    const originalFetch = self.fetch.bind(self);
    const originalOpen = caches.open.bind(caches);

    self.__serveUpdatedDeployment = true;
    self.fetch = async (...args) => {
      const request =
        args[0] instanceof Request ? args[0] : new Request(args[0], args[1]);

      if (
        self.__serveUpdatedDeployment &&
        new URL(request.url).pathname === '/about'
      ) {
        return new Response(
          '<!doctype html><title>Updated</title><h1>Updated deployment</h1>',
          {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          },
        );
      }

      return originalFetch(...args);
    };

    caches.open = async (...args) => {
      const cache = await originalOpen(...args);

      return new Proxy(cache, {
        get(target, property, receiver) {
          if (property === 'put') {
            return async (request: RequestInfo, response: Response) => {
              const url = new URL(
                request instanceof Request ? request.url : request,
                self.location.origin,
              );

              if (url.pathname === '/about') {
                await new Promise((resolve) => setTimeout(resolve, 3_000));
              }

              return target.put(request, response);
            };
          }

          const value = Reflect.get(target, property, receiver);

          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };
  });

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Updated deployment' }),
  ).toBeVisible();

  await worker!.evaluate(() => {
    self.__serveUpdatedDeployment = false;
  });
  await context.setOffline(true);
  const response = await page.reload();

  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole('heading', { name: 'Updated deployment' }),
  ).toBeVisible();
});

test('a replacement service worker recaches the page that is already open', async ({
  page,
}) => {
  await page.goto('/about');
  await waitForCachedUrls(page, ['/about']);

  await page.evaluate(async () => {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter((cacheName) =>
          cacheName.startsWith('kevinkelchen-offline-reading-'),
        )
        .map((cacheName) => caches.delete(cacheName)),
    );

    // A newly activated worker claims the existing page and emits this event.
    navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
  });

  await waitForCachedUrls(page, ['/about']);
});

test('cache messages skip URLs already saved for offline reading', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await waitForCachedUrls(page, ['/']);

  const worker = context
    .serviceWorkers()
    .find((candidate) => candidate.url().endsWith('/offline-sw.js'));

  expect(worker).toBeDefined();

  await worker!.evaluate(() => {
    const originalFetch = self.fetch.bind(self);

    self.fetch = async (...args) => {
      const request =
        args[0] instanceof Request ? args[0] : new Request(args[0], args[1]);
      const url = new URL(request.url);

      if (url.pathname === '/') {
        self.__cacheMessageHomeFetchCount =
          (self.__cacheMessageHomeFetchCount || 0) + 1;
      }

      return originalFetch(...args);
    };
  });

  await expect(sendCacheUrlsMessage(page, ['/'])).resolves.toMatchObject({
    cachedCount: 0,
  });

  await expect
    .poll(() => worker!.evaluate(() => self.__cacheMessageHomeFetchCount || 0))
    .toBe(0);
});

test('uncached navigations show the offline fallback', async ({
  context,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await waitForCachedUrls(page, ['/', '/offline.html']);
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));

  await context.setOffline(true);
  const response = await page.goto('/offline-test-missing-page');

  expect(response?.ok()).toBe(true);
  await expect(page.locator('[data-offline-fallback]')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "You're offline" }),
  ).toBeVisible();
  await expect(page.locator('body > header')).toBeVisible();
  await expect(page.locator('body > header > nav a')).toHaveText([
    'Blog',
    'About',
  ]);
  await expect(page.locator('body > footer')).toBeVisible();
  await expect(page.locator('body > footer > nav a')).toHaveText([
    'X',
    'LinkedIn',
    'GitHub',
    'RSS',
  ]);
  await expect(page.getByRole('link', { name: 'Archive' })).toHaveCount(0);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  await expect(page).toHaveURL(/\/offline-test-missing-page$/);
});

test('uncached navigations still show a fallback when the runtime cache is missing', async ({
  context,
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/about');
  await waitForCachedUrls(page, ['/about', '/offline.html']);
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));

  await page.evaluate(async () => {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter((cacheName) =>
          cacheName.startsWith('kevinkelchen-offline-reading-'),
        )
        .map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          await cache.delete('/offline.html');
        }),
    );
  });

  await context.setOffline(true);
  const response = await page.goto('/blog');

  expect(response?.ok()).toBe(true);
  await expect(page.locator('[data-offline-fallback]')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "You're offline" }),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('an uncached favicon request stays quiet offline', async ({
  context,
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await waitForCachedUrls(page, ['/', '/offline.html']);
  await context.setOffline(true);

  const result = await page.evaluate(() =>
    fetch('/favicon.ico?offline-cache-miss', { cache: 'reload' }).then(
      (response) => ({ status: response.status }),
      (error) => ({
        error: error instanceof Error ? error.message : String(error),
      }),
    ),
  );

  expect(result).toEqual({ status: 204 });
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
