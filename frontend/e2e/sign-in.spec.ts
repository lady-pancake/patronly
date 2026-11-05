import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from './helpers';

test.describe('Sign-in', () => {
  test('a wrong password is rejected and selected for retyping', async ({ page }) => {
    await page.goto('/login');
    const gate = page.getByRole('dialog', { name: 'Welcome to Patronly' });
    await gate.getByLabel('Your name').fill('E2E Tester');
    const password = gate.getByLabel('Password');
    await password.fill('not-the-password');
    await password.press('Enter');

    await expect(gate.getByRole('alert')).toBeVisible();
    await expect(password).toBeFocused();
    const selected = await password.evaluate(
      (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
    );
    expect(selected).toBe('not-the-password'.length);
    expect(PASSWORD).not.toBe('not-the-password');
  });

  test('a guest signs in as a patron, then switches to the artist view', async ({ page }) => {
    await signIn(page, 'Patron');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: /Saved/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Dashboard/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Account menu/ }).click();
    await page.getByRole('menuitemradio', { name: 'Artist' }).click();

    // A new artist has no studio yet, so they land in the studio builder.
    await expect(page).toHaveURL(/\/studio\/edit/);
    await expect(page.getByRole('heading', { name: 'Let’s build your studio.' })).toBeVisible();
  });
});
