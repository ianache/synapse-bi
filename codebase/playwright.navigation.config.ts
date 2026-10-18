import {defineConfig, devices} from '@playwright/test'
const port = process.env.BI_NAV_UI_PORT ?? '5197'
export default defineConfig({
  testDir: './tests/navigation', outputDir: './test-results-navigation', workers: 1, timeout: 240000,
  use: {...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${port}`, viewport: {width:1440,height:1000}, trace:'retain-on-failure',
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {launchOptions:{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}} : {})},
  webServer: {command:`npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port ${port} --strictPort`,
    url:`http://127.0.0.1:${port}`, reuseExistingServer:false, timeout:180000,
    env:{VITE_DATA_SOURCE:'fixture',VITE_API_AUTH:'development',BI_API_PROXY_TARGET:'http://127.0.0.1:1'}},
})

