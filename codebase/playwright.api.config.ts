import { defineConfig, devices } from '@playwright/test'
const apiPort = process.env.BI_API_TEST_API_PORT ?? '8000'
const uiPort = process.env.BI_API_TEST_UI_PORT ?? '5180'

export default defineConfig({
  testDir: './tests/api-integration',
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${uiPort}`,
    ...devices['Desktop Chrome'],
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } } : {}),
  },
  webServer: [
    {
      command: `".venv\\Scripts\\python.exe" -m uvicorn synapse_api.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: './backend',
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      env: { BI_ENVIRONMENT: 'development', BI_AUTH_MODE: 'development', BI_SEED_DEMO: 'true', BI_DATABASE_PATH: 'data/browser-tests.db', BI_ALLOWED_ORIGINS: `http://127.0.0.1:${uiPort}` },
    },
    {
      command: `npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port ${uiPort} --strictPort`,
      url: `http://127.0.0.1:${uiPort}`,
      reuseExistingServer: !process.env.CI,
      env: { VITE_DATA_SOURCE: 'api', VITE_API_AUTH: 'development', BI_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
    },
  ],
})
