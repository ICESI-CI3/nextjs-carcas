import { test, expect } from '@playwright/test';

test('home has title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Bienvenido a BiblioIcesi/);
});
