import { defineConfig, devices } from '@playwright/test'

const target = new URL(process.env.BI_OIDC_BASE_URL ?? 'http://127.0.0.1:5173')
if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) {
  throw new Error('Las pruebas OIDC de laboratorio solo admiten una aplicación HTTP local.')
}
export default defineConfig({
  testDir: './oidc',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-oidc', open: 'never' }]],
  use: { ...devices['Desktop Chrome'], baseURL: target.origin, trace: 'off', screenshot: 'off', video: 'off' },
})
