import { expect, test } from '@playwright/test';

test('the saved theme is applied before the header is rendered', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));

  let themeInitIntercepted = false;
  let resolveThemeInitRequested!: () => void;
  let releaseThemeInit!: () => void;
  let resolveThemeInitHandled!: () => void;

  const themeInitReleased = new Promise<void>((resolve) => {
    releaseThemeInit = resolve;
  });
  const themeInitRequested = new Promise<void>((resolve) => {
    resolveThemeInitRequested = resolve;
  });
  const themeInitHandled = new Promise<void>((resolve) => {
    resolveThemeInitHandled = resolve;
  });

  await page.route('**/theme-init.js', async (route) => {
    themeInitIntercepted = true;
    resolveThemeInitRequested();
    try {
      const response = await route.fetch();
      await themeInitReleased;
      await route.fulfill({ response });
    } finally {
      resolveThemeInitHandled();
    }
  });

  await page.goto('/', { waitUntil: 'commit' });
  await Promise.race([themeInitRequested, page.waitForTimeout(200)]);
  try {
    await expect(page.locator('body > header')).toHaveCount(1);
    await expect
      .poll(() =>
        page
          .locator('html')
          .evaluate((element) => element.classList.contains('dark')),
      )
      .toBe(true);
  } finally {
    releaseThemeInit();
    if (themeInitIntercepted) await themeInitHandled;
  }

  await page.waitForLoadState('load');
  await expect(page.locator('body > header')).toBeVisible();
});
