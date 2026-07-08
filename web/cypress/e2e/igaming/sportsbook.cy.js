const SEL = require('../../support/selectors')

describe('Sportsbook — Apostas', () => {
  beforeEach(() => {
    cy.login('operator-a')
    cy.visit('/sportsbook')
  })

  it('registra aposta e exibe ganho potencial', () => {
    cy.fixture('igaming').then(({ sportsbook, messages }) => {
      cy.placeBet(sportsbook.eventName, sportsbook.betAmount)
      cy.get(SEL.sportsbook.potentialWin).should('exist')
      cy.get(SEL.sportsbook.btnPlaceBet).click()
      cy.get(SEL.wallet.successMsg).should('contain', messages.betSuccess)
    })
  })

  it('alerta usuário quando odd muda antes da confirmação', () => {
    cy.fixture('igaming').then(({ sportsbook }) => {
      cy.get(SEL.sportsbook.searchEvent).type(sportsbook.eventName)
      cy.get(SEL.sportsbook.eventCard).first().click()
      cy.get(SEL.sportsbook.betAmount).type(sportsbook.betAmount)
      cy.interceptBet('oddChange', 409, { error: 'ODD_CHANGED', newOdd: 2.15 })
      cy.get(SEL.sportsbook.btnPlaceBet).click()
      cy.wait('@oddChange')
      cy.get(SEL.sportsbook.oddChangeAlert).should('be.visible')
    })
  })

  it('bloqueia aposta com saldo insuficiente', () => {
    cy.fixture('igaming').then(({ wallet, messages }) => {
      cy.interceptWallet('zeroBalance', 200, { balance: 0 })
      cy.placeBet('Qualquer evento', wallet.validAmount)
      cy.get(SEL.wallet.errorMsg).should('contain', messages.insufficientBalance)
    })
  })

  it('cancela aposta antes da confirmação', () => {
    cy.fixture('igaming').then(({ sportsbook }) => {
      cy.get(SEL.sportsbook.searchEvent).type(sportsbook.eventName)
      cy.get(SEL.sportsbook.eventCard).first().click()
      cy.get(SEL.sportsbook.betAmount).type(sportsbook.betAmount)
      cy.get(SEL.sportsbook.btnCancelBet).click()
      cy.get(SEL.sportsbook.betSlip).should('be.empty')
    })
  })

  it('exibe bet slip corretamente em viewport mobile (Android)', () => {
    cy.viewport('samsung-s10')
    cy.fixture('igaming').then(({ sportsbook }) => {
      cy.get(SEL.sportsbook.searchEvent).type(sportsbook.eventName)
      cy.get(SEL.sportsbook.eventCard).first().click()
      cy.get(SEL.sportsbook.betSlip).should('be.visible')
      cy.get(SEL.sportsbook.betAmount).should('be.visible')
    })
  })
})
