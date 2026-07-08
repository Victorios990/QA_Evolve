const SEL = require('../../support/selectors')

describe('Carteira — Fluxos financeiros', () => {
  beforeEach(() => {
    cy.login('operator-a')
    cy.visit('/wallet')
  })

  context('Depósito', () => {
    it('realiza depósito válido e atualiza saldo', () => {
      cy.fixture('igaming').then(({ wallet, messages }) => {
        cy.getBalance().then((antes) => {
          cy.deposit(wallet.validAmount)
          cy.get(SEL.wallet.successMsg).should('contain', messages.depositSuccess)
          cy.getBalance().should('eq', antes + wallet.validAmount)
        })
      })
    })

    it('bloqueia depósito abaixo do mínimo', () => {
      cy.fixture('igaming').then(({ wallet, messages }) => {
        cy.deposit(wallet.depositMin - 1)
        cy.get(SEL.wallet.errorMsg).should('contain', messages.minDepositError)
      })
    })

    it('bloqueia depósito com valor zero', () => {
      cy.fixture('igaming').then(({ wallet }) => {
        cy.deposit(wallet.zeroAmount)
        cy.get(SEL.wallet.btnDeposit).should('be.disabled')
      })
    })

    it('bloqueia depósito com valor negativo', () => {
      cy.fixture('igaming').then(({ wallet }) => {
        cy.deposit(wallet.negativeAmount)
        cy.get(SEL.wallet.errorMsg).should('exist')
      })
    })

    it('garante idempotência — duplo clique não duplica transação', () => {
      cy.fixture('igaming').then(({ wallet }) => {
        cy.getBalance().then((antes) => {
          cy.get(SEL.wallet.inputDeposit).type(wallet.validAmount)
          cy.get(SEL.wallet.btnDeposit).dblclick()
          cy.get(SEL.wallet.btnConfirm).click()
          cy.getBalance().should('eq', antes + wallet.validAmount)
        })
      })
    })

    it('simula falha de rede no depósito e mantém saldo intacto', () => {
      cy.fixture('igaming').then(({ wallet }) => {
        cy.interceptWallet('failDeposit', 500, { error: 'Gateway Timeout' })
        cy.getBalance().then((antes) => {
          cy.deposit(wallet.validAmount)
          cy.wait('@failDeposit')
          cy.get(SEL.wallet.errorMsg).should('exist')
          cy.getBalance().should('eq', antes)
        })
      })
    })
  })

  context('Saque', () => {
    it('realiza saque válido e debita saldo corretamente', () => {
      cy.fixture('igaming').then(({ wallet, messages }) => {
        cy.deposit(wallet.validAmount)
        cy.getBalance().then((antes) => {
          cy.withdraw(wallet.withdrawMin)
          cy.get(SEL.wallet.successMsg).should('contain', messages.withdrawSuccess)
          cy.getBalance().should('eq', antes - wallet.withdrawMin)
        })
      })
    })

    it('bloqueia saque maior que saldo disponível', () => {
      cy.fixture('igaming').then(({ wallet, messages }) => {
        cy.getBalance().then((saldo) => {
          cy.withdraw(saldo + 1000)
          cy.get(SEL.wallet.errorMsg).should('contain', messages.insufficientBalance)
        })
      })
    })

    it('impede saque com saldo zerado', () => {
      cy.fixture('igaming').then(({ wallet }) => {
        cy.interceptWallet('zeroBalance', 200, { balance: 0 })
        cy.visit('/wallet')
        cy.get(SEL.wallet.btnWithdraw).should('be.disabled')
      })
    })
  })

  context('Mobile viewport — carteira responsiva', () => {
    it('exibe saldo e botões corretamente em iPhone 14', () => {
      cy.viewport('iphone-14')
      cy.visit('/wallet')
      cy.get(SEL.wallet.balance).should('be.visible')
      cy.get(SEL.wallet.btnDeposit).should('be.visible')
      cy.get(SEL.wallet.btnWithdraw).should('be.visible')
    })

    it('fluxo de depósito funciona em viewport mobile', () => {
      cy.viewport('iphone-14')
      cy.fixture('igaming').then(({ wallet, messages }) => {
        cy.deposit(wallet.validAmount)
        cy.get(SEL.wallet.successMsg).should('contain', messages.depositSuccess)
      })
    })
  })
})
