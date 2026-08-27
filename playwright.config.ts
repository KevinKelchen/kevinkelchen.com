import { defineConfig, devices } from '@playwright/test';

const selectedProject = process.env.PLAYWRIGHT_PROJECT;
const devWebServer = {
  command:
    'PLAYWRIGHT_TEST=1 ASTRO_DEV_BACKGROUND=0 astro dev --ignore-lock --host 127.0.0.1 --port 4322',
  url: 'http://127.0.0.1:4322',
  reuseExistingServer: false,
};
const offlineWebServer = {
  command:
    'ASTRO_PREVIEW_BACKGROUND=0 astro preview --host 127.0.0.1 --port 4323',
  url: 'http://127.0.0.1:4323',
  reuseExistingServer: false,
  timeout: 120_000,
};
const webServers =
  selectedProject === 'dev'
    ? [devWebServer]
    : selectedProject
      ? [offlineWebServer]
      : [devWebServer, offlineWebServer];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  // Keep the snapshot names from before the config grew named projects.
  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-snapshotSuffix}{ext}',
  use: {
    colorScheme: 'light',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'dev',
      testIgnore: '**/offline.spec.ts',
      use: { baseURL: 'http://127.0.0.1:4322' },
    },
    {
      // The service worker ships to the static build; the dev server's
      // behavior (unhashed assets, no trailing-slash redirects) doesn't
      // match it, so the offline suite runs against build + preview.
      name: 'offline-build',
      testMatch: '**/offline.spec.ts',
      use: { baseURL: 'http://127.0.0.1:4323' },
    },
  ],
  webServer: webServers,
});
