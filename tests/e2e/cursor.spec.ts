import { expect, test } from '@playwright/test';

const pages = ['/', '/blog', '/about', '/blog/hello-world'] as const;

for (const path of pages) {
  test(`clickable links on ${path} use the pointer cursor`, async ({ page }) => {
    await page.goto(path);

    const links = page.locator('a[href]');

    expect(await links.count()).toBeGreaterThan(0);

    for (const link of await links.all()) {
      await expect(link).toHaveCSS('cursor', 'pointer');
    }
  });
}
