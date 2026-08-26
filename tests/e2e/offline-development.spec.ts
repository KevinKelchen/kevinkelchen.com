import { expect, test } from '@playwright/test';

test('the development server removes the production offline worker and caches', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/offline-sw.js', { scope: '/', type: 'module' });
    await navigator.serviceWorker.ready;

    const cache = await caches.open('kevinkelchen-offline-reading-stale-test');
    await cache.put('/stale-offline-test', new Response('stale'));
  });

  await page.reload();

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const cacheNames = await caches.keys();

        const offlineRegistrations = registrations.filter((registration) =>
          [registration.installing, registration.waiting, registration.active].some((worker) =>
            worker?.scriptURL.endsWith('/offline-sw.js'),
          ),
        ).length;
        const offlineCaches = cacheNames.filter((name) =>
          name.startsWith('kevinkelchen-offline-reading-'),
        ).length;

        return { offlineRegistrations, offlineCaches };
      }),
    )
    .toEqual({ offlineRegistrations: 0, offlineCaches: 0 });
});
