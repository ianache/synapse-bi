import {defineConfig, devices} from '@playwright/test'
import {randomUUID} from 'node:crypto'

const apiPort = process.env.BI_MODELS_API_PORT ?? '8010', uiPort = process.env.BI_MODELS_UI_PORT ?? '5190'
export default defineConfig({
  testDir: './tests/semantic-models-integration', outputDir: './test-results-models', workers: 1, timeout: 180000,
  use: {baseURL: `http://127.0.0.1:${uiPort}`, ...devices['Desktop Chrome'], trace: 'off',
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {launchOptions: {executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH}} : {})},
  webServer: [
    {command: `".venv\\Scripts\\python.exe" -m uvicorn synapse_api.main:app --host 127.0.0.1 --port ${apiPort}`, cwd: './backend', url: `http://127.0.0.1:${apiPort}/health`, reuseExistingServer: false, timeout: 180000,
      env: {BI_ENVIRONMENT: 'development', BI_AUTH_MODE: 'development', BI_SEED_DEMO: 'true', BI_DATABASE_PATH: `data/models-e2e-${randomUUID()}.db`, BI_ALLOWED_ORIGINS: `http://127.0.0.1:${uiPort}`}},
    {command: `npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port ${uiPort} --strictPort`, url: `http://127.0.0.1:${uiPort}`, reuseExistingServer: false, timeout: 180000,
      env: {VITE_DATA_SOURCE: 'api', VITE_API_AUTH: 'development', BI_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`}},
  ],
})
