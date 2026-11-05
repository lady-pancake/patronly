import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: a real browser against the Angular app, the FastAPI backend
 * and Postgres. Start the API yourself (see the README), or let CI do it.
 * Sign-in starts a real guest visit through the API.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run env && ng serve --port 4300',
    url: 'http://localhost:4300',
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
  },
});
