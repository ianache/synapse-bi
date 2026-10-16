import { test, expect } from '@playwright/test'

test('navigates dashboard and shows principal analysis content', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible()
  await expect(page.getByText('Revenue')).toBeVisible()
  await page.getByRole('textbox', { name: 'Search dashboard' }).fill('missing')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText('No results')).toBeVisible()
})
