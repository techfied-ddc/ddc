import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:            './specs',
  fullyParallel:      true,
  forbidOnly:         !!process.env['CI'],
  retries:            process.env['CI'] ? 2 : 0,
  workers:            process.env['CI'] ? 1 : undefined,
  reporter:           [['list'], ['html', { open: 'never' }]],
  timeout:            30_000,
  expect:             { timeout: 5_000 },

  use: {
    baseURL:          process.env['BASE_URL'] ?? 'http://localhost:3001',
    trace:            'on-first-retry',
    screenshot:       'only-on-failure',
    video:            'retain-on-failure',
    locale:           'en-IN',
    timezoneId:       'Asia/Kolkata',
  },

  projects: [
    {
      name:  'mobile-chrome',
      use:   { ...devices['Pixel 7'], channel: 'chrome' },
    },
    {
      name:  'desktop-chrome',
      use:   devices['Desktop Chrome'],
    },
  ],

  webServer: [
    {
      command:          'pnpm --filter web-user dev',
      url:              'http://localhost:3001',
      reuseExistingServer: !process.env['CI'],
      timeout:          30_000,
    },
    {
      command:          'pnpm --filter api dev',
      url:              'http://localhost:4000/healthz',
      reuseExistingServer: !process.env['CI'],
      timeout:          30_000,
    },
  ],
});
