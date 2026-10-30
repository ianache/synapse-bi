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
  await page.getByRole('button', { name: 'Editar dashboard' }).click()
  await page.getByLabel('Fecha inicial').fill('2026-10-01')
  await page.getByLabel('Fecha final').fill('2026-10-03')
  await page.getByRole('button', { name: 'Guardar período' }).click()
  await expect(page.getByText('3,100.00 PEN', { exact: true })).toBeVisible()
  await expect(page.getByText(/Frescura: sin evaluar/i)).toBeVisible()
  await expect(page.getByText(/Linaje: Registros de ventas sintéticos/)).toBeVisible()
  await page.getByLabel('Canal', { exact: true }).selectOption('Digital')
  await expect(page.getByText('1,400.00 PEN', { exact: true })).toBeVisible()
  const desktopCard = await page.locator('.interactive-card').evaluate(el => ({ card: el.getBoundingClientRect().width, container: el.parentElement!.getBoundingClientRect().width }))
  expect(desktopCard.card / desktopCard.container).toBeGreaterThan(0.25)
  expect(desktopCard.card / desktopCard.container).toBeLessThan(0.38)
  const desktopChart = await page.locator('.channel-chart').evaluate(el => ({ chart: el.getBoundingClientRect().width, container: el.parentElement!.getBoundingClientRect().width }))
  expect(desktopChart.chart / desktopChart.container).toBeGreaterThan(0.50)
  expect(desktopChart.chart / desktopChart.container).toBeLessThan(0.65)
  const desktopCardPosition = await page.locator('.interactive-card').evaluate(el => ({ top: el.getBoundingClientRect().top, right: el.getBoundingClientRect().right }))
  const desktopChartPosition = await page.locator('.channel-chart').evaluate(el => ({ top: el.getBoundingClientRect().top, left: el.getBoundingClientRect().left }))
  const desktopLayout = { cardTop: desktopCardPosition.top, cardRight: desktopCardPosition.right, chartTop: desktopChartPosition.top, chartLeft: desktopChartPosition.left }
  expect(Math.abs(desktopLayout.cardTop - desktopLayout.chartTop)).toBeLessThan(2)
  expect(desktopLayout.chartLeft).toBeGreaterThan(desktopLayout.cardRight)
  await page.screenshot({ path: test.info().outputPath('dashboard-active-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Quitar filtro Canal: Digital' })).toBeVisible()
  const mobileCard = await page.locator('.interactive-card').evaluate(el => ({ card: el.getBoundingClientRect().width, container: el.parentElement!.getBoundingClientRect().width }))
  expect(mobileCard.card / mobileCard.container).toBeGreaterThan(0.95)
  const mobileChart = await page.locator('.channel-chart').evaluate(el => ({ chart: el.getBoundingClientRect().width, container: el.parentElement!.getBoundingClientRect().width }))
  expect(mobileChart.chart / mobileChart.container).toBeGreaterThan(0.95)
  const mobileCardBottom = await page.locator('.interactive-card').evaluate(el => el.getBoundingClientRect().bottom)
  const mobileChartTop = await page.locator('.channel-chart').evaluate(el => el.getBoundingClientRect().top)
  const mobileLayout = { cardBottom: mobileCardBottom, chartTop: mobileChartTop }
  expect(mobileLayout.chartTop).toBeGreaterThanOrEqual(mobileLayout.cardBottom)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('dashboard-active-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.getByRole('button', { name: 'Compartir', exact: true }).click()
  await page.getByLabel('Persona').selectOption({ label: 'Lector de ejemplo' })
  await page.getByRole('button', { name: 'Conceder acceso' }).click()
  await expect(page.getByRole('button', { name: 'Retirar acceso a Lector de ejemplo' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('dashboard-management.png'), fullPage: true })
  await page.getByRole('button', { name: 'Retirar acceso a Lector de ejemplo' }).click()
  await expect(page.getByRole('button', { name: 'Retirar acceso a Lector de ejemplo' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Volver al dashboard' }).click()
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

test('keeps the result and displays missing metadata on desktop and mobile', async ({ page }) => {
  // HTTP-boundary fixture: keep the real calculation, omit metadata intentionally.
  await page.route('**/api/v1/queries', async route => {
    const response = await route.fetch()
    const body = await response.json()
    for (const field of ['quality', 'freshness', 'lineage', 'lineageStatus', 'sourceUpdatedAt']) delete body.metadata[field]
    await route.fulfill({response, json: body})
  })
  const session = await page.request.post('/api/v1/auth/dev-session', {data: {persona: 'analyst'}})
  const headers = {Authorization: `Bearer ${(await session.json()).accessToken}`}
  const created = await page.request.post('/api/v1/dashboards', {headers, data: {name: `Metadata ausente ${Date.now()}`}})
  expect(created.status()).toBe(201)
  const dashboard = await created.json()
  const added = await page.request.put(`/api/v1/dashboards/${dashboard.id}/widgets/kpi_fin_net_revenue`, {
    headers: {...headers, 'If-Match': `"${dashboard.version}"`},
    data: {kpiId: 'kpi_fin_net_revenue', modelVersion: 1},
  })
  expect(added.status()).toBe(200)
  const updated = await added.json()
  const configured = await page.request.put(`/api/v1/dashboards/${dashboard.id}/initial-period`, {
    headers: {...headers, 'If-Match': `"${updated.version}"`},
    data: {startDate: '2026-10-01', endDate: '2026-10-03'},
  })
  expect(configured.status()).toBe(200)
  await page.goto(`/dashboards/${dashboard.id}`)
  await expect(page.getByText('3,100.00 PEN', {exact: true})).toBeVisible()
  await expect(page.getByText(/Calidad: No disponible/)).toBeVisible()
  await expect(page.getByText(/Frescura: No disponible/)).toBeVisible()
  await expect(page.getByText('Linaje: No disponible')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
  await page.screenshot({path: test.info().outputPath('missing-metadata-desktop.png'), fullPage: true})
  await page.setViewportSize({width: 390, height: 844})
  await expect(page.getByText('Linaje: No disponible')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({path: test.info().outputPath('missing-metadata-mobile.png'), fullPage: true})
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
