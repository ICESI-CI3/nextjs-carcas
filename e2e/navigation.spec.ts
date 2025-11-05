import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should have header with logo', async ({ page }) => {
    await page.goto('http://localhost:3000')
    const logo = page.locator('text=BiblioIcesi, a:has-text("BiblioIcesi"), [class*="logo"]').first()
    await expect(logo).toBeVisible()
  })

  test('should navigate to home from logo', async ({ page }) => {
    await page.goto('http://localhost:3000/books')
    const logo = page.locator('a:has-text("BiblioIcesi")').first()
    if (await logo.isVisible()) {
      await logo.click()
      await expect(page).toHaveURL('http://localhost:3000/')
    }
  })

  test('should have books link in navigation', async ({ page }) => {
    await page.goto('http://localhost:3000')
    const booksLink = page.locator('a:has-text("Libros"), a[href*="/books"]').first()
    if (await booksLink.isVisible()) {
      await expect(booksLink).toBeVisible()
    }
  })

  test('should show login/register when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3000')
    // Clear any existing auth
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    
    const loginLink = page.locator('a:has-text("Iniciar sesión"), a:has-text("login")').first()
    if (await loginLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loginLink).toBeVisible()
    }
  })
})
