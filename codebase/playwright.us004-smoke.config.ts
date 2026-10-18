import {defineConfig} from '@playwright/test'
import smoke from './playwright.config'

// Keep the user's existing 4173 server untouched; exercise this worktree's fixtures.
export default defineConfig({
  ...smoke, workers: 1, outputDir: './test-results-models-smoke',
  use: {...smoke.use, baseURL: 'http://127.0.0.1:5193'},
  webServer: {command: 'npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port 5193 --strictPort',
    url: 'http://127.0.0.1:5193', reuseExistingServer: false, timeout: 120000,
    env: {VITE_DATA_SOURCE: 'fixture'}},
})
