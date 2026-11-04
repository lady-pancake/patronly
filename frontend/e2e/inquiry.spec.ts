import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('a patron sends an inquiry and finds it in Messages', async ({ page }) => {
  await signIn(page, 'Patron');

  // Studios come from Postgres through the GraphQL API.
  await page.goto('/artists/hana');
  await expect(page.getByRole('heading', { level: 1, name: 'Hana Ito' })).toBeVisible();

  await page.getByRole('button', { name: 'Inquire', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /Send an inquiry to Hana Ito/ });
  await expect(dialog.getByRole('button', { name: 'Send inquiry' })).toBeDisabled();

  await dialog
    .getByLabel('Your message')
    .fill('Could you make a set of six bowls for our new kitchen?');
  await dialog.getByRole('button', { name: 'Send inquiry' }).click();

  const sent = page.getByRole('dialog', { name: /Your inquiry is on its way/ });
  await expect(sent).toBeVisible();
  await sent.getByRole('button', { name: 'View in Messages' }).click();

  await expect(page).toHaveURL(/\/messages\//);
  await expect(
    page.getByText('Could you make a set of six bowls').filter({ visible: true }).first(),
  ).toBeVisible();
});
