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
    page.getByRole('button', { name: 'Theme: System' }),
  ).toBeVisible();
});

test('selecting a theme persists it across navigation', async ({ page }) => {
  await page.goto('/');

  const button = page.locator('#theme-menu-button');
  await expect(button).toHaveAccessibleName('Theme: System');
  await button.click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(button).toHaveAccessibleName('Theme: Dark');
  await expect.poll(() => page.evaluate(() => localStorage.theme)).toBe('dark');

  await page.goto('/about');

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(page.getByRole('button', { name: 'Theme: Dark' })).toBeVisible();
});

for (const path of ['/', '/offline.html']) {
  test(`${path} button icon and menu checkmark follow every selected option`, async ({
    page,
  }) => {
    await page.goto(path);

    const button = page.locator('#theme-menu-button');
    const options = ['light', 'dark', 'system'] as const;
    const labels = { system: 'System', light: 'Light', dark: 'Dark' };

    for (const option of options) {
      await button.click();
      await page.getByRole('menuitemradio', { name: labels[option] }).click();

      for (const other of options) {
        const icon = button.locator(`[data-theme-icon="${other}"]`);
        if (other === option) {
          await expect(icon).toBeVisible();
        } else {
          await expect(icon).toBeHidden();
        }
      }

      await button.click();
      for (const other of options) {
        const item = page.getByRole('menuitemradio', { name: labels[other] });
        await expect(item).toHaveAttribute(
          'aria-checked',
          String(other === option),
        );
        const check = item.locator('[data-theme-check]');
        if (other === option) {
          await expect(check).toBeVisible();
        } else {
          await expect(check).toBeHidden();
        }
      }
      await page.keyboard.press('Escape');
    }

    await expect(
      button.locator('[data-theme-icon="light"] circle'),
    ).toHaveCount(1);
    await expect(button.locator('[data-theme-icon="dark"] circle')).toHaveCount(
      0,
    );
  });
}

test('theme menu button has a 44px touch target at the minimum width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  const size = await page.locator('#theme-menu-button').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
});

test('theme menu is keyboard operable with a visible focus indicator', async ({
  page,
}) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  const button = page.locator('#theme-menu-button');
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((element) => getComputedStyle(element).outlineWidth),
  ).not.toBe('0px');

  await page.keyboard.press('Enter');
  await expect(page.locator('#theme-menu')).toBeVisible();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await expect(button).toHaveAccessibleName('Theme: Dark');
});

test('focused menu items have a visible outline and a 44px target', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.locator('#theme-menu-button').focus();
  await page.keyboard.press('Enter');

  const item = page.getByRole('menuitemradio', { name: 'System' });
  await expect(item).toBeFocused();
  const style = await item.evaluate((element) => {
    const { outlineWidth, outlineStyle } = getComputedStyle(element);
    return {
      outlineWidth,
      outlineStyle,
      height: element.getBoundingClientRect().height,
    };
  });
  expect(style.outlineStyle).not.toBe('none');
  expect(style.outlineWidth).not.toBe('0px');
  expect(style.height).toBeGreaterThanOrEqual(44);

  const menuBox = await page.locator('#theme-menu').boundingBox();
  expect(menuBox!.x).toBeGreaterThanOrEqual(0);
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(320);
});

test('the theme menu follows the menu button keyboard pattern', async ({
  page,
}) => {
  await page.goto('/');
  const button = page.locator('#theme-menu-button');
  const menu = page.locator('#theme-menu');

  await button.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menuitemradio', { name: 'System' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu).toBeHidden();

  await button.click();
  await expect(menu).toBeVisible();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(menu).toBeHidden();
});

test('an unrecognized saved theme falls back to System', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'sepia'));
  await page.goto('/');

  await expect(page.locator('#theme-menu-button')).toHaveAccessibleName(
    'Theme: System',
  );
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
});

test('System follows live changes to the operating system theme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const isDark = () =>
    page
      .locator('html')
      .evaluate((element) => element.classList.contains('dark'));
  await expect.poll(isDark).toBe(false);

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(isDark).toBe(true);

  await page.locator('#theme-menu-button').click();
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(isDark).toBe(false);
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
