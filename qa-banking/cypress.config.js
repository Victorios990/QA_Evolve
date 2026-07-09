const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/reports/screenshots',
    videosFolder: 'cypress/reports/videos',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    retries: {
      runMode: 2,    // retry automático no CI
      openMode: 0,
    },
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
      reportDir: 'cypress/reports',
      charts: true,
      reportPageTitle: 'iGaming QA',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config);
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
  env: {
    // Sobrescreva via cypress.env.json (não commitar) ou variáveis de ambiente
    BASE_URL:       'http://localhost:3000',
    IGAMING_USER:   'player01',
    IGAMING_PASS:   'Senha@123',
    ADMIN_USER:     'admin_qa',
    ADMIN_PASS:     'Admin@Seguro1',
    TENANT_A:       'operadora-a',
    TENANT_B:       'operadora-b',
    grep:           '',
    grepTags:       '',
  },
});
