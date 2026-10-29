import { expect, test } from '@playwright/test'

const password = 'password123'

test('register, sign out, sign in', async ({ page }) => {
  const email = `user-${Date.now()}@example.com`

  await page.goto('/register')
  await page.getByLabel('Name').fill('Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText(email)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/account$/)
  await expect(page.getByText('Test User')).toBeVisible()
})

test('wrong password shows an error', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('nobody@example.com')
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Invalid email or password.')).toBeVisible()
})

test('anonymous visitor is sent to sign in', async ({ page }) => {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
})

test('design page lists the tokens', async ({ page }) => {
  await page.goto('/_design')
  await expect(page.getByRole('heading', { name: 'Design tokens' })).toBeVisible()
  await expect(page.getByText('--color-accent')).toBeVisible()
})
