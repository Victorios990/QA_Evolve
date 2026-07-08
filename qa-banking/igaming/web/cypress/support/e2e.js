import './commands'

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver') || err.message.includes('Non-Error')) return false
})

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    cy.screenshot(`FALHA_${this.currentTest.title}`)
  }
})
