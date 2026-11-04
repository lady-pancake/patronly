import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('an artist builds a studio, previews it and makes it public', async ({ page }) => {
  await signIn(page, 'Artist');
  await page.goto('/studio/edit');

  // Step 1 starts from the sample studio stored in the database.
  await expect(page.getByRole('heading', { name: 'Let’s build your studio.' })).toBeVisible();
  await page.getByLabel('Your name').fill('Robin Vale');
  await page.getByLabel('Studio name').fill('Vale Print Studio');

  // The sample studio fills every other step, so Continue walks through them.
  for (const heading of [
    'What do you do?',
    'Tell your story.',
    'Add samples of your work.',
    'Set your prices.',
    'Plan your calendar.',
  ]) {
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.getByRole('heading', { name: 'Your studio is ready.' })).toBeVisible();

  await page.getByRole('button', { name: 'Preview my studio' }).click();
  await expect(page).toHaveURL(/\/artists\/me/);
  await expect(page.getByRole('heading', { level: 1, name: 'Robin Vale' })).toBeVisible();
  await expect(page.getByText('Only you can see this.')).toBeVisible();

  await page.getByRole('button', { name: 'Make it public' }).click();
  await expect(page.getByText('Your studio is live.')).toBeVisible();
});
