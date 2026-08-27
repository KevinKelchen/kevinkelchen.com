import { expect, test } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'archive', path: '/blog' },
  { name: 'about', path: '/about' },
  { name: 'post', path: '/blog/hello-world' },
] as const;

const viewportWidths = [320, 375, 768, 1280] as const;

test('footer stacks social links above the copyright at the 320px minimum width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const copyright = await page.locator('footer > p').boundingBox();
  const links = await page.locator('footer > nav').boundingBox();

  expect(copyright).not.toBeNull();
  expect(links).not.toBeNull();
  expect(copyright!.y).toBeGreaterThanOrEqual(links!.y + links!.height + 16);
});

test('header nav lists Blog then About', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body > header > nav a')).toHaveText(['Blog', 'About']);
});

test('footer links open in a new tab', async ({ page }) => {
  await page.goto('/');

  const links = page.locator('body > footer > nav a');

  await expect(links).toHaveText(['X', 'LinkedIn', 'GitHub', 'RSS']);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
});

test('footer link labels are evenly spaced', async ({ page }) => {
  await page.goto('/');

  const gaps = await page.locator('body > footer > nav a').evaluateAll((links) =>
    links.slice(1).map((link, index) => {
      const previous = document.createRange();
      previous.selectNodeContents(links[index]!);
      const current = document.createRange();
      current.selectNodeContents(link);
      return current.getBoundingClientRect().x - previous.getBoundingClientRect().right;
    }),
  );

  expect(gaps.length).toBeGreaterThan(1);
  for (const gap of gaps) {
    expect(gap).toBeCloseTo(gaps[0]!, 0);
  }
});

test('site navigation remains touch-friendly at the 320px minimum width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const links = page.locator('body > header > a, body > header > nav a, body > footer > nav a');

  for (const link of await links.all()) {
    const size = await link.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const before = getComputedStyle(element, '::before');
      const hasHitArea = before.content !== 'none' && before.content !== '';
      const beforeWidth = hasHitArea ? Number.parseFloat(before.width) : 0;
      const beforeHeight = hasHitArea ? Number.parseFloat(before.height) : 0;
      return {
        width: Math.max(rect.width, beforeWidth),
        height: Math.max(rect.height, beforeHeight),
      };
    });

    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
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
