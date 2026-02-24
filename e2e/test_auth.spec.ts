import { test, expect, Page } from '@playwright/test'

// Helper to check console errors
async function checkNoFatalErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    errors.push(err.message)
  })
  return errors
}

test.describe('Health Check', () => {
  test('GET /api/health returns 200 ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeTruthy()
  })
})

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Anmelden')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('submit button is disabled when fields are empty', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeDisabled()
  })

  test('submit button enables when email and password are filled', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).not.toBeDisabled()
  })

  test('has link to register page', async ({ page }) => {
    await expect(page.locator('a[href="/register"]')).toBeVisible()
  })

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[id="password"]')
    const toggleBtn = page.locator('button[aria-label*="Passwort"]')

    await expect(passwordInput).toHaveAttribute('type', 'password')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('shows app branding', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DayFlow')
  })

  test('has Google OAuth button', async ({ page }) => {
    await expect(page.getByText(/Mit Google/)).toBeVisible()
  })

  test('has Passwort vergessen link', async ({ page }) => {
    await expect(page.getByText('Passwort vergessen?')).toBeVisible()
  })

  test('Passwort vergessen link goes to forgot-password page', async ({ page }) => {
    await page.getByText('Passwort vergessen?').click()
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.getByText('Passwort zurücksetzen')).toBeVisible()
  })
})

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password')
  })

  test('renders the reset form', async ({ page }) => {
    await expect(page.getByText('Passwort zurücksetzen')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('submit button is disabled when email is empty', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('submit button enables when email is filled', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
  })

  test('has back to login link', async ({ page }) => {
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })
})

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('renders the registration form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Konto erstellen')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('has optional name field', async ({ page }) => {
    await expect(page.locator('input[id="name"]')).toBeVisible()
  })

  test('submit button is disabled when required fields are empty', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeDisabled()
  })

  test('submit button enables when email and password are filled', async ({ page }) => {
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[type="password"]', 'password123')
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
  })

  test('has link back to login page', async ({ page }) => {
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('shows password minimum length hint', async ({ page }) => {
    await expect(page.getByText(/Mindestens 8 Zeichen/)).toBeVisible()
  })

  test('password toggle works', async ({ page }) => {
    const toggleBtn = page.locator('button[aria-label*="Passwort"]')
    const passwordInput = page.locator('input[id="password"]')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
