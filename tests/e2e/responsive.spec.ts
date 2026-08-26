import { expect, test } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'archive', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'post', path: '/blog/hello-world' },
] as const;

const viewportWidths = [320, 375, 768, 1280] as const;

test('footer stacks its content at the 320px minimum width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const copyright = await page.locator('footer > p').boundingBox();
  const links = await page.locator('footer > nav').boundingBox();

  expect(copyright).not.toBeNull();
  expect(links).not.toBeNull();
  expect(links!.y).toBeGreaterThanOrEqual(copyright!.y + copyright!.height + 16);
});

test('footer links open in a new tab', async ({ page }) => {
  await page.goto('/');

  const links = page.locator('body > footer > nav a');

  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
});

test('site navigation remains touch-friendly at the 320px minimum width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const links = page.locator('body > header > a, body > header > nav a, body > footer > nav a');

  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

for (const sitePage of pages) {
  for (const width of viewportWidths) {
    test(`${sitePage.name} remains responsive at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const response = await page.goto(sitePage.path);

      expect(response?.ok()).toBe(true);
      await expect(page.locator('body > header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body > footer')).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

      await page.locator('footer > p').evaluate((element) => {
        element.textContent = '© 2000 Kevin Kelchen';
      });
      await expect(page).toHaveScreenshot(`${sitePage.name}-${width}.png`, {
        animations: 'disabled',
        fullPage: true,
      });
    });
  }
}
