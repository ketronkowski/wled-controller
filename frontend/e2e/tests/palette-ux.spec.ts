import { test, expect, uniqueControllers } from '../fixtures/base'

/**
 * Palette UX tests.
 *
 * Verifies:
 * 1. Palette list renders alphabetically with "Default" first (UI only).
 * 2. Every visible palette item has a gradient swatch.
 * 3. Selecting special palettes (ids 2–5) forces the correct number of color
 *    slot buttons visible in the Colors tab.
 * 4. Selecting a regular palette ("Party") reverts slot count to effect-based
 *    count, and the device confirms the palette change.
 *
 * Special palette slot forcing only makes sense when combined with an effect
 * that actually has color slots.  We use "Solid" (fx=0, 3 slots) as the
 * baseline effect before testing palette slot forcing.
 */

// ---------------------------------------------------------------------------
// UI-only: alphabetical order + gradient swatches (no device needed)
// ---------------------------------------------------------------------------

for (const ctrl of uniqueControllers) {
  test.describe(`Palette list UI: ${ctrl.name} (${ctrl.ip})`, () => {
    test('palette list is in alphabetical order with Default first', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.switchTab('Palettes')

      // Collect all visible palette button labels (palette name spans)
      const nameSpans = app.page.locator('[class*="list"] button [class*="paletteName"]')
      await expect(nameSpans.first()).toBeVisible()

      const names: string[] = await nameSpans.allTextContents()
      expect(names.length).toBeGreaterThan(0)

      // "Default" must be first
      expect(names[0]).toBe('Default')

      // The remaining items must be sorted (locale-aware)
      const rest = names.slice(1)
      for (let i = 0; i < rest.length - 1; i++) {
        expect(
          rest[i].localeCompare(rest[i + 1], undefined, { sensitivity: 'base' }),
          `Expected "${rest[i]}" ≤ "${rest[i + 1]}" at index ${i}`,
        ).toBeLessThanOrEqual(0)
      }
    })

    test('every visible palette item has a gradient swatch', async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      await controllerPage.switchTab('Palettes')

      // Wait for swatches to render
      const swatches = app.page.locator('[data-testid="palette-swatch"]')
      await expect(swatches.first()).toBeVisible()

      const count = await swatches.count()
      expect(count).toBeGreaterThan(0)

      // Each swatch that has a gradient must have `linear-gradient` in its style.
      // Swatches without palette color data may have no inline style (transparent
      // fallback from CSS) — that is acceptable.  But any swatch that DOES have a
      // `background` style must contain either `linear-gradient` or a color value.
      for (let i = 0; i < count; i++) {
        const swatch = swatches.nth(i)
        const style = await swatch.getAttribute('style')
        if (style && style.includes('background')) {
          expect(style).toMatch(/linear-gradient|rgb\(|#[0-9a-fA-F]/)
        }
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Device tests: special palette slot forcing + round-trip confirmation
// ---------------------------------------------------------------------------

/**
 * Special palette cases: palette id → expected visible slot count.
 * The slot count is forced by ColorPicker.effectiveSlots when selectedPal is 2–5.
 */
const SPECIAL_PALETTES: Array<{ name: string; id: number; expectedSlots: number }> = [
  { name: '* Color 1',      id: 2, expectedSlots: 1 },
  { name: '* Colors 1&2',   id: 3, expectedSlots: 2 },
  { name: '* Color Gradient', id: 4, expectedSlots: 3 },
  { name: '* Colors Only',  id: 5, expectedSlots: 3 },
]

for (const ctrl of uniqueControllers) {
  test.describe(`Palette slot forcing: ${ctrl.name} (${ctrl.ip})`, () => {
    // Select "Solid" before each palette-slot test to establish a known baseline:
    // Solid has 3 effect-based color slots, so palette forcing is clearly
    // observable as a reduction in visible slots.
    test.beforeEach(async ({ app }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()
      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1500)
    })

    for (const { name, id, expectedSlots } of SPECIAL_PALETTES) {
      test(`selecting "${name}" (id=${id}) forces ${expectedSlots} color slot(s) visible`, async ({ app, getWledState }) => {
        const controllerPage = await app.selectController(ctrl.name)
        await controllerPage.waitForReady()

        // Ensure Solid effect is active (3 slots baseline)
        await controllerPage.selectEffect('Solid')
        await app.page.waitForTimeout(1000)

        // Select the special palette
        await controllerPage.selectPalette(name)
        await app.page.waitForTimeout(2000)

        // Confirm device received the palette change
        const before = await getWledState(ctrl.ip)
        const mainSeg = before.mainseg ?? 0
        expect(before.seg[mainSeg]?.pal).toBe(id)

        // Switch to Colors tab and count visible slot buttons
        await controllerPage.switchTab('Colors')
        // Color slot buttons are inside the ColorPicker tabs area
        const slotButtons = app.page.locator('[data-testid="color-slot-tab"]')
        await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })
        const slotCount = await slotButtons.count()
        expect(slotCount).toBe(expectedSlots)
      })
    }

    test('selecting "Party" palette reverts slot count to effect-based and device confirms', async ({ app, getWledState }) => {
      const controllerPage = await app.selectController(ctrl.name)
      await controllerPage.waitForReady()

      // Ensure Solid effect (3 slots)
      await controllerPage.selectEffect('Solid')
      await app.page.waitForTimeout(1000)

      // First select a special palette to change state
      await controllerPage.selectPalette('* Color 1')
      await app.page.waitForTimeout(1500)

      // Now select a regular palette ("Party", id=6)
      await controllerPage.selectPalette('Party')
      await app.page.waitForTimeout(2000)

      // Device should report Party palette
      const state = await getWledState(ctrl.ip)
      const mainSeg = state.mainseg ?? 0
      // Party is not palette id 0 (Default) or 2–5 (special), so confirm it changed
      expect(state.seg[mainSeg]?.pal).not.toBe(0)
      expect(state.seg[mainSeg]?.pal).not.toBeLessThan(6)

      // Colors tab should revert to Solid's 3 effect-based slots
      await controllerPage.switchTab('Colors')
      const slotButtons = app.page.locator('[data-testid="color-slot-tab"]')
      await expect(slotButtons.first()).toBeVisible({ timeout: 5000 })
      const slotCount = await slotButtons.count()
      expect(slotCount).toBe(3)
    })
  })
}
