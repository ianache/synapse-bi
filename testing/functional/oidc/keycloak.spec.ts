import { expect, test, type Page } from '@playwright/test'

function credentials(role: 'OWNER' | 'READER' | 'OTHER') {
  const username = process.env[`BI_OIDC_${role}_USER`]
  const password = process.env[`BI_OIDC_${role}_PASSWORD`]
  if (!username || !password) throw new Error(`Configura BI_OIDC_${role}_USER y BI_OIDC_${role}_PASSWORD en el entorno.`)
  return { username, password }
}

async function signIn(page: Page, role: 'OWNER' | 'READER' | 'OTHER') {
  const account = credentials(role)
  await page.goto('/login')
  await page.getByRole('button', { name: /Iniciar sesión con Red Hat Keycloak/i }).click()
  await page.locator('#username').fill(account.username)
  await page.locator('#password').fill(account.password)
  await page.locator('#kc-login').click()
  await expect(page).toHaveURL(/^http:\/\/(127\.0\.0\.1|localhost):5173\//)
  await page.getByRole('link', { name: 'Explorar KPI' }).click()
  await expect(page.getByText('El token no es válido o ha vencido.')).toHaveCount(0)
}

test('R01: el propietario autentica con Keycloak y accede al catálogo', async ({ page }) => {
  await signIn(page, 'OWNER')
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toBeVisible()
})

test('R01: el lector autentica con Keycloak sin acceso al catálogo global', async ({ page }) => {
  await signIn(page, 'READER')
  await expect(page.getByRole('heading', { name: 'El catálogo global requiere otro permiso' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ingresos netos' })).toHaveCount(0)
})

test('R03: otro tenant no puede abrir el dashboard de prueba', async ({ page }) => {
  const dashboardPath = process.env.BI_OIDC_TEST_DASHBOARD_PATH
  test.skip(!dashboardPath, 'Configura BI_OIDC_TEST_DASHBOARD_PATH con la ruta del dashboard sintético del propietario.')
  if (!/^\/dashboards\/[^/?#]+$/.test(dashboardPath!)) throw new Error('La ruta del dashboard de prueba debe tener la forma /dashboards/{id}.')
  await signIn(page, 'OTHER')
  await page.goto(dashboardPath!)
  await expect(page.getByRole('heading', { name: 'No se puede acceder a este dashboard' })).toBeVisible()
})

test.fixme('R01: el enlace de login con returnTo vuelve a la ruta solicitada', async ({ page }) => {
  // El realm actual solo autoriza /login sin query; check-sso usa la URL completa.
  await page.goto('/login?returnTo=%2Fexplorar')
  await expect(page.getByRole('button', { name: /Iniciar sesión con Red Hat Keycloak/i })).toBeVisible()
})
