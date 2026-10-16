import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

test('discovers a KPI, adds it, reloads, and supports browser history', async ({ page }) => {
  await page.goto('/explorar')
  await page.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }).click()
  await expect(page.getByRole('heading', { name: 'Añadir KPI al dashboard' })).toBeVisible()
  await page.getByRole('radio', { name: /Resumen financiero mensual/ }).check()
  await page.getByRole('button', { name: 'Añadir KPI', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('KPI añadido')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ingresos netos', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('radio', { name: /Resumen financiero mensual/ })).toBeDisabled()
})

test('creates a personal dashboard from the destination screen', async ({ page }) => {
  await page.goto('/kpi/kpi_fin_net_revenue/agregar')
  await page.getByRole('button', { name: 'Crear dashboard', exact: true }).click()
  await page.getByLabel('Nombre del dashboard').fill('Análisis comercial')
  await page.getByRole('button', { name: 'Crear y seleccionar' }).click()
  await expect(page.getByRole('radio', { name: /Análisis comercial/ })).toBeChecked()
  await page.getByRole('button', { name: 'Añadir KPI', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Análisis comercial' })).toBeVisible()
})

test('KPI details dialog restores focus when dismissed by keyboard', async ({ page }) => {
  await page.goto('/explorar')
  await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click()
  await expect(page.getByRole('dialog', { name: 'Detalle de Ingresos netos' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ver detalle', exact: true }).first()).toBeFocused()
})

for (const path of ['/explorar', '/kpi/kpi_fin_net_revenue/agregar']) {
  test(`accessible and responsive: ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const mobileResults = await new AxeBuilder({ page }).analyze()
    expect(mobileResults.violations).toEqual([])
  })
}
