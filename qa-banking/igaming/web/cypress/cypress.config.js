const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'e2e/**/*.cy.js',
    supportFile: 'support/e2e.js',
    fixturesFolder: 'fixtures',
    screenshotOnRunFailure: true,
    video: false,
    retries: { runMode: 1, openMode: 0 },
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      TENANT_A: 'operator-a',
      TENANT_B: 'operator-b',
    },
  },
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: '../../reports/cypress',
    overwrite: false,
    html: true,
    json: true,
  },
})
