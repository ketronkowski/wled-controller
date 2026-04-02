import { test, expect, uniqueControllers, controllers } from '../fixtures/base'
import { GroupPage } from '../pages/GroupPage'

/**
 * Color UX tests.
 *
 * Verifies:
 * 1. Colors tab renders color slot buttons for an effect with active slots.
 * 2. Clicking a color slot button makes it active (selected style).
 * 3. For a group: sending a palette command is confirmed by the device.
 *
 * Implementation notes:
 * - Color slot buttons live in ColorPicker's `[class*="tabs"]` area.
 * - The active slot has a class containing "active".
 * - We use "Solid" as the baseline effect (3 slots: Fx, 2, 3).
 * - For the group test we create a temporary test group, send a palette
 *   command, verify at least one member device reflects the change, then
 *   clean up the group.
 */

const TEST_GROUP_NAME = 'pw-color-ux-test-group'

// ---------------------------------------------------------------------------
// UI-only: Colors tab renders slot buttons
// ---------------------------------------------------------------------------

for (const ctrl of uniqueControllers) {
  test.describe(`Colors tab UI: ${ctrl.name} (${ctrl.ip})`, () => {
    test('Colors tab shows color slot buttons for Solid effect', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      // Ensure we are on Solid (3 color slots: Fx, 2, 3)
      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1500)

      // Switch to Colors tab
      await controllerPage.switchTab('Colors')

      // Color slot buttons are rendered inside ColorPicker's tabs wrapper
      const slotButtons = app.page.locator('[data-testid="color-slot-tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })

      const count = await slotButtons.count()
      // Solid has 3 color slots (Fx, 2, 3)
      expect(count).toBe(3)
    })

    test('clicking a color slot button makes it the active slot', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      // Use Solid for predictable slot count
      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1500)

      await controllerPage.switchTab('Colors')

      const slotButtons = app.page.locator('[data-testid="color-slot-tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })

      const count = await slotButtons.count()
      expect(count).toBeGreaterThanOrEqual(2)

      // Click the second slot button (index 1)
      const secondSlot = slotButtons.nth(1)
      await secondSlot.click()

      // After clicking, the second slot should have the "active" class applied
      await expect(secondSlot).toHaveClass(/active/)
    })

    test('first color slot button is active by default', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1500)

      await controllerPage.switchTab('Colors')

      const slotButtons = app.page.locator('[data-testid="color-slot-tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })

      // The first slot button should be active on initial render
      await expect(slotButtons.first()).toHaveClass(/active/)
    })

    test('slot swatch color is displayed on each color slot button', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1500)

      await controllerPage.switchTab('Colors')

      // Each slot button contains a swatch span with an inline background style
      const swatches = app.page.locator('[data-testid="color-slot-tab"] [class*="swatch"]')
      await expect(swatches.first()).toBeVisible({ timeout: 5000 })

      const count = await swatches.count()
      expect(count).toBeGreaterThan(0)

      // Each swatch should have an rgb() background style
      for (let i = 0; i < count; i++) {
        const style = await swatches.nth(i).getAttribute('style')
        expect(style).toMatch(/background:\s*rgb\(/)
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Group test: palette command reaches the device
// ---------------------------------------------------------------------------

test.describe('Group palette command', () => {
  // Clean up any leftover test group before and after the suite
  test.beforeAll(async ({ request }) => {
    const groups = await request.get('/api/groups')
    if (groups.ok()) {
      const list = await groups.json()
      for (const g of list) {
        if (g.name === TEST_GROUP_NAME) {
          await request.delete(`/api/groups/${g.id}`)
        }
      }
    }
  })

  test.afterAll(async ({ request }) => {
    const groups = await request.get('/api/groups')
    if (groups.ok()) {
      const list = await groups.json()
      for (const g of list) {
        if (g.name === TEST_GROUP_NAME) {
          await request.delete(`/api/groups/${g.id}`)
        }
      }
    }
  })

  test('sending palette command via group control panel is confirmed on device', async ({
    app,
    getWledState,
    request,
  }) => {
    // --- Create the test group ---
    await app.clickCreateGroup()
    const groupPage = new GroupPage(app.page)
    await groupPage.waitForEditor()
    await groupPage.setGroupName(TEST_GROUP_NAME)
    await groupPage.saveGroup()

    // Add all test controllers (unique names to avoid adding the same device twice)
    for (const ctrl of controllers) {
      await groupPage.addControllerToGroup(ctrl.name)
    }
    await groupPage.closeEditor()

    // --- Navigate to the group detail ---
    await app.selectGroup(TEST_GROUP_NAME)
    await groupPage.waitForDetail()

    // Discover the actual member IPs via the API so we can verify the device state
    const groupsResp = await request.get('/api/groups')
    const allGroups = await groupsResp.json()
    const testGroup = allGroups.find((g: { name: string }) => g.name === TEST_GROUP_NAME)

    const controllersResp = await request.get('/api/controllers')
    const allControllers = await controllersResp.json()
    const memberIps: string[] = (testGroup?.members ?? [])
      .map((m: { id: string }) => allControllers.find((c: { id: string; ip: string }) => c.id === m.id)?.ip)
      .filter(Boolean)

    expect(memberIps.length).toBeGreaterThanOrEqual(1)

    // Record current palette on one member device
    const firstIp = memberIps[0]
    const before = await getWledState(firstIp)
    const mainSeg = before.mainseg ?? 0
    const initialPal = before.seg[mainSeg]?.pal ?? -1

    // --- Send a palette command via the group ControlPanel ---
    // Navigate to the Palettes tab in the group control panel and pick a palette
    // that is different from the current one.  Use "Default" (id=0) as a safe
    // fallback, or "Party" if already on Default.
    const groupControllerPage = { switchTab: app.page.getByRole('button', { name: /Palettes/, exact: true }) }
    await app.page.getByRole('button', { name: 'Palettes', exact: true }).click()

    const searchInput = app.page.getByPlaceholder('Search palettes...')
    await expect(searchInput).toBeVisible({ timeout: 5000 })

    // Select Default if not already on it, otherwise select Party
    const targetPalette = initialPal !== 0 ? 'Default' : 'Party'
    await searchInput.fill(targetPalette)
    await app.page.getByRole('button', { name: targetPalette, exact: true }).first().click()

    // Allow time for: app → backend → WLED devices
    await app.page.waitForTimeout(3000)

    // Verify at least the first member device shows the palette change
    const after = await getWledState(firstIp)
    if (targetPalette === 'Default') {
      expect(after.seg[mainSeg]?.pal).toBe(0)
    } else {
      // Party — should not be the same as Default (0)
      expect(after.seg[mainSeg]?.pal).not.toBe(0)
    }

    // --- Cleanup: delete the test group ---
    if (testGroup) {
      await request.delete(`/api/groups/${testGroup.id}`)
    }
  })
})
