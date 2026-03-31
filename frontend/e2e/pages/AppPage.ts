import type { Page } from '@playwright/test'
import { ControllerPage } from './ControllerPage'

/**
 * Top-level page object wrapping the AppShell.
 * Provides navigation helpers for the sidebar and header actions.
 */
export class AppPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/')
    // Wait for the sidebar to be visible before proceeding
    await this.page.waitForSelector('aside', { state: 'visible' })
  }

  // --- Sidebar tab switching ---

  async switchToControllers() {
    await this.page.getByRole('button', { name: /Controllers/ }).first().click()
  }

  async switchToGroups() {
    await this.page.getByRole('button', { name: /Groups/ }).first().click()
  }

  // --- Controller selection ---

  /**
   * Clicks a controller by its display name in the sidebar.
   * Returns a ControllerPage scoped to that selection.
   */
  async selectController(name: string): Promise<ControllerPage> {
    await this.switchToControllers()
    await this.page.getByText(name, { exact: true }).first().click()
    return new ControllerPage(this.page)
  }

  // --- Group selection ---

  async selectGroup(name: string) {
    await this.switchToGroups()
    await this.page.getByText(name, { exact: true }).first().click()
  }

  // --- Header actions ---

  async openDiscovery() {
    // Target the header button specifically (emoji + text), not the sidebar or empty-state buttons
    await this.page.getByRole('button', { name: '🔍 Discover' }).click()
    // Wait for the modal heading (h2) to appear
    await this.page.waitForSelector('h2:has-text("Discover Devices")', { state: 'visible' })
  }

  async closeDiscovery() {
    // Click the ✕ button inside the modal content (header button is behind the overlay)
    await this.page.locator('button[class*="modalClose"]').click()
  }

  async openSubnetSettings() {
    await this.page.getByRole('button', { name: /Subnets/ }).click()
    await this.page.waitForSelector('text=Subnet Settings', { state: 'visible' })
  }

  // --- Group creation shortcut ---

  async clickCreateGroup() {
    await this.switchToGroups()
    await this.page.getByRole('button', { name: /Create Group/ }).click()
  }
}
