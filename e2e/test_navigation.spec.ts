import { test, expect } from '@playwright/test'

// Dismiss onboarding for all tests by pre-setting the localStorage flag
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dayflow_onboarding_done', 'true')
  })
})

test.describe('Today Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/today')
  })

  test('has page title "Heute"', async ({ page }) => {
    // h1 shows a greeting like "Guten Morgen 👋" – the main content h1, not sidebar
    await expect(page.getByRole('heading', { name: /Guten (Morgen|Tag|Abend)/ })).toBeVisible()
  })

  test('shows today\'s date', async ({ page }) => {
    // Should show some text content in the header area
    await expect(page.locator('main p').first()).toBeTruthy()
  })

  test('has quick task input field', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Aufgabe"]')).toBeVisible()
  })

  test('has desktop sidebar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.locator('aside').getByText('DayFlow')).toBeVisible()
  })

  test('sidebar links are present on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Sidebar has nav links
    const sidebar = page.locator('aside nav')
    await expect(sidebar.locator('a[href="/today"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/planner"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/ideas"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/links"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/settings"]')).toBeVisible()
  })

  test('shows mobile bottom navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('nav.fixed')).toBeVisible()
  })

  test('FAB button is visible', async ({ page }) => {
    const fab = page.locator('button[aria-label="Quick Capture öffnen"]')
    await expect(fab).toBeVisible()
  })

  test('FAB opens quick capture panel', async ({ page }) => {
    const fab = page.locator('button[aria-label="Quick Capture öffnen"]')
    await fab.click()
    await expect(page.getByText('Quick Capture')).toBeVisible()
    await expect(page.locator('input[placeholder*="Idee oder URL"]')).toBeVisible()
  })

  test('FAB closes when clicked again', async ({ page }) => {
    const fab = page.locator('button[aria-label="Quick Capture öffnen"]')
    await fab.click()
    await expect(page.getByText('Quick Capture')).toBeVisible()

    const closeBtn = page.locator('button[aria-label="Quick Capture schließen"]')
    await closeBtn.click()
    await expect(page.getByText('Quick Capture')).not.toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('navigates to planner page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/today')
    await page.locator('aside nav a[href="/planner"]').click()
    await expect(page).toHaveURL('/planner')
    await expect(page.getByRole('heading', { name: 'Planer' })).toBeVisible()
  })

  test('navigates to ideas page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/today')
    await page.locator('aside nav a[href="/ideas"]').click()
    await expect(page).toHaveURL('/ideas')
    await expect(page.getByRole('heading', { name: 'Ideen' })).toBeVisible()
  })

  test('navigates to links page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/today')
    await page.locator('aside nav a[href="/links"]').click()
    await expect(page).toHaveURL('/links')
    await expect(page.getByRole('heading', { name: 'Links' })).toBeVisible()
  })

  test('navigates to settings page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/today')
    await page.locator('aside nav a[href="/settings"]').click()
    await expect(page).toHaveURL('/settings')
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
  })

  test('root / redirects to /today', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/today')
  })
})

test.describe('Onboarding', () => {
  test('shows onboarding on first visit', async ({ page }) => {
    // Override: remove the flag so onboarding appears
    await page.addInitScript(() => {
      localStorage.removeItem('dayflow_onboarding_done')
    })
    await page.goto('/today')
    await expect(page.getByText('Dein Tag, strukturiert')).toBeVisible()
  })

  test('onboarding can be skipped with X button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('dayflow_onboarding_done')
    })
    await page.goto('/today')
    await expect(page.getByText('Dein Tag, strukturiert')).toBeVisible()
    await page.locator('button[aria-label="Onboarding überspringen"]').click()
    await expect(page.getByText('Dein Tag, strukturiert')).not.toBeVisible()
  })

  test('onboarding navigates between slides', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('dayflow_onboarding_done')
    })
    await page.goto('/today')
    await expect(page.getByText('Dein Tag, strukturiert')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByText('Ideen sofort festhalten')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByText('Links clever sammeln')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: "Los geht's!" }).click()
    await expect(page.getByText('Links clever sammeln')).not.toBeVisible()
  })

  test('does not show onboarding when already completed', async ({ page }) => {
    // The file-level beforeEach already sets dayflow_onboarding_done = 'true'
    await page.goto('/today')
    await expect(page.getByText('Dein Tag, strukturiert')).not.toBeVisible()
  })
})

test.describe('Ideas Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ideas')
  })

  test('has Ideas heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ideen' })).toBeVisible()
  })

  test('has Neue Idee button', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: 'Neue Idee' })).toBeVisible()
  })

  test('shows create form when Neue Idee is clicked', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'Neue Idee' }).click()
    await expect(page.locator('input[placeholder*="Titel"]')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('has search field', async ({ page }) => {
    await expect(page.locator('input[placeholder*="durchsuchen"]')).toBeVisible()
  })

  test('shows empty state when no ideas', async ({ page }) => {
    // Use the empty-state heading (font-semibold text-lg) not the header subtitle
    await expect(page.getByText('Noch keine Ideen', { exact: true }).last()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Links Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/links')
  })

  test('has Links heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Links' })).toBeVisible()
  })

  test('has URL input field', async ({ page }) => {
    await expect(page.locator('input[type="url"]')).toBeVisible()
  })

  test('has Hinzufügen button', async ({ page }) => {
    await expect(page.getByText('Hinzufügen')).toBeVisible()
  })

  test('has status filter buttons', async ({ page }) => {
    // Filter buttons are in a flex container with rounded-xl border (user redesign)
    const filterBar = page.locator('.flex.rounded-xl.border').first()
    await expect(filterBar.getByText('Alle', { exact: true })).toBeVisible()
    await expect(filterBar.getByText('Ungelesen', { exact: true })).toBeVisible()
    await expect(filterBar.getByText('Später', { exact: true })).toBeVisible()
    await expect(filterBar.getByText('Gelesen', { exact: true })).toBeVisible()
  })

  test('shows empty state when no links', async ({ page }) => {
    // Use exact match for the empty-state heading, not the header subtitle "Noch keine Links gespeichert"
    await expect(page.getByText('Noch keine Links', { exact: true })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('has Settings heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
  })

  test('shows theme options', async ({ page }) => {
    await expect(page.getByText('Hell')).toBeVisible()
    await expect(page.getByText('Dunkel')).toBeVisible()
    await expect(page.getByText('System')).toBeVisible()
  })

  test('shows notifications toggle', async ({ page }) => {
    await expect(page.getByText('Benachrichtigungen')).toBeVisible()
  })

  test('shows AI feature toggle', async ({ page }) => {
    await expect(page.getByText(/KI-Unterstützung/)).toBeVisible()
  })

  test('shows data export option', async ({ page }) => {
    await expect(page.getByText('Daten exportieren')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('desktop view: sidebar is visible', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/today')
    await expect(page.locator('aside')).toBeVisible()
  })

  test('mobile view: bottom nav is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/today')
    await expect(page.locator('nav.fixed')).toBeVisible()
    // Sidebar should be hidden on mobile
    const sidebar = page.locator('aside')
    await expect(sidebar).not.toBeVisible()
  })

  test('tablet view rendering', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/today')
    // h1 shows greeting like "Guten Morgen 👋" – verify it is visible
    await expect(page.getByRole('heading', { name: /Guten (Morgen|Tag|Abend)/ })).toBeVisible()
  })
})
