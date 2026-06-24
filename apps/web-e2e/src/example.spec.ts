import { test, expect } from '@playwright/test';

test('web app loads and shows the heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'synca whiteboard' })).toBeVisible();
});
