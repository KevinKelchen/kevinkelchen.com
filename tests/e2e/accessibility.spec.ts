import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'Archive', path: '/blog' },
  { name: 'About', path: '/about' },
  { name: 'Post', path: '/blog/hello-world' },
] as const;

const viewportWidths = [320, 1280] as const;

const wcag22LevelAAndAA = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;

for (const sitePage of pages) {
  for (const width of viewportWidths) {
    test(`${sitePage.name} has no automatically detectable WCAG 2.2 AA violations at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      const response = await page.goto(sitePage.path, {
        waitUntil: 'networkidle',
      });

      expect(response?.ok()).toBe(true);

      const results = await new AxeBuilder({ page })
        .withTags([...wcag22LevelAAndAA])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}

for (const path of ['/', '/offline.html']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} open theme menu has no automatically detectable WCAG 2.2 AA violations in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path, { waitUntil: 'networkidle' });

      await page.locator('#theme-menu-button').click();
      await expect(page.locator('#theme-menu')).toBeVisible();
      await page.getByRole('menuitemradio', { name: 'Light' }).hover();

      const results = await new AxeBuilder({ page })
        .withTags([...wcag22LevelAAndAA])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
