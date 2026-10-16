import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/datasets-integration', workers: 1, timeout: 120000,
  use: { baseURL: 'http://127.0.0.1:5182', ...devices['Desktop Chrome'], trace: 'off',
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } } : {}) },
  webServer: [
    { command: '".venv\\Scripts\\python.exe" -m uvicorn synapse_api.main:app --host 127.0.0.1 --port 8002', cwd: './backend', url: 'http://127.0.0.1:8002/health', timeout: 180000, reuseExistingServer: process.env.BI_DATASET_REUSE_SERVERS === 'true',
      env: { BI_ENVIRONMENT: 'development', BI_AUTH_MODE: 'development', BI_SEED_DEMO: 'true', BI_DATABASE_PATH: 'data/dataset-browser-tests.db', BI_ALLOWED_ORIGINS: 'http://127.0.0.1:5182' } },
    { command: 'npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port 5182 --strictPort', url: 'http://127.0.0.1:5182', timeout: 180000, reuseExistingServer: process.env.BI_DATASET_REUSE_SERVERS === 'true',
      env: { VITE_DATA_SOURCE: 'api', VITE_API_AUTH: 'development', BI_API_PROXY_TARGET: 'http://127.0.0.1:8002' } },
  ],
})
