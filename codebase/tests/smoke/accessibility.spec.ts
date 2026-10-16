import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

test('dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
