import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

const base = '/api/v1/semantic-catalog'
async function auth(request: APIRequestContext, persona = 'data-admin') {
  const response = await request.post('/api/v1/auth/dev-session', {data: {persona}})
  expect(response.status()).toBe(200)
  return {Authorization: `Bearer ${(await response.json()).accessToken}`}
}
async function post(request: APIRequestContext, headers: Record<string, string>, route: string, data: object) {
  const response = await request.post(base + route, {headers: {...headers, 'Idempotency-Key': crypto.randomUUID()}, data})
  expect(response.status()).toBe(201)
  return response.json()
}
async function accessible(page: Page, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 1000})
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const result = await new AxeBuilder({page}).analyze()
    expect(result.violations.map(v => ({id: v.id, elements: v.nodes.map(n => n.target)}))).toEqual([])
  }
  await page.setViewportSize({width: 1440, height: 1000})
  mkdirSync('test-results/semantic-screens', {recursive: true})
  await page.screenshot({path: `test-results/semantic-screens/${name}.png`, fullPage: true})
}
test.beforeEach(async ({page}) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
})

test('custom domain → shared measure → two KPI → copy → update only one; keyboard and axe', async ({page, request}) => {
  const headers = await auth(request), suffix = crypto.randomUUID().slice(0, 8)
  const domainName = `Logística ${suffix}`, measureName = `Tiempo ${suffix}`
  await page.goto('/catalogo-semantico')
  await expect(page.getByRole('heading', {name: 'Catálogo semántico', exact: true})).toBeVisible()
  await page.getByRole('link', {name: 'Crear dominio'}).click()
  await page.getByLabel('Nombre', {exact: true}).fill(domainName)
  await accessible(page, '01-domain')
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: domainName, exact: true})).toBeVisible()
  const domainId = page.url().split('/').pop()!
  await page.goto('/catalogo-semantico/components/nuevo')
  await page.getByLabel('Nombre', {exact: true}).fill(measureName)
  await page.getByLabel('Dominio', {exact: true}).selectOption(domainId)
  await page.getByLabel('Tipo', {exact: true}).selectOption('measure')
  await accessible(page, '02-component')
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: measureName, exact: true})).toBeVisible()
  const measureId = page.url().split('/').pop()!
  const other = await post(request, headers, '/kpi-definitions', {name: `Segundo ${suffix}`, domainId, measureIds: [measureId]})
  await page.goto('/catalogo-semantico/kpi-definitions/nuevo')
  await page.getByLabel('Nombre', {exact: true}).fill(`Entrega puntual ${suffix}`)
  await page.getByLabel('Dominio', {exact: true}).selectOption(domainId)
  await page.getByLabel(measureName, {exact: true}).check()
  await page.getByLabel('Fórmula documentada', {exact: true}).fill('Tiempo / entregas — texto, sin ejecutar')
  await accessible(page, '03-kpi')
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: `Entrega puntual ${suffix}`, exact: true})).toBeVisible()
  const firstId = page.url().split('/').pop()!
  await page.goto(`/catalogo-semantico/components/${measureId}`)
  await expect(page.getByText(/Protegida desde su primer uso/)).toBeVisible()
  await expect(page.getByRole('link', {name: 'Editar', exact: true})).toHaveCount(0)
  await page.getByRole('button', {name: 'Crear copia', exact: true}).click()
  await page.getByLabel('Nombre de la copia').fill(`${measureName} ajustado`)
  await accessible(page, '04-copy')
  const dialog = page.getByRole('dialog', {name: 'Crear copia', exact: true})
  await page.keyboard.press('Tab')
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
  await dialog.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: `${measureName} ajustado`, exact: true})).toBeVisible()
  const copyId = page.url().split('/').pop()!
  await page.goto(`/catalogo-semantico/kpi-definitions/${firstId}/editar`)
  await page.getByLabel(measureName, {exact: true}).uncheck()
  await page.getByLabel(`${measureName} ajustado`, {exact: true}).check()
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('heading', {name: `Entrega puntual ${suffix}`, exact: true})).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', {name: `Entrega puntual ${suffix}`, exact: true})).toBeVisible()
  const first = await (await request.get(base + `/kpi-definitions/${firstId}`, {headers})).json()
  const second = await (await request.get(base + `/kpi-definitions/${other.id}`, {headers})).json()
  expect(first.measureIds).toEqual([copyId]); expect(second.measureIds).toEqual([measureId])
})

test('uncertain creation retries one intent and API tenants remain isolated', async ({page, request}) => {
  const headers = await auth(request), other = await auth(request, 'other-data-admin')
  const name = `Incierto ${crypto.randomUUID()}`
  let lost = false
  await page.route('**/api/v1/semantic-catalog/domains', async route => {
    if (route.request().method() === 'POST' && !lost) {lost = true; await route.fetch(); await route.abort('failed')}
    else await route.continue()
  })
  await page.goto('/catalogo-semantico/domains/nuevo')
  await page.getByLabel('Nombre', {exact: true}).fill(name)
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Nombre', {exact: true})).toBeDisabled()
  await page.getByRole('button', {name: 'Reintentar guardado'}).click()
  await expect(page.getByRole('heading', {name, exact: true})).toBeVisible()
  const id = page.url().split('/').pop()!
  const pageData = await (await request.get(base + `/domains?q=${encodeURIComponent(name)}`, {headers})).json()
  expect(pageData.total).toBe(1)
  expect((await request.get(base + `/domains/${id}`, {headers: other})).status()).toBe(404)
  expect((await request.post(base + '/components', {headers: {...other, 'Idempotency-Key': crypto.randomUUID()}, data: {name: 'Invalid', domainId: id, kind: 'measure'}})).status()).toBe(404)
  await page.goto(`/catalogo-semantico/domains/${id}/editar`)
  await page.getByLabel('Nombre', {exact: true}).fill(`${name} local`)
  expect((await request.put(base + `/domains/${id}`, {headers: {...headers, 'If-Match': '"1"'}, data: {name: `${name} remoto`}})).status()).toBe(200)
  await page.getByRole('button', {name: 'Guardar borrador', exact: true}).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Nombre', {exact: true})).toHaveValue(`${name} local`)
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', {name: 'Recargar versión'}).click()
  await expect(page.getByLabel('Nombre', {exact: true})).toHaveValue(`${name} remoto`)
})
