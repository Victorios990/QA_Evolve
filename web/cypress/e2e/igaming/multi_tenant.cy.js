const SEL = require('../../support/selectors')

describe('Multi-tenant — Isolamento de dados', () => {
  it('tenant A não enxerga saldo de tenant B', () => {
    cy.loginViaApi('operator-a')
    cy.visit('/wallet')
    cy.getBalance().then((saldoA) => {
      cy.clearAllSessionStorage()
      cy.clearAllLocalStorage()
      cy.loginViaApi('operator-b')
      cy.visit('/wallet')
      cy.getBalance().then((saldoB) => {
        expect(saldoA).not.eq(saldoB)
      })
    })
  })

  it('token do tenant A é rejeitado ao acessar API do tenant B', () => {
    cy.loginViaApi('operator-a')
    cy.window().then((win) => {
      const tokenA = win.localStorage.getItem('token')
      cy.request({
        method: 'GET',
        url: '/api/wallet/balance',
        headers: { Authorization: `Bearer ${tokenA}`, 'X-Tenant-Id': 'operator-b' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403])
      })
    })
  })

  it('histórico de transações do tenant A não aparece para tenant B', () => {
    cy.loginViaApi('operator-b')
    cy.request({
      method: 'GET',
      url: '/api/transactions',
      headers: { 'X-Tenant-Id': 'operator-b' },
    }).then((res) => {
      const tenantBIds = res.body.map((t) => t.tenantId)
      tenantBIds.forEach((id) => expect(id).to.eq('operator-b'))
    })
  })

  it('badge de tenant exibe o tenant correto após login', () => {
    cy.login('operator-a')
    cy.visit('/dashboard')
    cy.get(SEL.multitenant.tenantBadge).should('contain', 'operator-a')
  })
})
