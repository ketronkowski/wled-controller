import { test, expect, controllers } from '../fixtures/base'

const TEST_SNAPSHOT_NAME = 'pw-test-snapshot'
const ctrl = controllers[0]

test.describe('Snapshots', () => {
  // Clean up any leftover test snapshot before the suite runs
  test.beforeAll(async ({ request }) => {
    const snaps = await request.get('/api/snapshots')
    if (snaps.ok()) {
      const list = await snaps.json()
      for (const s of list) {
        if (s.name === TEST_SNAPSHOT_NAME) {
          await request.delete(`/api/snapshots/${s.id}`)
        }
      }
    }
  })

  test('captures a snapshot, verifies it in the list, restores it, then deletes it', async ({
    app,
    getWledState,
    request,
  }) => {
    const controllerPage = await app.selectController(ctrl.name)
    await controllerPage.waitForReady()

    // --- Set a known brightness before capturing ---
    await controllerPage.setBrightness(200)
    await app.page.waitForTimeout(2000)

    // Confirm the device received the brightness change
    const beforeCapture = await getWledState(ctrl.ip)
    expect(Math.abs(beforeCapture.bri - 200)).toBeLessThanOrEqual(5)

    // --- Capture snapshot ---
    await controllerPage.captureSnapshot(TEST_SNAPSHOT_NAME)

    // Snapshot should appear in the list
    const names = await controllerPage.getSnapshotNames()
    expect(names).toContain(TEST_SNAPSHOT_NAME)

    // --- Change brightness so restore has something to revert ---
    await controllerPage.setBrightness(50)
    await app.page.waitForTimeout(2000)

    const afterChange = await getWledState(ctrl.ip)
    expect(Math.abs(afterChange.bri - 50)).toBeLessThanOrEqual(5)

    // --- Restore the snapshot ---
    await controllerPage.restoreSnapshot(TEST_SNAPSHOT_NAME)
    await app.page.waitForTimeout(3000)

    // --- Validate restore via WLED REST API ---
    const afterRestore = await getWledState(ctrl.ip)
    // Should be back to ~200 (the captured brightness)
    expect(Math.abs(afterRestore.bri - 200)).toBeLessThanOrEqual(10)

    // --- Cleanup: delete the snapshot via API ---
    const snapsResp = await request.get('/api/snapshots')
    const list = await snapsResp.json()
    const testSnap = list.find((s: { name: string }) => s.name === TEST_SNAPSHOT_NAME)
    if (testSnap) {
      const del = await request.delete(`/api/snapshots/${testSnap.id}`)
      expect(del.ok()).toBe(true)
    }
  })
})
