import { expect, test } from '@playwright/test';

test('the development server removes the production offline worker and caches', async ({
  page,
}) => {
  // Seed production state from a page that does not run the development
  // cleanup script, then visit the app to trigger that cleanup.
  await page.goto('/offline.html');

  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/offline-sw.js', {
      scope: '/',
      type: 'module',
    });
    await navigator.serviceWorker.ready;

    const cache = await caches.open('kevinkelchen-offline-reading-stale-test');
    await cache.put('/stale-offline-test', new Response('stale'));
  });

  await page.goto('/');

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const cacheNames = await caches.keys();

        const offlineRegistrations = registrations.filter((registration) =>
          [
            registration.installing,
            registration.waiting,
            registration.active,
          ].some((worker) => worker?.scriptURL.endsWith('/offline-sw.js')),
        ).length;
        const offlineCaches = cacheNames.filter((name) =>
          name.startsWith('kevinkelchen-offline-reading-'),
        ).length;

        return { offlineRegistrations, offlineCaches };
      }),
    )
    .toEqual({ offlineRegistrations: 0, offlineCaches: 0 });
});
