import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'

// Defaults are local-only. Use a worktree explicitly through BI_CODEBASE_DIR.
const codebase = path.resolve(process.env.BI_CODEBASE_DIR ?? path.join(__dirname, '../../codebase'))
const apiPort = process.env.BI_TEST_API_PORT ?? '8067'
const uiPort = process.env.BI_TEST_UI_PORT ?? '5267'
const python = process.env.BI_TEST_PYTHON ?? 'python'
const database = path.join(os.tmpdir(), `bi-functional-${randomUUID()}.db`)
const apiUrl = `http://127.0.0.1:${apiPort}`
const uiUrl = `http://127.0.0.1:${uiPort}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: uiUrl,
    trace: 'off',
    screenshot: 'only-on-failure',
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } } : {}),
  },
  webServer: [
    {
      command: `"${python}" -m uvicorn synapse_api.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: path.join(codebase, 'backend'),
      url: `${apiUrl}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { BI_ENVIRONMENT: 'development', BI_AUTH_MODE: 'development', BI_SEED_DEMO: 'true', BI_DATABASE_PATH: database, BI_ALLOWED_ORIGINS: uiUrl },
    },
    {
      command: `npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port ${uiPort} --strictPort`,
      cwd: codebase,
      url: uiUrl,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_DATA_SOURCE: 'api', VITE_API_AUTH: 'development', BI_API_PROXY_TARGET: apiUrl },
    },
  ],
})
