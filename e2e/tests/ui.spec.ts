import { expect, test } from '@playwright/test'

test('design page lists the tokens', async ({ page }) => {
  await page.goto('/_design')
  await expect(page.getByRole('heading', { name: 'Design tokens' })).toBeVisible()
  await expect(page.getByText('--color-accent', { exact: true })).toBeVisible()
})

test('theme toggle switches and remembers the choice', async ({ page }) => {
  await page.goto('/login')
  const html = page.locator('html')

  await page.getByRole('button', { name: 'Change theme' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Change theme' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})
