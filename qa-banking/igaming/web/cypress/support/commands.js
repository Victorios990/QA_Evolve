const SEL = require('./selectors')

Cypress.Commands.add('login', (tenant = 'operator-a') => {
  cy.session([tenant], () => {
    cy.fixture('users').then((users) => {
      const user = users[tenant]
      cy.visit('/login')
      cy.get(SEL.auth.tenantSelector).select(tenant)
      cy.get(SEL.auth.username).type(user.username)
      cy.get(SEL.auth.password).type(user.password)
      cy.get(SEL.auth.btnLogin).click()
      cy.url().should('include', '/dashboard')
    })
  })
})

Cypress.Commands.add('loginViaApi', (tenant = 'operator-a') => {
  cy.fixture('users').then((users) => {
    const user = users[tenant]
    cy.request('POST', '/api/auth/login', { ...user, tenant }).then((res) => {
      window.localStorage.setItem('token', res.body.token)
      window.localStorage.setItem('tenant', tenant)
    })
  })
})

Cypress.Commands.add('getBalance', () => {
  return cy.get(SEL.wallet.balance).invoke('text').then((txt) =>
    parseFloat(txt.replace(/[^0-9,.]/g, '').replace(',', '.'))
  )
})

Cypress.Commands.add('deposit', (amount) => {
  cy.get(SEL.wallet.inputDeposit).clear().type(amount)
  cy.get(SEL.wallet.btnDeposit).click()
  cy.get(SEL.wallet.btnConfirm).click()
})

Cypress.Commands.add('withdraw', (amount) => {
  cy.get(SEL.wallet.inputWithdraw).clear().type(amount)
  cy.get(SEL.wallet.btnWithdraw).click()
  cy.get(SEL.wallet.btnConfirm).click()
})

Cypress.Commands.add('placeBet', (eventName, amount) => {
  cy.get(SEL.sportsbook.searchEvent).type(eventName)
  cy.get(SEL.sportsbook.eventCard).first().click()
  cy.get(SEL.sportsbook.betAmount).clear().type(amount)
  cy.get(SEL.sportsbook.btnPlaceBet).click()
})

Cypress.Commands.add('interceptWallet', (alias, statusCode = 200, body = {}) => {
  cy.intercept('POST', '/api/wallet/*', { statusCode, body }).as(alias)
})

Cypress.Commands.add('interceptBet', (alias, statusCode = 200, body = {}) => {
  cy.intercept('POST', '/api/sportsbook/bet', { statusCode, body }).as(alias)
})
