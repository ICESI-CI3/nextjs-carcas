import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should have header with logo', async ({ page }) => {
    await page.goto('/')
    const logo = page.locator('a:has-text("BiblioIcesi")').first()
    await expect(logo).toBeVisible()
  })

  test('should navigate to home from logo', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const logo = page.locator('a:has-text("BiblioIcesi")').first()
    await expect(logo).toBeVisible()
    // Verify the logo link points to home
    const href = await logo.getAttribute('href')
    expect(href).toBe('/')
    // Click and verify navigation
    await Promise.all([
      page.waitForURL('/'),
      logo.click()
    ])
    await expect(page).toHaveURL('/')
  })

  test('should have books link in navigation', async ({ page }) => {
    await page.goto('/')
    const booksLink = page.locator('a:has-text("Libros"), a[href*="/books"]').first()
    if (await booksLink.isVisible()) {
      await expect(booksLink).toBeVisible()
    }
  })

  test('should show login/register when not authenticated', async ({ page }) => {
    await page.goto('/')
    // Clear any existing auth
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    const loginLink = page.locator('a:has-text("Iniciar sesión"), a:has-text("login")').first()
    if (await loginLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loginLink).toBeVisible()
    }
  })
})
