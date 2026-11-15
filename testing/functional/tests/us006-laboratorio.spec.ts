import { expect, test } from '@playwright/test'

// These flows use a seeded development backend and a unique temporary SQLite database.
test('R01 laboratorio: carga el catálogo mediante una sesión local', async ({ page }) => {
  await page.goto('/explorar')
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toBeVisible()
})

test('R02 y R15: crea un dashboard, guarda el período y filtra por canal', async ({ page }) => {
  const name = `Prueba funcional ${Date.now()}`
  await page.goto('/explorar')
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
  await page.getByLabel('Canal', { exact: true }).selectOption('Digital')
  await expect(page.getByText('1,400.00 PEN', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(page.getByText('3,100.00 PEN', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(page.getByText('3,100.00 PEN', { exact: true })).toBeVisible()
})

test('API: rechaza lectura de dashboards sin sesión', async ({ request }) => {
  const response = await request.get('/api/v1/dashboards')
  expect(response.status()).toBe(401)
})

test('R16: el catálogo se adapta al ancho móvil sin desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/explorar')
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
