import { expect, test } from '@playwright/test';

test('the header is parsed while the theme initializer is loading', async ({
  page,
}) => {
  let releaseThemeInit!: () => void;
  let resolveThemeInitRequested!: () => void;
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
    resolveThemeInitRequested();
    try {
      const response = await route.fetch();
      await themeInitReleased;
      await route.fulfill({ response });
    } finally {
      resolveThemeInitHandled();
    }
  });

  const navigation = page.goto('/', { waitUntil: 'commit' });
  await themeInitRequested;

  try {
    await expect(page.locator('body > header')).toHaveCount(1);
  } finally {
    releaseThemeInit();
    await themeInitHandled;
  }

  await navigation;
  await expect(page.locator('body > header')).toBeVisible();
});
