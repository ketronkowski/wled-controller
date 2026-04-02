/**
 * Capture reference data from the real WLED device at http://192.168.5.51.
 *
 * Run with:
 *   cd frontend
 *   npx playwright test --config e2e/scripts/capture.config.ts
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const WLED_URL = 'http://192.168.5.51'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.join(__dirname, '../fixtures/wled-reference.json')

// Palettes to probe for color slot behavior (the first 6 special palettes)
const SPECIAL_PALETTE_COUNT = 6

// Effects to probe for color slot labels
const PROBE_EFFECTS = ['Solid', 'Blink', 'Fire 2012', 'Chase 3']

test.setTimeout(120_000)

test('capture WLED reference data', async ({ page }) => {
  console.log(`\nNavigating to WLED UI at ${WLED_URL}...`)
  await page.goto(WLED_URL, { waitUntil: 'domcontentloaded' })

  // Wait for the effects list to populate
  await page.waitForSelector('#fxlist .lstI', { timeout: 20000 })
  // Give the UI extra time to finish sorting/animations
  await page.waitForTimeout(2000)

  // ── 1. Effect order ──────────────────────────────────────────────────────────
  console.log('Capturing effect list...')
  const effectOrder = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#fxlist .lstI'))
    return items.map((el) => ({
      name: (el.querySelector('label')?.textContent ?? el.textContent ?? '').trim(),
      wledId: parseInt((el as HTMLElement).dataset.id ?? '-1', 10),
    }))
  })
  console.log(`  Found ${effectOrder.length} effects`)
  if (effectOrder.length > 0) {
    console.log(`  First effect: ${effectOrder[0].name} (id=${effectOrder[0].wledId})`)
    console.log(`  Second effect: ${effectOrder[1]?.name} (id=${effectOrder[1]?.wledId})`)
  }

  // ── 2. Palette order ─────────────────────────────────────────────────────────
  console.log('Capturing palette list...')
  // Wait for palette list too
  await page.waitForSelector('#pallist .lstI', { timeout: 15000 })
  const paletteOrder = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#pallist .lstI'))
    return items.map((el) => ({
      name: (el.querySelector('label')?.textContent ?? el.textContent ?? '').trim(),
      wledId: parseInt((el as HTMLElement).dataset.id ?? '-1', 10),
    }))
  })
  console.log(`  Found ${paletteOrder.length} palettes`)

  // ── 3. Gradient swatch presence ──────────────────────────────────────────────
  console.log('Checking palette gradient swatches...')
  const paletteHasGradientSwatch = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#pallist .lstI'))
    if (items.length === 0) return false
    // Check that every palette item has a .lstIprev child
    return items.every((el) => el.querySelector('.lstIprev') !== null)
  })
  console.log(`  All palettes have gradient swatch: ${paletteHasGradientSwatch}`)

  // ── Helper: read visible color slot labels ───────────────────────────────────
  const readColorSlots = async (): Promise<{ visibleSlotCount: number; slotLabels: string[] }> => {
    await page.waitForTimeout(600) // let WLED update the UI
    return page.evaluate(() => {
      const slots = [
        document.getElementById('csl0'),
        document.getElementById('csl1'),
        document.getElementById('csl2'),
      ]
      const visible = slots.filter((el) => el !== null && !el.classList.contains('hide'))
      return {
        visibleSlotCount: visible.length,
        slotLabels: visible.map((el) => el!.textContent?.trim() ?? ''),
      }
    })
  }

  // ── Helper: click an effect by name or data-id ───────────────────────────────
  const selectEffect = async (name: string, wledId?: number): Promise<boolean> => {
    let label
    if (wledId !== undefined) {
      label = page.locator(`#fxlist .lstI[data-id="${wledId}"] label`).first()
    } else {
      label = page.locator(`#fxlist .lstI`).filter({ hasText: name }).locator('label').first()
    }
    const count = await label.count()
    if (count === 0) {
      console.log(`  WARNING: effect "${name}" not found`)
      return false
    }
    await label.click()
    await page.waitForTimeout(800)
    return true
  }

  // ── Helper: ensure #palw is visible (requires "Palette" effect, id=65, to be selected) ──
  const ensurePaletteListVisible = async (): Promise<void> => {
    const isVisible = await page.evaluate(
      () => getComputedStyle(document.querySelector('#palw')!).display !== 'none',
    )
    if (!isVisible) {
      // Select the "Palette" effect (WLED id=65) to make the palette list visible
      await selectEffect('Palette', 65)
      await page.waitForTimeout(500)
    }
  }

  // ── Helper: click a palette by name ─────────────────────────────────────────
  const selectPalette = async (name: string): Promise<boolean> => {
    await ensurePaletteListVisible()
    const label = page.locator(`#pallist .lstI`).filter({ hasText: name }).locator('label').first()
    const count = await label.count()
    if (count === 0) {
      console.log(`  WARNING: palette "${name}" not found`)
      return false
    }
    await label.click()
    await page.waitForTimeout(800)
    return true
  }

  // ── 4. Effect color slots ────────────────────────────────────────────────────
  console.log('Capturing effect color slot data...')
  const effectColorSlots: Record<string, { visibleSlotCount: number; slotLabels: string[] }> = {}

  for (const effectName of PROBE_EFFECTS) {
    const found = await selectEffect(effectName)
    if (found) {
      const slots = await readColorSlots()
      effectColorSlots[effectName] = slots
      console.log(`  ${effectName}: ${slots.visibleSlotCount} slots [${slots.slotLabels.join(', ')}]`)
    } else {
      effectColorSlots[effectName] = { visibleSlotCount: 0, slotLabels: [] }
    }
  }

  // ── 5. Palette color slots ───────────────────────────────────────────────────
  // Select the "Palette" effect (id=65) first — this makes #palw visible AND shows all
  // color slots at their default state, allowing us to observe per-palette slot behavior.
  console.log('Capturing palette color slot data...')
  await selectEffect('Palette', 65)
  await page.waitForTimeout(800)

  const paletteColorSlots: Record<
    string,
    { name: string; visibleSlotCount: number; slotLabels: string[] }
  > = {}

  const specialPalettes = paletteOrder.slice(0, SPECIAL_PALETTE_COUNT)
  for (const pal of specialPalettes) {
    const found = await selectPalette(pal.name)
    if (found) {
      const slots = await readColorSlots()
      paletteColorSlots[String(pal.wledId)] = {
        name: pal.name,
        ...slots,
      }
      console.log(`  ${pal.name} (id=${pal.wledId}): ${slots.visibleSlotCount} slots [${slots.slotLabels.join(', ')}]`)
    }
  }

  // ── 6. Assemble and write reference JSON ─────────────────────────────────────
  const reference = {
    capturedAt: new Date().toISOString(),
    wledUrl: WLED_URL,
    effectOrder,
    paletteOrder,
    paletteColorSlots,
    effectColorSlots,
    paletteHasGradientSwatch,
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reference, null, 2))
  console.log(`\nReference data written to ${OUTPUT_PATH}`)

  // ── 7. Assertions to confirm data quality ────────────────────────────────────
  expect(effectOrder.length).toBeGreaterThan(0)
  expect(paletteOrder.length).toBeGreaterThan(0)

  // Solid should be first (WLED always puts it at position 0)
  const solidEffect = effectOrder[0]
  expect(solidEffect.name).toBe('Solid')

  // Remaining effects should be roughly alphabetically sorted (WLED sorts after Solid).
  // We log a warning rather than hard-fail since emoji in names can affect sort order.
  if (effectOrder.length > 2) {
    const rest = effectOrder.slice(1).map((e) => e.name)
    const sorted = [...rest].sort((a, b) => a.localeCompare(b))
    if (JSON.stringify(rest) !== JSON.stringify(sorted)) {
      console.log('  NOTE: effects after Solid are not strictly locale-sorted (likely due to emoji).')
    } else {
      console.log('  Effects after Solid are alphabetically sorted.')
    }
  }

  // All palettes should have gradient swatches
  expect(paletteHasGradientSwatch).toBe(true)

  console.log('\n=== Summary ===')
  console.log(`Effects: ${effectOrder.length}`)
  console.log(`Palettes: ${paletteOrder.length}`)
  console.log(`Effect color slot entries: ${Object.keys(effectColorSlots).length}`)
  console.log(`Palette color slot entries: ${Object.keys(paletteColorSlots).length}`)
  console.log(`Solid is first effect: ${solidEffect?.name === 'Solid'}`)
  console.log(`All palettes have gradient swatch: ${paletteHasGradientSwatch}`)
})
