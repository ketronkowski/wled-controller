import type { Page } from '@playwright/test'

/**
 * Page object for the Discovery panel modal.
 */
export class DiscoveryPage {
  constructor(readonly page: Page) {}

  async isVisible(): Promise<boolean> {
    // Scope to the modal heading specifically (avoids the empty-state "Discover Devices" button)
    return this.page.getByRole('heading', { name: 'Discover Devices' }).isVisible()
  }

  async close() {
    // Click the ✕ button inside the modal content.
    // The header "✕ Close" button sits behind the modal overlay and can't be clicked.
    await this.page.locator('button[class*="modalClose"]').click()
    await this.page.waitForSelector('h2:has-text("Discover Devices")', { state: 'detached', timeout: 5_000 })
  }

  /** Fills the manual IP field and submits. */
  async addByIp(ip: string) {
    await this.page.getByPlaceholder('192.168.x.x').fill(ip)
    await this.page.getByRole('button', { name: 'Add', exact: true }).click()
  }

  /** Starts an auto-scan. */
  async startScan() {
    await this.page.getByRole('button', { name: 'Start Scan' }).click()
  }

  /** Waits until scanning stops. */
  async waitForScanComplete() {
    await this.page.waitForSelector('text=Start Scan', { state: 'visible', timeout: 60_000 })
  }
}
