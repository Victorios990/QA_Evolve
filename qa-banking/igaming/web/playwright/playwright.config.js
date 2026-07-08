const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  reporter: [['html', { outputFolder: '../../reports/playwright' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari — iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Mobile Chrome — Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Tablet — iPad Pro',
      use: { ...devices['iPad Pro'] },
    },
  ],
})
