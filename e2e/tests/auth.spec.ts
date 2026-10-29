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

test('change name and password', async ({ page }) => {
  const email = `profile-${Date.now()}@example.com`

  await page.goto('/register')
  await page.getByLabel('Name').fill('Before')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/account$/)

  await page.getByLabel('Name').fill('After')
  await page.getByRole('button', { name: 'Save name' }).click()
  await expect(page.getByText('Name saved.')).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: 'After' })).toBeVisible()

  await page.getByLabel('Current password').fill('wrong-password')
  await page.getByLabel('New password').fill('new-password-1')
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText(/password is incorrect/i)).toBeVisible()

  await page.getByLabel('Current password').fill(password)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Password updated.')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('new-password-1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/account$/)
})

test('reset a forgotten password through the emailed link', async ({ page, request }) => {
  const email = `reset-${Date.now()}@example.com`
  const mailpit = process.env.MAILPIT_URL ?? 'http://localhost:8025'

  await page.goto('/register')
  await page.getByLabel('Name').fill('Forgetful')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible()
  await page.getByLabel('Email').fill(email)
  await expect(page.getByLabel('Email')).toHaveValue(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText(/reset link was sent/i)).toBeVisible()

  let link = ''
  await expect(async () => {
    const list = await (await request.get(`${mailpit}/api/v1/search?query=to:${email}`)).json()
    expect(list.messages_count).toBeGreaterThan(0)
    const mail = await (await request.get(`${mailpit}/api/v1/message/${list.messages[0].ID}`)).json()
    link = mail.Text.match(/https?:\/\/\S+\/reset-password\?\S+/)?.[0].replace(/&amp;/g, '&') ?? ''
    expect(link).not.toBe('')
  }).toPass()

  await page.goto(link)
  await page.getByLabel('New password').fill('reset-password-1')
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('reset-password-1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/account$/)
})
