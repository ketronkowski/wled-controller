import { test as base, type Page } from '@playwright/test'
import { AppPage } from '../pages/AppPage'

export interface TestController {
  name: string
  ip: string
}

export const controllers: TestController[] = [
  { name: process.env.TEST_CONTROLLER_1_NAME ?? 'Mega Tree 1', ip: process.env.TEST_CONTROLLER_1_IP ?? '192.168.5.59' },
  { name: process.env.TEST_CONTROLLER_2_NAME ?? 'Mega Tree 2', ip: process.env.TEST_CONTROLLER_2_IP ?? '192.168.5.46' },
  { name: process.env.TEST_CONTROLLER_3_NAME ?? 'Mega Tree 1', ip: process.env.TEST_CONTROLLER_3_IP ?? '192.168.5.49' },
]

/**
 * Subset of controllers with unique sidebar display names.
 * When two controllers share the same name, the sidebar always navigates to the
 * first one — use this array for tests that navigate by name to avoid testing
 * the same physical device twice.
 */
export const uniqueControllers: TestController[] = controllers.filter(
  (ctrl, i, arr) => arr.findIndex(c => c.name === ctrl.name) === i,
)

interface WledState {
  bri: number
  on: boolean
  mainseg: number
  seg: Array<{ fx: number; pal: number }>
}

interface Fixtures {
  app: AppPage
  openWledUi: (ip: string) => Promise<Page>
  getWledState: (ip: string) => Promise<WledState>
}

/**
 * Extended Playwright `test` fixture that provides:
 *
 * - `app`          An AppPage already navigated to baseURL.
 * - `openWledUi`   Opens the WLED device's built-in web UI in a second page.
 * - `getWledState` Fetches the device's current state via the WLED REST API
 *                  (`GET http://{ip}/json/state`). More reliable than scraping
 *                  the UI and works regardless of WLED UI version.
 */
export const test = base.extend<Fixtures>({
  app: async ({ page }, use) => {
    const app = new AppPage(page)
    await app.goto()
    await use(app)
  },

  openWledUi: async ({ context }, use) => {
    const open = async (ip: string): Promise<Page> => {
      const devicePage = await context.newPage()
      await devicePage.goto(`http://${ip}`, { waitUntil: 'domcontentloaded' })
      return devicePage
    }
    await use(open)
  },

  getWledState: async ({ request }, use) => {
    const get = async (ip: string): Promise<WledState> => {
      const resp = await request.get(`http://${ip}/json/state`)
      return resp.json() as Promise<WledState>
    }
    await use(get)
  },
})

export { expect } from '@playwright/test'
