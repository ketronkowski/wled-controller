import { test, expect, controllers, uniqueControllers } from '../fixtures/base'

/**
 * Controller control panel tests.
 *
 * Runs against each dedicated test controller. After each UI interaction, the
 * WLED device's REST API (`GET /json/state`) is called directly to verify the
 * state change actually reached the physical device. This is more reliable than
 * scraping the WLED built-in web UI, which varies by WLED version/mode.
 */

// All 3 controllers for simple load/brightness tests (duplicate names just re-test the same device)
for (const ctrl of controllers) {
  test.describe(`Controller: ${ctrl.name} (${ctrl.ip})`, () => {
    test('controller detail panel loads', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      // Header should show the controller name
      await expect(app.page.getByRole('heading', { name: ctrl.name })).toBeVisible()
    })

    test('brightness slider changes and is reflected on device', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.setBrightness(128)

      // Allow time for: app → backend → WLED device
      await app.page.waitForTimeout(2000)

      // Validate via the WLED device REST API
      const state = await getWledState(ctrl.ip)
      // Allow ±5 tolerance for rounding differences
      expect(Math.abs(state.bri - 128)).toBeLessThanOrEqual(5)
    })

  })
}

// Effect and palette tests only run against unique sidebar names to avoid
// testing the same physical device twice and causing false assertion failures.
for (const ctrl of uniqueControllers) {
  test.describe(`Controller (unique): ${ctrl.name} (${ctrl.ip})`, () => {
    test('effect can be searched and selected', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      const initial = await getWledState(ctrl.ip)
      const mainSeg = initial.mainseg ?? 0

      // Establish a known starting point (Solid, fx=0) so the "Blink" change is detectable
      // regardless of what effect a previous test run left on the device.
      if (initial.seg[mainSeg]?.fx !== 0) {
        await controllerPage.selectEffect('Solid')
        await app.page.waitForTimeout(1500)
      }

      await controllerPage.selectEffect('Blink')
      await app.page.waitForTimeout(2000)

      const after = await getWledState(ctrl.ip)
      // Blink is fx=1; confirm it changed away from Solid (fx=0)
      expect(after.seg[mainSeg]?.fx).not.toBe(0)
    })

    test('palette can be searched and selected', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      // Record initial palette on the main segment
      const before = await getWledState(ctrl.ip)
      const mainSeg = before.mainseg ?? 0
      const initialPal = before.seg[mainSeg]?.pal ?? -1

      // "Party" is a standard WLED palette present in all firmware versions.
      // If already on Party, first switch to Default, then back to Party.
      if (initialPal !== 0) {
        await controllerPage.selectPalette('Default')
        await app.page.waitForTimeout(1000)
      }
      await controllerPage.selectPalette('Party')
      await app.page.waitForTimeout(2000)

      const after = await getWledState(ctrl.ip)
      // Should not be 0 (Default) anymore
      expect(after.seg[mainSeg]?.pal).not.toBe(0)
    })
  })
}
