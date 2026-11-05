import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test.describe('Sign-in', () => {
  test('opens without a password: just pick a view', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Password')).toHaveCount(0);
    await page.getByRole('radio', { name: /Patron/ }).click();
    await page.getByRole('button', { name: 'Continue as guest' }).click();
    await expect(page).toHaveURL('/');
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
