import './commands';
import '@cypress/grep';

// Captura screenshot automática em qualquer falha
Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    const screenshotName = `${runnable.parent.title} -- ${test.title}`;
    cy.screenshot(screenshotName, { capture: 'fullPage' });
  }
});

// Suprime erros de JS não relacionados ao teste (ex: trackers externos)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('Non-Error promise rejection')
  ) {
    return false;
  }
});

// Configuração global de viewport para cada teste
beforeEach(() => {
  cy.viewport(1280, 720);
});
