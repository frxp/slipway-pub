import { expect, test } from '@playwright/test'
import { register, signIn, uniqueEmail } from './helpers'

const cors = { 'access-control-allow-origin': '*' }

test('a rate-limited sign-in explains itself', async ({ page }) => {
  await page.route('**/api/login', (route) =>
    route.fulfill({ status: 429, headers: cors, json: { message: 'Too Many Attempts.' } }),
  )

  await page.goto('/login')
  await signIn(page, 'someone@example.com')

  await expect(page.getByText('Too Many Attempts.')).toBeVisible()
})

test('a lost connection on the account page shows an error', async ({ page }) => {
  await register(page, uniqueEmail('offline'))
  await page.route('**/api/me', (route) => route.abort())

  await page.getByRole('button', { name: 'Save name' }).click()

  await expect(page.getByText('Could not reach the server.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
})

test('a failed page load keeps the session', async ({ page }) => {
  const email = uniqueEmail('outage')

  await register(page, email)
  await page.route('**/api/me', (route) =>
    route.fulfill({ status: 500, headers: cors, json: { message: 'Server Error' } }),
  )

  await page.reload()
  await expect(page.getByText('Could not load your account.')).toBeVisible()

  await page.unroute('**/api/me')
  await page.reload()
  await expect(page.getByText(email)).toBeVisible()
})

test('a session that ends on the server returns to sign in', async ({ page }) => {
  await register(page, uniqueEmail('revoked'))
  await page.route('**/api/me', (route) =>
    route.fulfill({ status: 401, headers: cors, json: { message: 'Unauthenticated.' } }),
  )

  await page.getByRole('button', { name: 'Save name' }).click()

  await expect(page).toHaveURL(/\/login$/)
})
