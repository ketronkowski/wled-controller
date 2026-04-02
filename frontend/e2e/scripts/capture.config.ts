/**
 * Minimal Playwright config for running the capture-wled-reference script.
 * Run with:
 *   cd frontend
 *   npx playwright test --config e2e/scripts/capture.config.ts
 */
import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: path.resolve(import.meta.dirname, '.'),
  testMatch: 'capture-wled-reference.ts',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [['line']],

  use: {
    baseURL: 'http://192.168.5.51',
    ...devices['Desktop Chrome'],
  },
})
