import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'archive', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'post', path: '/blog/hello-world' },
  { name: 'offline', path: '/offline.html' },
] as const;

test('uses the system color scheme until the visitor chooses a theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
});

test('toggles and persists the chosen theme across navigation', async ({
  page,
}) => {
  await page.goto('/');

  const toggle = page.locator('#theme-toggle');
  await expect(toggle).toHaveAccessibleName('Switch to dark mode');
  await toggle.click();

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(toggle).toHaveAccessibleName('Switch to light mode');
  await expect.poll(() => page.evaluate(() => localStorage.theme)).toBe('dark');

  await page.goto('/about');

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(
    page.getByRole('button', { name: 'Switch to light mode' }),
  ).toBeVisible();
});

test('theme toggle has a 44px touch target at the minimum width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const size = await page.locator('#theme-toggle').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
});

test('theme toggle is keyboard operable with a visible focus indicator', async ({
  page,
}) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const toggle = page.locator('#theme-toggle');
  await expect(toggle).toBeFocused();
  expect(
    await toggle.evaluate((element) => getComputedStyle(element).outlineWidth),
  ).not.toBe('0px');

  await page.keyboard.press('Enter');
  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
});

for (const sitePage of pages) {
  test(`${sitePage.path} has no detectable accessibility violations in dark mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(sitePage.path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  for (const width of [320, 1280] as const) {
    test(`${sitePage.name} dark mode renders at ${width}px`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.setViewportSize({ width, height: 800 });
      await page.goto(sitePage.path);

      await page.locator('footer > p').evaluate((element) => {
        element.textContent = '© 2000 Kevin Kelchen';
      });
      await expect(page).toHaveScreenshot(
        `${sitePage.name}-dark-${width}.png`,
        {
          animations: 'disabled',
          fullPage: true,
        },
      );
    });
  }
}
