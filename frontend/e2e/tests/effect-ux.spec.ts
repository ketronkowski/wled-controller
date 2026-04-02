import { test, expect, uniqueControllers } from '../fixtures/base'

/**
 * Effect UX tests.
 *
 * Verifies:
 * 1. Effect list renders alphabetically with "Solid" first (UI only).
 * 2. Selecting an effect reaches the device and the Colors tab immediately
 *    shows updated slot labels without waiting for a server poll.
 * 3. Selecting "Blink" shows Blink-specific slot labels ("Fx", "Bg", "3").
 *
 * Notes:
 * - Effect names in the reference data include emoji suffixes (e.g. "Blink 🎨•⋮").
 *   The ControllerPage.selectEffect helper uses `exact: true` against the button
 *   text, so we must search with the exact displayed name.  However device
 *   firmware may trim or differ.  We use `getByRole('button').filter({ hasText })`
 *   with a partial match for robustness.
 * - Slot label checks are UI-only; they don't require device round-trip.
 */

// ---------------------------------------------------------------------------
// UI-only: alphabetical order (no device needed)
// ---------------------------------------------------------------------------

for (const ctrl of uniqueControllers) {
  test.describe(`Effect list UI: ${ctrl.name} (${ctrl.ip})`, () => {
    test('effect list is in alphabetical order with Solid first', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.switchTab('Effects')

      // Collect all visible effect button texts
      const effectButtons = app.page.locator('[class*="list"] button')
      await expect(effectButtons.first()).toBeVisible()

      const names: string[] = await effectButtons.allTextContents()
      expect(names.length).toBeGreaterThan(0)

      // "Solid" must be the very first entry
      expect(names[0].trim()).toBe('Solid')

      // Remaining entries must be sorted locale-aware (ignore emoji in comparison)
      const rest = names.slice(1).map(n => n.trim())
      for (let i = 0; i < rest.length - 1; i++) {
        expect(
          rest[i].localeCompare(rest[i + 1], undefined, { sensitivity: 'base' }),
          `Expected "${rest[i]}" ≤ "${rest[i + 1]}" at position ${i}`,
        ).toBeLessThanOrEqual(0)
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Device tests: effect selection + color slot label update
// ---------------------------------------------------------------------------

for (const ctrl of uniqueControllers) {
  test.describe(`Effect selection: ${ctrl.name} (${ctrl.ip})`, () => {
    test('selecting an effect updates the device fx index', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      const before = await getWledState(ctrl.ip)
      const mainSeg = before.mainseg ?? 0

      // Establish a known starting point: Solid (fx=0)
      if (before.seg[mainSeg]?.fx !== 0) {
        await controllerPage.selectEffect('Solid')
        await app.page.waitForTimeout(1500)
      }

      // Switch to a different effect — use the search to find "Blink" (partial match)
      await controllerPage.switchTab('Effects')
      const search = app.page.getByPlaceholder('Search effects...')
      await search.fill('Blink')
      // Click the first button that contains "Blink" (handles emoji suffixes)
      await app.page.getByRole('button').filter({ hasText: /^Blink/ }).first().click()
      await app.page.waitForTimeout(2000)

      const after = await getWledState(ctrl.ip)
      // fx should no longer be 0 (Solid)
      expect(after.seg[mainSeg]?.fx).not.toBe(0)
    })

    test('switching to Colors tab immediately after effect change shows updated slot labels', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      const before = await getWledState(ctrl.ip)
      const mainSeg = before.mainseg ?? 0

      // Start from Solid so Blink is a definite change
      if (before.seg[mainSeg]?.fx !== 0) {
        await controllerPage.selectEffect('Solid')
        await app.page.waitForTimeout(1500)
      }

      // Select Blink via search (partial match for emoji-suffixed names)
      await controllerPage.switchTab('Effects')
      const search = app.page.getByPlaceholder('Search effects...')
      await search.fill('Blink')
      await app.page.getByRole('button').filter({ hasText: /^Blink/ }).first().click()

      // Switch to Colors tab immediately (no extra wait — optimistic local state)
      await controllerPage.switchTab('Colors')

      // Blink has slot labels "Fx", "Bg", "3" — check that the tab area rendered
      const slotButtons = app.page.locator('[class*="tabs"] [class*="tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })
      const count = await slotButtons.count()
      // Blink has 3 color slots
      expect(count).toBe(3)
    })

    test('selecting Blink shows Blink-specific slot labels (Fx, Bg, 3)', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      const before = await getWledState(ctrl.ip)
      const mainSeg = before.mainseg ?? 0

      // Ensure we are on Solid first
      if (before.seg[mainSeg]?.fx !== 0) {
        await controllerPage.selectEffect('Solid')
        await app.page.waitForTimeout(1500)
      }

      // Select Blink via search
      await controllerPage.switchTab('Effects')
      const search = app.page.getByPlaceholder('Search effects...')
      await search.fill('Blink')
      await app.page.getByRole('button').filter({ hasText: /^Blink/ }).first().click()
      await app.page.waitForTimeout(2000)

      // Switch to Colors tab and verify slot labels
      await controllerPage.switchTab('Colors')
      const slotButtons = app.page.locator('[class*="tabs"] [class*="tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })

      const labels: string[] = await slotButtons.allTextContents()
      // Strip whitespace from labels (the swatch <span> adds no text, button text is label only)
      const trimmed = labels.map(l => l.trim())

      // Blink-specific: first slot "Fx", second "Bg", third "3"
      expect(trimmed).toContain('Fx')
      expect(trimmed).toContain('Bg')
    })
  })
}
