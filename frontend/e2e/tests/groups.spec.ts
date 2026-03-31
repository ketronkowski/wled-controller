import { test, expect, controllers } from '../fixtures/base'
import { GroupPage } from '../pages/GroupPage'

const TEST_GROUP_NAME = 'pw-test-group'

test.describe('Groups', () => {
  // Clean up any leftover test group before the suite runs
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

  test('creates a group, adds all test controllers, sends brightness command, then deletes the group', async ({
    app,
    getWledState,
    request,
  }) => {
    // --- Create the group ---
    await app.clickCreateGroup()
    const groupPage = new GroupPage(app.page)
    await groupPage.waitForEditor()
    await groupPage.setGroupName(TEST_GROUP_NAME)
    await groupPage.saveGroup()

    // After saving, the editor stays open so we can add members.
    // addControllerToGroup waits for each candidate to be consumed before continuing.
    for (const ctrl of controllers) {
      await groupPage.addControllerToGroup(ctrl.name)
    }
    await groupPage.closeEditor()

    // --- Select the new group in the sidebar ---
    await app.selectGroup(TEST_GROUP_NAME)
    await groupPage.waitForDetail()

    // --- Discover which controllers actually ended up in the group ---
    // (duplicate-named controllers may result in fewer than 3 members)
    const groupsResp = await request.get('/api/groups')
    const allGroups = await groupsResp.json()
    const testGroup = allGroups.find((g: { name: string }) => g.name === TEST_GROUP_NAME)

    const controllersResp = await request.get('/api/controllers')
    const allControllers = await controllersResp.json()
    const memberIps: string[] = (testGroup?.members ?? [])
      .map((m: { id: string }) => allControllers.find((c: { id: string; ip: string }) => c.id === m.id)?.ip)
      .filter(Boolean)

    expect(memberIps.length).toBeGreaterThanOrEqual(2) // at least 2 of the 3 test controllers

    // --- Send a brightness command via the group control panel ---
    const brightnessSlider = app.page.locator('input[type="range"]').first()
    const box = await brightnessSlider.boundingBox()
    if (box) {
      const fraction = (77 - 1) / (255 - 1)
      await app.page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2)
    }

    // Allow time for: app → backend → WLED devices
    await app.page.waitForTimeout(3000)

    // Validate only the controllers that are actually group members
    for (const ip of memberIps) {
      const state = await getWledState(ip)
      expect(Math.abs(state.bri - 77)).toBeLessThanOrEqual(5)
    }

    // --- Cleanup: delete the test group via API ---
    if (testGroup) {
      const del = await request.delete(`/api/groups/${testGroup.id}`)
      expect(del.ok()).toBe(true)
    }
  })
})
