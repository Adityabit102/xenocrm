import { test, expect } from '@playwright/test'

test.describe('XenoCRM — Full Campaign Flow', () => {
  test.beforeEach(async ({ page }) => {
    
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@xenocrm.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('1. Dashboard loads with seed data', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/)
    
    await expect(page.getByText('Total Messages')).toBeVisible()
    await expect(page.getByText('Delivery Rate')).toBeVisible()
    await expect(page.getByText('Avg Click Rate')).toBeVisible()
    await expect(page.getByText('Total Revenue')).toBeVisible()
  })

  test('2. Customers page shows seed data (500 customers)', async ({ page }) => {
    await page.goto('/customers')
    
    await expect(page.getByRole('table')).toBeVisible()
    
    await expect(page.getByText(/500|customers/i)).toBeVisible()
    
    await expect(page.getByText('Champions')).toBeVisible()
    await expect(page.getByText('At Risk')).toBeVisible()
    await expect(page.getByText('Lapsed')).toBeVisible()
  })

  test('3. Create segment using AI mode', async ({ page }) => {
    await page.goto('/segments/new')
    
    await expect(page.getByPlaceholder(/describe your audience/i)).toBeVisible()
    
    await page.fill(
      'textarea, input[placeholder*="audience" i], input[placeholder*="describe" i]',
      'Gold tier customers in Mumbai who spent over 5000'
    )
    
    await page.getByRole('button', { name: /build segment/i }).click()
    
    await expect(page.getByText(/customers matched/i)).toBeVisible({ timeout: 15000 })
    
    await page.fill('input[placeholder*="segment name" i], input[name="name"]', 'Gold Mumbai High Spenders')
    
    await page.getByRole('button', { name: /save segment/i }).click()
    
    await page.waitForURL('**/segments')
    await expect(page.getByText('Gold Mumbai High Spenders')).toBeVisible()
  })

  test('4. Create segment using manual rule builder', async ({ page }) => {
    await page.goto('/segments/new')
    
    await page.getByRole('button', { name: /manual/i }).click()
    
    await page.getByRole('button', { name: /add condition/i }).click()
    
    await expect(page.getByRole('combobox').first()).toBeVisible()
    
    await page.fill('input[name="name"], input[placeholder*="segment name" i]', 'Test Manual Segment')
    
    await page.getByRole('button', { name: /save segment/i }).click()
    await page.waitForURL('**/segments')
    await expect(page.getByText('Test Manual Segment')).toBeVisible()
  })

  test('5. Create and dispatch a campaign', async ({ page }) => {
    
    await page.goto('/segments')
    const segmentExists = await page.getByText('Gold Mumbai High Spenders').isVisible().catch(() => false)
    if (!segmentExists) {
      
      await page.goto('/segments/new')
      await page.getByRole('button', { name: /manual/i }).click()
      await page.fill('input[name="name"], input[placeholder*="segment name" i]', 'All Customers Test')
      await page.getByRole('button', { name: /save segment/i }).click()
      await page.waitForURL('**/segments')
    }

    
    await page.goto('/campaigns/new')
    
    await page.fill('input[name="name"], input[placeholder*="campaign name" i]', 'Test WhatsApp Campaign')
    await page.getByRole('button', { name: /next/i }).click()

    
    await page.getByRole('combobox').first().click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: /next/i }).click()

    
    await page.getByText('WhatsApp').click()
    await page.getByRole('button', { name: /next/i }).click()

    
    await page.fill(
      'textarea[name="message"], textarea[placeholder*="message" i]',
      'Hi {{first_name}}, check out our latest collection! 🛍️'
    )
    await page.getByRole('button', { name: /next/i }).click()

    
    await page.getByText(/send now/i).click()
    await page.getByRole('button', { name: /next|schedule/i }).click()

    
    await page.getByRole('button', { name: /launch campaign/i }).click()

    
    await page.waitForURL('**/campaigns/**', { timeout: 10000 })
    await expect(page.getByText('Test WhatsApp Campaign')).toBeVisible()
  })

  test('6. Campaign stats update in real time', async ({ page }) => {
    
    await page.goto('/campaigns')
    
    const campaignRow = page.getByRole('row').nth(1)
    await campaignRow.click()
    
    await expect(page.getByText(/sent|delivered|clicked/i)).toBeVisible()
    
    await expect(page.getByText(/delivery rate/i)).toBeVisible()
    
    await expect(async () => {
      const statsText = await page.getByText(/\d+%|\d+ sent/i).first().textContent()
      expect(statsText).toBeTruthy()
    }).toPass({ timeout: 30000 })
  })

  test('7. Customer search and profile', async ({ page }) => {
    await page.goto('/customers')
    
    await page.fill('input[placeholder*="search" i]', 'Mumbai')
    await page.waitForTimeout(500) 
    
    await expect(page.getByRole('table')).toBeVisible()
    
    await page.getByRole('row').nth(1).click()
    
    await expect(page.getByText(/orders|communications|rfm/i)).toBeVisible()
  })
})

test.describe('XenoCRM — AutoReach Agent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'demo@xenocrm.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('8. AutoReach agent generates a campaign plan', async ({ page }) => {
    await page.goto('/agent')
    
    await expect(page.getByText(/AutoReach/i)).toBeVisible()
    await expect(
      page.getByPlaceholder(/describe your campaign goal/i)
        .or(page.getByPlaceholder(/campaign goal/i))
    ).toBeVisible()
    
    await page.fill(
      'textarea[placeholder*="goal" i], input[placeholder*="goal" i]',
      'Re-engage customers who have not bought in 60 days'
    )
    
    await page.getByRole('button', { name: /plan campaign/i }).click()
    
    await expect(page.getByText(/analysing|finding segment|drafting/i)).toBeVisible({ timeout: 5000 })
    
    await expect(page.getByText(/approve|channel|message/i)).toBeVisible({ timeout: 20000 })
  })

  test('9. AutoReach agent executes approved plan', async ({ page }) => {
    await page.goto('/agent')
    await page.fill(
      'textarea[placeholder*="goal" i], input[placeholder*="goal" i]',
      'Promote new collection to loyal customers'
    )
    await page.getByRole('button', { name: /plan campaign/i }).click()
    
    await expect(page.getByRole('button', { name: /approve & send/i })).toBeVisible({ timeout: 20000 })
    
    await page.getByRole('button', { name: /approve & send/i }).click()
    
    await page.waitForURL('**/campaigns/**', { timeout: 15000 })
    await expect(page.getByText(/in progress|queued|sent/i)).toBeVisible()
  })
})
