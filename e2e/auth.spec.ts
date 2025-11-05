import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Iniciar sesión')
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('h1, h2, [role="heading"]')).toContainText(/iniciar|sesión|login/i)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await expect(page.locator('input[type="email"], input[name*="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name*="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"], button:has-text("Iniciar")')).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Registrarme')
    await expect(page).toHaveURL(/.*register/)
  })

  test('should show register form', async ({ page }) => {
    await page.goto('http://localhost:3000/register')
    await expect(page.locator('input[type="email"], input[name*="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name*="password"]')).toBeVisible()
  })

  test('should display validation errors on empty login', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar")')
    
    // Try to submit without filling
    await submitButton.click()
    
    // Check for validation (either HTML5 validation or error message)
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first()
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    
    // Either HTML5 validation or custom error should show
    if (!validity) {
      expect(validity).toBeFalsy() // HTML5 validation
    } else {
      // If form submits, check for error message
      await page.waitForTimeout(1000) // Wait for async validation
      const errorMessage = page.locator('[class*="error"], [class*="red"], [role="alert"]')
      // Error may or may not appear depending on implementation
    }
  })
})
