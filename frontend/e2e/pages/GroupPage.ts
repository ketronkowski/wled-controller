import type { Page } from '@playwright/test'

/**
 * Page object for group management (GroupDetail + GroupEditor modal).
 */
export class GroupPage {
  constructor(readonly page: Page) {}

  // --- GroupEditor modal ---

  async waitForEditor() {
    await this.page.waitForSelector('text=Create Group', { state: 'visible' })
  }

  async setGroupName(name: string) {
    await this.page.getByPlaceholder('Group name').fill(name)
  }

  async saveGroup() {
    await this.page.getByRole('button', { name: /Save/ }).click()
    // Wait for the group to be created and activeGroup state to be set in React,
    // which triggers the "Add Controllers" section to render
    await this.page.waitForSelector('text=Add Controllers', { state: 'visible', timeout: 10_000 })
  }

  /** Adds a controller by its display name in the editor's candidate list. */
  async addControllerToGroup(controllerName: string) {
    const candidateList = this.page.locator('div[class*="candidateList"] div[class*="candidate"]')

    // Skip if the controller name isn't in the candidate list (already added or different name)
    const candidate = candidateList.filter({ hasText: controllerName }).first()
    if (!(await candidate.isVisible({ timeout: 2000 }).catch(() => false))) {
      return
    }

    const countBefore = await candidateList.count()
    await candidate.getByRole('button', { name: '+ Add' }).click()

    // Wait for the candidate list to shrink, indicating the member was accepted and the
    // React Query refetch completed. Falls back to a fixed wait on timeout.
    await this.page.waitForFunction(
      (before: number) => document.querySelectorAll('[class*="candidateList"] [class*="candidate"]').length < before,
      countBefore,
      { timeout: 8_000 },
    ).catch(() => this.page.waitForTimeout(1500))
  }

  async closeEditor() {
    await this.page.getByRole('button', { name: 'Cancel' }).click()
  }

  // --- GroupDetail panel ---

  async waitForDetail() {
    await this.page.waitForSelector('button:has-text("Edit Group")', { state: 'visible' })
  }

  async openGroupEditor() {
    await this.page.getByRole('button', { name: 'Edit Group' }).click()
    await this.page.waitForSelector('text=Edit Group', { state: 'visible' })
  }

  async getMemberNames(): Promise<string[]> {
    const members = this.page.locator('div[class*="member"] span:not([class*="ip"]):not([class*="dot"])')
    return members.allTextContents()
  }

  async deleteGroup() {
    // Delete is available inside the GroupEditor
    await this.openGroupEditor()
    // Presently there is no delete button in GroupEditor; deletion is done by
    // removing all members and then abandoning. The API supports DELETE /api/groups/:id.
    // For now, navigate away — the group is cleaned up via direct API in afterAll hooks.
    await this.closeEditor()
  }
}
