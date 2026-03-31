import type { Page } from '@playwright/test'

/**
 * Page object for the ControllerDetail panel and its embedded ControlPanel.
 */
export class ControllerPage {
  constructor(readonly page: Page) {}

  async waitForReady() {
    // Wait until the controller detail panel is visible and not in loading state
    await this.page.waitForSelector('h2', { state: 'visible' })
    await this.page.waitForSelector('text=Loading', { state: 'detached', timeout: 10_000 }).catch(() => {
      // ignore if "Loading" never appears (already loaded)
    })
  }

  // --- Power ---

  async clickPower() {
    await this.page.getByRole('button', { name: /⏻/ }).click()
  }

  // --- Brightness ---

  /**
   * Sets brightness via a physical mouse click on the slider track.
   * Mouse interaction is the most reliable way to trigger React's onChange
   * on a controlled range input.
   * value: 1–255
   */
  async setBrightness(value: number) {
    const slider = this.page.locator('input[type="range"]').first()
    const box = await slider.boundingBox()
    if (!box) throw new Error('Brightness slider not found')
    const fraction = (value - 1) / (255 - 1)
    await this.page.mouse.click(
      box.x + box.width * fraction,
      box.y + box.height / 2,
    )
  }

  // --- Tabs ---

  async switchTab(tab: 'Colors' | 'Effects' | 'Palettes') {
    await this.page.getByRole('button', { name: tab, exact: true }).click()
  }

  // --- Effects ---

  async selectEffect(name: string) {
    await this.switchTab('Effects')
    const search = this.page.getByPlaceholder('Search effects...')
    await search.fill(name)
    await this.page.getByRole('button', { name: name, exact: true }).first().click()
  }

  // --- Palettes ---

  async selectPalette(name: string) {
    await this.switchTab('Palettes')
    const search = this.page.getByPlaceholder('Search palettes...')
    await search.fill(name)
    await this.page.getByRole('button', { name: name, exact: true }).first().click()
  }

  // --- Snapshots ---

  async clickCapture() {
    await this.page.getByRole('button', { name: 'Capture' }).click()
    await this.page.waitForSelector('text=Capture Snapshot', { state: 'visible' })
  }

  async captureSnapshot(snapshotName: string) {
    await this.clickCapture()
    // The label has no for/id association so getByLabel won't work — use the placeholder instead
    const nameInput = this.page.getByPlaceholder('e.g. Living Room — Pre-Party')
    await nameInput.fill(snapshotName)
    // Scope to the modal overlay to avoid matching the "Capture" button in the SnapshotList header
    await this.page.locator('div[class*="overlay"] div[class*="modal"]')
      .getByRole('button', { name: 'Capture', exact: true })
      .click()
    // Wait for modal to close
    await this.page.waitForSelector('text=Capture Snapshot', { state: 'detached', timeout: 10_000 })
  }

  async restoreSnapshot(snapshotName: string) {
    const card = this.page.locator('div').filter({ hasText: snapshotName }).first()
    await card.getByRole('button', { name: 'Restore' }).click()
    // Confirm in the restore modal
    await this.page.getByRole('button', { name: 'Restore', exact: true }).last().click()
  }

  async deleteSnapshot(snapshotName: string) {
    const card = this.page.locator('div').filter({ hasText: snapshotName }).first()
    await card.getByRole('button', { name: '✕' }).click()
  }

  async getSnapshotNames(): Promise<string[]> {
    // Wait briefly for React Query to refetch and re-render the snapshot list
    await this.page.waitForTimeout(1500)
    const cards = this.page.locator('span[class*="cardName"]')
    return cards.allTextContents()
  }
}
