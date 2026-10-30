import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

async function makeDashboard(page: Page, name: string, kpis: string[]) {
  const session = await page.request.post('/api/v1/auth/dev-session', { data: { persona: 'analyst' } })
  expect(session.status()).toBe(200)
  const headers = { Authorization: `Bearer ${(await session.json()).accessToken}` }
  const created = await page.request.post('/api/v1/dashboards', { headers, data: { name: `${name} ${Date.now()}` } })
  expect(created.status()).toBe(201)
  let dashboard = await created.json()
  for (const kpi of kpis) {
    const response = await page.request.put(`/api/v1/dashboards/${dashboard.id}/widgets/${kpi}`, { headers: { ...headers, 'If-Match': `"${dashboard.version}"` }, data: { kpiId: kpi, modelVersion: 1 } })
    expect(response.status()).toBe(200)
    dashboard = await response.json()
  }
  const configured = await page.request.put(`/api/v1/dashboards/${dashboard.id}/initial-period`, { headers: { ...headers, 'If-Match': `"${dashboard.version}"` }, data: { startDate: '2026-11-01', endDate: '2026-11-02' } })
  expect(configured.status()).toBe(200)
  return await configured.json()
}

test('renders empty and partial error states, keeps other results and retries', async ({ page }) => {
  const dashboard = await makeDashboard(page, 'Estados de prueba', ['kpi_fin_net_revenue', 'kpi_op_gross_margin'])
  let fail = true
  await page.route('**/api/v1/queries', async route => {
    const body = route.request().postDataJSON()
    if (fail && body.kpiId === 'kpi_op_gross_margin' && !body.groupBy) {
      await route.fulfill({ status: 503, json: { error: { code: 'test_unavailable', message: 'Consulta temporalmente no disponible' } } })
    } else await route.continue()
  })
  await page.goto(`/dashboards/${dashboard.id}`)
  await expect(page.getByText('Sin datos para este período').first()).toBeVisible()
  await expect(page.getByText('No se pudo cargar')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Consulta temporalmente no disponible')
  await page.screenshot({ path: test.info().outputPath('dashboard-empty-partial-error.png'), fullPage: true })
  fail = false
  await page.getByRole('button', { name: 'Reintentar consulta' }).click()
  await expect(page.getByText('No se pudo cargar')).toHaveCount(0)
  await expect(page.getByText('Sin datos para este período')).toHaveCount(3)
})

test('shows a generic guest empty state and an unavailable dashboard', async ({ page }) => {
  const dashboard = await makeDashboard(page, 'Invitado de prueba', ['kpi_fin_net_revenue'])
  // HTTP-boundary fixture emulates an authorized reader whose catalog scope
  // has been removed; backend isolation is exercised by test_dashboard_sharing.
  await page.route('**/api/v1/kpis?**', route => route.fulfill({ status: 403, json: { error: { code: 'permission_denied', message: 'No tienes permiso.' } } }))
  await page.route('**/api/v1/dashboards?**', async route => {
    const response = await route.fetch()
    const body = await response.json()
    body.items = body.items.map((item: { id: string }) => item.id === dashboard.id ? { ...item, editable: false, kpiIds: [], modelVersions: {}, visualizations: 0 } : item)
    await route.fulfill({ response, json: body })
  })
  await page.goto(`/dashboards/${dashboard.id}`)
  await expect(page.getByRole('heading', { name: 'No hay indicadores disponibles' })).toBeVisible()
  await expect(page.getByText('kpi_fin_net_revenue')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('dashboard-guest-no-kpis.png'), fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.goto('/dashboards/no-disponible-de-prueba')
  await expect(page.getByRole('heading', { name: 'No se puede acceder a este dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Volver a dashboards' })).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('dashboard-access-unavailable.png'), fullPage: true })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
