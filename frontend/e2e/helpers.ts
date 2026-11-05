import { expect, type Page } from '@playwright/test';

/** Opens the sign-in page and picks a view. No password needed. */
export async function signIn(page: Page, role: 'Patron' | 'Artist' = 'Patron') {
  await page.goto('/login');
  await page.getByRole('radio', { name: new RegExp(role) }).click();
  await page.getByRole('button', { name: 'Continue as guest' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
