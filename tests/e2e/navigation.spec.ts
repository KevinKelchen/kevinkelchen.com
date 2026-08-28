import { expect, test } from '@playwright/test';

test('internal navigation keeps the shared header while the next page loads', async ({
  page,
}) => {
  await page.goto('/about');

  let resolveTargetRequest!: () => void;
  let releaseTargetResponse!: () => void;
  const targetRequestStarted = new Promise<void>((resolve) => {
    resolveTargetRequest = resolve;
  });
  const targetResponseReleased = new Promise<void>((resolve) => {
    releaseTargetResponse = resolve;
  });

  await page.route('**/blog', async (route) => {
    resolveTargetRequest();
    const response = await route.fetch();
    await targetResponseReleased;
    await route.fulfill({ response });
  });

  const click = page.getByRole('link', { name: 'Blog' }).click();
  await targetRequestStarted;

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('body > header')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();

  releaseTargetResponse();
  await click;
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
});

test('internal navigation preserves the selected dark theme', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/about');

  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  await page.getByRole('link', { name: 'Blog' }).click();

  await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => element.classList.contains('dark')),
    )
    .toBe(true);
  const backgroundColor = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
});

test('the theme toggle keeps working after internal navigation', async ({
  page,
}) => {
  await page.goto('/about');
  await page.getByRole('link', { name: 'Blog' }).click();

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
});
