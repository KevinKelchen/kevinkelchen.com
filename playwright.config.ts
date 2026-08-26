import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
    colorScheme: 'light',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'PLAYWRIGHT_TEST=1 ASTRO_DEV_BACKGROUND=0 astro dev --ignore-lock --host 127.0.0.1 --port 4322',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
  },
});
