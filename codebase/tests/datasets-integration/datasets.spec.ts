import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

async function auth(request: APIRequestContext, persona = 'data-admin') {
  const response = await request.post('/api/v1/auth/dev-session', { data: { persona } })
  expect(response.status()).toBe(200)
  return { Authorization: `Bearer ${(await response.json()).accessToken}` }
}
async function observedSource(request: APIRequestContext) {
  const headers = await auth(request)
  // Runtime fixture only; no traces, screenshots or console for credentials.
  const password = readFileSync(path.resolve('case-study/.docker-secrets/reader_global_password.txt'), 'utf8').trim()
  const connection = { host: '127.0.0.1', port: 55432, database: 'bi_analytics', username: 'bi_reader_global', tlsMode: 'disable', laboratory: true, schemas: ['gold'], password }
  const probe = await request.post('/api/v1/sources/test', { headers, data: connection })
  expect(probe.status()).toBe(200)
  const saved = await request.post('/api/v1/sources', { headers, data: { ...connection, name: `Dataset E2E ${crypto.randomUUID()}`, description: '', testId: (await probe.json()).testId } })
  expect(saved.status()).toBe(201)
  const source = await saved.json()
  const observed = await request.post(`/api/v1/sources/${source.id}/observations`, { headers })
  expect(observed.status()).toBe(201)
  const observation = await observed.json()
  expect([observation.tables, observation.views]).toEqual([12, 4])
  const sales = observation.snapshot.objects.find((o: { name: string }) => o.name === 'fact_sales')
  expect(sales.columns).toHaveLength(16)
  expect(sales.constraints.filter((c: { kind: string }) => c.kind === 'f')).toHaveLength(6)
  return { headers, source, observation, origin: { sourceId: source.id, observationId: observation.id, schema: 'gold', object: 'fact_sales' } }
}
async function accessible(page: Page, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const result = await new AxeBuilder({ page }).analyze()
    expect(result.violations.map(v => ({ id: v.id, elements: v.nodes.map(n => n.target) }))).toEqual([])
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  const folder = path.resolve('test-results/dataset-screens')
  mkdirSync(folder, { recursive: true })
  await page.screenshot({ path: path.join(folder, `${name}.png`), fullPage: true })
}
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
})

test('observed source → incomplete draft → fresh context → register → edit conflict; accessible four views', async ({ page, request, browser }) => {
  const fixture = await observedSource(request)
  const before = await (await request.get('/api/v1/kpis', { headers: fixture.headers })).json()
  await page.goto(`/fuentes/${fixture.source.id}/esquema/${fixture.observation.id}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: 'Registrar dataset', exact: true }).click()
  await page.getByLabel('Seleccionar columna tenant_id', { exact: true }).check()
  await page.getByLabel('Seleccionar columna sale_amount', { exact: true }).check()
  await accessible(page, '01-origin')
  await page.getByRole('button', { name: 'Continuar a metadatos' }).click()
  const name = `Ventas ${crypto.randomUUID()}`
  await page.getByLabel('Nombre del dataset', { exact: true }).fill(name)
  await accessible(page, '02-metadata')
  // Commit creation, lose its response, retry exact request with retained key.
  let lost = false
  await page.route('**/api/v1/datasets', async route => {
    if (route.request().method() === 'POST' && !lost) { lost = true; await route.fetch(); await route.abort('failed') }
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  const url = page.url()
  const id = url.split('/').pop()!
  const filtered = await (await request.get(`/api/v1/datasets?q=${encodeURIComponent(name)}`, { headers: fixture.headers })).json()
  expect(filtered.total).toBe(1)
  expect(filtered.items[0].registrationStatus).toBe('draft')
  await accessible(page, '03-detail')
  await page.getByRole('tab', { name: 'Columnas seleccionadas' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Linaje declarado' })).toBeFocused()
  const fresh = await browser.newContext()
  const otherPage = await fresh.newPage()
  await otherPage.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  await otherPage.goto(url, { waitUntil: 'domcontentloaded' })
  await expect(otherPage.getByRole('heading', { name, exact: true })).toBeVisible()
  await fresh.close()
  await page.getByRole('link', { name: 'Editar metadatos' }).click()
  await page.getByRole('button', { name: 'Continuar a metadatos' }).click()
  await page.getByLabel('Responsable declarado', { exact: true }).fill('Equipo Comercial')
  await page.getByLabel('Clasificación declarada', { exact: true }).fill('Interna')
  await page.getByLabel('Expectativa de frescura', { exact: true }).fill('Diaria declarada')
  await accessible(page, '04-edit')
  await page.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByText('Registrado · Metadatos completos', { exact: true })).toBeVisible()
  const current = await (await request.get(`/api/v1/datasets/${id}`, { headers: fixture.headers })).json()
  expect(current.governance.owner).toBe('Equipo Comercial')
  await page.getByRole('link', { name: 'Editar metadatos' }).click()
  await page.getByRole('button', { name: 'Continuar a metadatos' }).click()
  await page.getByLabel('Nombre del dataset').fill(`${name} local`)
  const body = { name, description: '', kind: 'direct', saveAs: 'registered', origin: fixture.origin, selectedColumns: ['tenant_id', 'sale_amount'], governance: current.governance, preparation: null, medallion: null }
  expect((await request.put(`/api/v1/datasets/${id}`, { headers: { ...fixture.headers, 'If-Match': `"${current.version}"` }, data: body })).status()).toBe(200)
  await page.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByRole('alert')).toContainText('Tus cambios locales se conservan')
  await expect(page.getByLabel('Nombre del dataset')).toHaveValue(`${name} local`)
  await page.getByRole('link', { name: 'Datasets', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tus datasets, con contexto' })).toBeVisible()
  await accessible(page, '05-catalog')
  await page.getByLabel('Buscar dataset').fill('definitely-no-matches-999999')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sin coincidencias' })).toBeVisible()
  const after = await (await request.get('/api/v1/kpis', { headers: fixture.headers })).json()
  expect(after).toEqual(before)
  const snapshot = await (await request.get(`/api/v1/sources/${fixture.source.id}/observations/${fixture.observation.id}`, { headers: fixture.headers })).json()
  expect(snapshot).toEqual(fixture.observation)
})

test('prepared Medallion registration requires explicit process, input and five declarations', async ({ page, request }) => {
  const fixture = await observedSource(request)
  await page.goto(`/datasets/nuevo?${new URLSearchParams(fixture.origin)}`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Tipo de dataset').selectOption('prepared')
  await page.getByLabel('Seleccionar columna tenant_id', { exact: true }).check()
  await page.getByRole('button', { name: 'Continuar a metadatos' }).click()
  const name = `Preparado ${crypto.randomUUID()}`
  await page.getByLabel('Nombre del dataset').fill(name)
  for (const label of ['Responsable declarado', 'Clasificación declarada', 'Expectativa de frescura']) await page.getByLabel(label, { exact: true }).fill('Declarado')
  await expect(page.getByRole('button', { name: 'Registrar dataset', exact: true })).toBeDisabled()
  await page.getByLabel('Referencia del proceso', { exact: true }).fill('Job externo existente')
  await page.getByLabel('Entrada · Fuente').selectOption(fixture.source.id)
  await page.getByLabel('Entrada · Observación').selectOption(fixture.observation.id)
  await page.getByLabel('Entrada · Objeto').selectOption(JSON.stringify(['gold', 'dim_date']))
  await page.getByRole('button', { name: 'Añadir input observado' }).click()
  await page.getByLabel('Declarar alcance Medallion').check()
  await expect(page.getByRole('button', { name: 'Registrar dataset', exact: true })).toBeDisabled()
  for (const label of ['Descripción del esquema', 'Política de particiones', 'Política de retención', 'Calidad mínima declarada', 'Política de tenant']) await page.getByLabel(label, { exact: true }).fill('Declarado, no evaluado')
  await page.getByRole('button', { name: 'Registrar dataset', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Medallion declarado' })).toBeVisible()
})

test('invalid selection, missing governance, immutable origin and cross-tenant references are rejected', async ({ request }) => {
  const fixture = await observedSource(request)
  const body = { name: `Safety ${crypto.randomUUID()}`, description: '', kind: 'direct', saveAs: 'draft', origin: fixture.origin, selectedColumns: ['tenant_id'], governance: {}, preparation: null, medallion: null }
  const headers = { ...fixture.headers, 'Idempotency-Key': crypto.randomUUID() }
  expect((await request.post('/api/v1/datasets', { headers, data: { ...body, selectedColumns: ['missing'] } })).status()).toBe(422)
  expect((await request.post('/api/v1/datasets', { headers, data: { ...body, saveAs: 'registered' } })).status()).toBe(422)
  const created = await request.post('/api/v1/datasets', { headers, data: body })
  expect(created.status()).toBe(201)
  const dataset = await created.json()
  const foreign = await auth(request, 'other-data-admin')
  expect((await request.get(`/api/v1/datasets/${dataset.id}`, { headers: foreign })).status()).toBe(404)
  expect((await request.post('/api/v1/datasets', { headers: { ...foreign, 'Idempotency-Key': crypto.randomUUID() }, data: body })).status()).toBe(404)
  expect((await request.put(`/api/v1/datasets/${dataset.id}`, { headers: { ...fixture.headers, 'If-Match': '"1"' }, data: { ...body, kind: 'prepared' } })).status()).toBe(409)
})
