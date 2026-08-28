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
