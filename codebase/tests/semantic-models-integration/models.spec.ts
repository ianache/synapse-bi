import {test, expect, type APIRequestContext, type Page} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {mkdirSync} from 'node:fs'

const base = '/api/v1/semantic-models', catalog = '/api/v1/semantic-catalog'
async function auth(request: APIRequestContext, persona = 'data-admin') {
  const response = await request.post('/api/v1/auth/dev-session', {data: {persona}})
  expect(response.status()).toBe(200)
  return {Authorization: `Bearer ${(await response.json()).accessToken}`}
}
async function post(request: APIRequestContext, headers: Record<string, string>, route: string, data: object) {
  const response = await request.post(route, {headers: {...headers, 'Idempotency-Key': crypto.randomUUID()}, data})
  expect(response.status()).toBe(201)
  return response.json()
}
async function seed(request: APIRequestContext) {
  const headers = await auth(request), suffix = crypto.randomUUID().slice(0, 8)
  const domain = await post(request, headers, catalog + '/domains', {name: `Operaciones ${suffix}`})
  const dimension = await post(request, headers, catalog + '/components', {name: 'Canal operativo', kind: 'dimension', domainId: domain.id})
  const measure = await post(request, headers, catalog + '/components', {name: 'Tiempo total', kind: 'measure', domainId: domain.id})
  const count = await post(request, headers, catalog + '/components', {name: 'Cantidad entregas', kind: 'measure', domainId: domain.id})
  const body = {name: 'Tiempo por entrega', domainId: domain.id, formula: 'Tiempo total / Cantidad entregas', definition: 'Definición inicial', dimensionIds: [dimension.id], measureIds: [measure.id, count.id]}
  const kpi = await post(request, headers, catalog + '/kpi-definitions', body)
  const second = await post(request, headers, catalog + '/kpi-definitions', {name: 'Tiempo acumulado', domainId: domain.id, formula: 'Tiempo total', dimensionIds: [dimension.id], measureIds: [measure.id]})
  return {headers, domain, kpi, second, body, name: `Modelo operativo ${suffix}`}
}
async function evidence(page: Page, name: string) {
  mkdirSync('test-results-models/model-screens', {recursive: true})
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 1000})
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const result = await new AxeBuilder({page}).analyze()
    expect(result.violations.map(v => ({id: v.id, elements: v.nodes.map(n => n.target)}))).toEqual([])
    await page.evaluate(() => {if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0)})
    await page.screenshot({path: `test-results-models/model-screens/${name}${width === 390 ? '-mobile' : ''}.png`, fullPage: true})
  }
  await page.setViewportSize({width: 1440, height: 1000})
}
test.beforeEach(async ({page}) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
})

test('Stitch flow: lost creation response, stable capture, clone, explicit update and history; axe desktop/mobile', async ({page, request}) => {
  const s = await seed(request)
  const before = await (await request.get('/api/v1/kpis', {headers: s.headers})).json()
  await page.goto('/modelos-semanticos')
  await expect(page.getByRole('heading', {name: 'Modelos semánticos', exact: true})).toBeVisible()
  await evidence(page, '01-list')
  await page.getByRole('link', {name: 'Crear modelo', exact: true}).first().click()
  await page.getByLabel('Nombre del modelo', {exact: true}).fill(s.name)
  await page.getByRole('combobox', {name: 'Dominio de negocio', exact: true}).selectOption(s.domain.id)
  await page.getByLabel('Incluir KPI Tiempo por entrega').check()
  await page.getByLabel('Incluir KPI Tiempo acumulado').check()
  await expect(page.getByRole('complementary', {name: 'Resumen de la captura'})).toContainText('2 medidas únicas')
  await expect(page.getByRole('complementary', {name: 'Resumen de la captura'})).toContainText('1 dimensiones únicas')
  await evidence(page, '02-create')
  let lost = false
  await page.route('**/api/v1/semantic-models', async route => {
    if (route.request().method() === 'POST' && !lost) {lost = true; await route.fetch(); await route.abort('failed')}
    else await route.continue()
  })
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: s.name, exact: true})).toBeVisible()
  const parts = new URL(page.url()).pathname.split('/').filter(Boolean), modelId = parts[1], firstId = parts[3]
  const models = await (await request.get(base + '?q=' + encodeURIComponent(s.name), {headers: s.headers})).json()
  expect(models.total).toBe(1)
  await expect(page.getByText('Cambios del catálogo: no comprobados', {exact: true})).toBeVisible()
  await evidence(page, '03-detail')
  await page.getByRole('button', {name: 'Preparar nueva versión', exact: true}).click()
  await expect(page).not.toHaveURL(new RegExp(firstId + '$'))
  await expect(page.getByRole('heading', {name: s.name, exact: true})).toBeVisible()
  const secondId = new URL(page.url()).pathname.split('/').pop()!
  const changed = await request.put(catalog + '/kpi-definitions/' + s.kpi.id, {headers: {...s.headers, 'If-Match': '"1"'}, data: {...s.body, definition: 'Definición revisada'}})
  expect(changed.status()).toBe(200)
  await page.reload()
  await expect(page.getByText('Definición inicial', {exact: true})).toBeVisible()
  await page.getByRole('link', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await page.getByRole('button', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await expect(page.getByText('Definición revisada', {exact: true})).toBeVisible()
  await expect(page.getByLabel('He revisado los cambios de esta captura')).not.toBeChecked()
  await evidence(page, '04-compare')
  await page.getByRole('link', {name: 'Cancelar y conservar captura', exact: true}).click()
  await expect(page.getByText('Definición inicial', {exact: true})).toBeVisible()
  await page.getByRole('link', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await page.getByRole('button', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await page.getByLabel('He revisado los cambios de esta captura').check()
  await page.getByRole('button', {name: 'Confirmar actualización de borrador', exact: true}).click()
  await expect(page.getByText('Definición revisada', {exact: true})).toBeVisible()
  const original = await (await request.get(`${base}/${modelId}/drafts/${firstId}`, {headers: s.headers})).json()
  expect(original.capture.kpis.find((k: {id: string}) => k.id === s.kpi.id).definition).toBe('Definición inicial')
  await page.getByRole('tab', {name: 'Contenido capturado', exact: true}).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', {name: 'Historial de versiones', exact: true})).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('link', {name: 'Abrir borrador 1', exact: true})).toBeVisible()
  await evidence(page, '05-history')
  await page.getByRole('link', {name: 'Comparar con este borrador', exact: true}).click()
  await page.getByRole('button', {name: 'Comparar versiones guardadas', exact: true}).click()
  await expect(page.getByText('Definición revisada', {exact: true})).toBeVisible()
  expect((await request.get(`${base}/${modelId}`, {headers: await auth(request, 'other-data-admin')})).status()).toBe(404)
  const after = await (await request.get('/api/v1/kpis', {headers: s.headers})).json()
  expect(after).toEqual(before)
  expect((await request.get(`${base}/${modelId}/drafts/${secondId}`, {headers: s.headers})).status()).toBe(200)
})

test('catalog drift and stale revision are rejected and can be explicitly recovered', async ({page, request}) => {
  const s = await seed(request)
  const created = await post(request, s.headers, base, {name: s.name, domainId: s.domain.id, kpiIds: [s.kpi.id]})
  const url = `/modelos-semanticos/${created.model.id}/borradores/${created.draft.id}/comparar`
  const api = `${base}/${created.model.id}/drafts/${created.draft.id}`
  await page.goto(url)
  await page.getByRole('button', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await page.getByLabel('He revisado los cambios de esta captura').check()
  expect((await request.put(catalog + '/kpi-definitions/' + s.kpi.id, {headers: {...s.headers, 'If-Match': '"1"'}, data: {...s.body, definition: 'Cambio concurrente'}})).status()).toBe(200)
  await page.getByRole('button', {name: 'Confirmar actualización de borrador', exact: true}).click()
  await expect(page.getByRole('alert')).toContainText('El catálogo cambió')
  await expect(page.getByRole('button', {name: 'Confirmar actualización de borrador', exact: true})).toBeDisabled()
  await page.getByRole('button', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await page.getByLabel('He revisado los cambios de esta captura').check()
  const preview = await (await request.post(api + '/preview', {headers: {...s.headers, 'If-Match': '"1"'}, data: {kpiIds: [s.kpi.id]}})).json()
  expect((await request.put(api, {headers: {...s.headers, 'If-Match': '"1"'}, data: {kpiIds: [s.kpi.id], candidateDigest: preview.candidateDigest}})).status()).toBe(200)
  await page.getByRole('button', {name: 'Confirmar actualización de borrador', exact: true}).click()
  await expect(page.getByRole('alert')).toContainText('La versión cambió')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', {name: 'Recargar versión actual', exact: true}).click()
  await page.getByRole('button', {name: 'Comprobar cambios del catálogo', exact: true}).click()
  await expect(page.getByText('Sin diferencias en el contenido comparado.', {exact: true})).toBeVisible()
})

test('read permissions are checked before requesting model captures', async ({page}) => {
  let modelReads = 0
  page.on('request', request => {if (request.url().includes('/api/v1/semantic-models')) modelReads++})
  await page.route('**/api/v1/me', route => route.fulfill({json: {scopes: []}}))
  await page.goto('/modelos-semanticos')
  await expect(page.getByRole('alert')).toContainText('No tienes permiso')
  expect(modelReads).toBe(0)
})
