import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

test('creates a dashboard, queries the Python API and survives a new browser session', async ({ page, browser }) => {
  const name = `Ventas API ${Date.now()}`
  await page.goto('/explorar')
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toBeVisible()
  await page.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }).click()
  await page.getByRole('button', { name: 'Crear dashboard', exact: true }).click()
  await page.getByLabel('Nombre del dashboard').fill(name)
  await page.getByRole('button', { name: 'Crear y seleccionar' }).click()
  await expect(page.getByRole('radio', { name: new RegExp(name) })).toBeChecked()
  await page.getByRole('button', { name: 'Añadir KPI', exact: true }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(page.getByText('3,100.00 PEN', { exact: true })).toBeVisible()
  await page.getByLabel('Canal', { exact: true }).selectOption('Digital')
  await expect(page.getByText('1,400.00 PEN', { exact: true })).toBeVisible()
  const path = new URL(page.url()).pathname
  const context = await browser.newContext()
  try {
    const fresh = await context.newPage()
    await fresh.goto(`${new URL(page.url()).origin}${path}`)
    await expect(fresh.getByRole('heading', { name })).toBeVisible()
    await expect(fresh.getByText('3,100.00 PEN', { exact: true })).toBeVisible()
    expect(await fresh.evaluate(() => localStorage.getItem('synapse-bi.demo-dashboards.v1'))).toBeNull()
    expect((await new AxeBuilder({ page: fresh }).analyze()).violations).toEqual([])
    await fresh.screenshot({ path: test.info().outputPath('dashboard-python-api.png'), fullPage: true })
  } finally { await context.close() }
})

test('shows the backend error without silently replacing it with fixtures', async ({ page }) => {
  await page.route('**/api/v1/kpis?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Catálogo temporalmente no disponible' } }) }))
  await page.goto('/explorar')
  await expect(page.getByRole('alert')).toHaveText('Catálogo temporalmente no disponible')
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toHaveCount(0)
  await page.unroute('**/api/v1/kpis?**')
  await page.getByRole('button', { name: 'Actualizar datos' }).click()
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toBeVisible()
})

test('uses the API definition and allowed dimensions in KPI details', async ({ page }) => {
  await page.goto('/explorar')
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Tasa de conversión' }) })
  await card.getByRole('button', { name: 'Ver detalle', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Detalle de Tasa de conversión' })
  await expect(dialog.getByText('channel', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Modelo de desarrollo con datos sintéticos. Calidad y frescura sin evaluar.')).toBeVisible()
  await expect(dialog.getByText(/Registros de ventas sintéticos → Modelo de ventas de ejemplo v1/)).toBeVisible()
})
