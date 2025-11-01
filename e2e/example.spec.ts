import { test, expect } from '@playwright/test';

test('home has title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toHaveText(/Biblioteca/);
});
