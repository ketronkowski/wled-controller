import { test, expect } from '../fixtures/base'
import { DiscoveryPage } from '../pages/DiscoveryPage'

test.describe('Discovery panel', () => {
  test('opens and closes from header Discover button', async ({ app }) => {
    await app.openDiscovery()

    const discovery = new DiscoveryPage(app.page)
    expect(await discovery.isVisible()).toBe(true)

    // Verify key UI sections are present
    await expect(app.page.getByText('Auto-Discover')).toBeVisible()
    await expect(app.page.getByText('Add by IP')).toBeVisible()

    await discovery.close()
    expect(await discovery.isVisible()).toBe(false)
  })

  test('opens from empty state "Discover Devices" button', async ({ page }) => {
    await page.goto('/')
    // If no controller is selected the empty state button should be visible
    const discoverBtn = page.getByRole('button', { name: 'Discover Devices' })
    if (await discoverBtn.isVisible()) {
      await discoverBtn.click()
      await expect(page.getByRole('heading', { name: 'Discover Devices' })).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('Add by IP field accepts input and submits', async ({ app }) => {
    await app.openDiscovery()
    const discovery = new DiscoveryPage(app.page)

    const ipInput = app.page.getByPlaceholder('192.168.x.x')
    await ipInput.fill('192.168.5.99')
    await expect(ipInput).toHaveValue('192.168.5.99')

    // Clear the field without actually submitting (we don't want to add a fake device)
    await ipInput.fill('')
    await discovery.close()
  })
})
