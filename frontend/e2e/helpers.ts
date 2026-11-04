import { expect, type Page } from '@playwright/test';

/** The guest password the API under test accepts (CI sets GUEST_PASSWORD to this). */
export const PASSWORD = process.env['E2E_GUEST_PASSWORD'] ?? 'e2e-guest-password';

/** Goes through the password gate and picks a view. */
export async function signIn(page: Page, role: 'Patron' | 'Artist' = 'Patron') {
  await page.goto('/login');
  const gate = page.getByRole('dialog', { name: 'Welcome to Patronly' });
  await gate.getByLabel('Your name').fill('E2E Tester');
  await gate.getByLabel('Password').fill(PASSWORD);
  await gate.getByRole('button', { name: 'Enter' }).click();
  await expect(gate).toBeHidden();

  await page.getByRole('radio', { name: new RegExp(role) }).click();
  await page.getByRole('button', { name: 'Continue as guest' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
