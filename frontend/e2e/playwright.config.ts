import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(import.meta.dirname, '.env.test') })

export default defineConfig({
  testDir: './tests',
  outputDir: path.resolve(import.meta.dirname, 'test-results'),
  workers: 1,          // live devices — must run fully serial to avoid concurrent device access
  fullyParallel: false,
  retries: 1,          // one retry for flaky network conditions
  reporter: [['html', { outputFolder: path.resolve(import.meta.dirname, 'playwright-report') }], ['line']],

  timeout: 90_000,   // live-device tests can take a while; groups test adds 3 members serially

  use: {
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'local-dev',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
      },
    },
    {
      name: 'local-docker',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.DOCKER_URL ?? 'http://localhost:3000',
      },
    },
    {
      name: 'homelab',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.HOMELAB_URL,
      },
    },
  ],

  // Auto-start Vite dev server when using the local-dev project.
  // Set PW_NO_SERVER=1 to skip (e.g., when the server is already running).
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        cwd: path.resolve(import.meta.dirname, '..'),
      },
})
