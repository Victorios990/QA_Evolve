import { SEL } from '../../support/selectors';

describe('Carteira (Wallet)', () => {
  let dados;
  let msgs;

  before(() => {
    // Garante wallet no estado inicial (balance=1000) antes de qualquer teste de carteira
    cy.request({ method: 'POST', url: '/api/_test/spinwheel-reset' });
    cy.fixture('igaming').then((d)    => { dados = d; });
    cy.fixture('mensagens').then((m)  => { msgs  = m; });
  });

  beforeEach(() => {
    cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    cy.acessarCarteira();
  });

  // ── Depósito ──────────────────────────────────────────────────────────────

  it('CT-W01 | [smoke] Depósito via PIX com valor válido', { tags: ['smoke', 'carteira', 'positivo'] }, () => {
    cy.interceptarDeposito();
    cy.realizarDeposito(dados.wallet.depositoValido, dados.wallet.metodoPIX);

    cy.wait('@apiDeposito').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get(SEL.wallet.successMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.depositoSucesso);
  });

  it('CT-W02 | Depósito via Cartão de Crédito', { tags: ['carteira', 'positivo'] }, () => {
    cy.realizarDeposito(dados.wallet.depositoValido, dados.wallet.metodoCartao);
    cy.get(SEL.wallet.successMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.depositoSucesso);
  });

  it('CT-W03 | Saldo é atualizado após depósito', { tags: ['carteira', 'positivo', 'integridade'] }, () => {
    cy.interceptarSaldo();
    cy.getSaldo().then((saldoAntes) => {
      cy.realizarDeposito('100.00', dados.wallet.metodoPIX);
      cy.get(SEL.wallet.successMsg).should('be.visible');

      cy.getSaldo().then((saldoDepois) => {
        expect(saldoDepois).to.be.greaterThan(saldoAntes);
      });
    });
  });

  // ── Saque ─────────────────────────────────────────────────────────────────

  it('CT-W04 | [smoke] Saque dentro do saldo disponível', { tags: ['smoke', 'carteira', 'positivo'] }, () => {
    // Setup: garante que há saldo via depósito primeiro
    cy.realizarDeposito('200.00', dados.wallet.metodoPIX);
    cy.get(SEL.wallet.successMsg).should('be.visible');

    cy.getSaldo().then((saldoAntes) => {
      cy.realizarSaque(dados.wallet.saqueValido);
      cy.get(SEL.wallet.successMsg)
        .should('be.visible')
        .and('contain', msgs.wallet.saqueSucesso);

      cy.getSaldo().then((saldoDepois) => {
        const sacado = parseFloat(dados.wallet.saqueValido);
        expect(saldoDepois).to.be.approximately(saldoAntes - sacado, 0.01);
      });
    });
  });

  it('CT-W05 | Saque com saldo insuficiente exibe erro', { tags: ['carteira', 'negativo'] }, () => {
    cy.realizarSaque(dados.wallet.acimaDiario);
    cy.get(SEL.wallet.errorMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.saldoInsuficiente);
  });

  it('CT-W06 | Saldo permanece inalterado após saque inválido', { tags: ['carteira', 'negativo', 'integridade'] }, () => {
    cy.getSaldo().then((saldoAntes) => {
      cy.realizarSaque(dados.wallet.acimaDiario);
      cy.get(SEL.wallet.errorMsg).should('be.visible');
      cy.getSaldo().then((saldoDepois) => {
        expect(saldoDepois).to.eq(saldoAntes);
      });
    });
  });

  // ── Validações de entrada ─────────────────────────────────────────────────

  it('CT-W07 | Depósito com valor zerado é rejeitado', { tags: ['carteira', 'negativo'] }, () => {
    cy.realizarDeposito(dados.wallet.valorZerado, dados.wallet.metodoPIX);
    cy.get(SEL.wallet.errorMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.valorInvalido);
  });

  it('CT-W08 | Depósito com valor negativo é rejeitado', { tags: ['carteira', 'negativo'] }, () => {
    cy.realizarDeposito(dados.wallet.valorNegativo, dados.wallet.metodoPIX);
    cy.get(SEL.wallet.errorMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.valorInvalido);
  });

  it('CT-W09 | Saque acima do limite diário é bloqueado', { tags: ['carteira', 'negativo'] }, () => {
    cy.realizarSaque(dados.wallet.acimaDiario);
    cy.get(SEL.wallet.errorMsg)
      .should('be.visible')
      .and('contain', msgs.wallet.limiteDiario);
  });

  // ── Resiliência ───────────────────────────────────────────────────────────

  it('CT-W10 | Depósito não é duplicado com múltiplos cliques', { tags: ['carteira', 'resiliencia'] }, () => {
    let callCount = 0;
    cy.intercept('POST', '/api/wallet/deposit', (req) => {
      callCount++;
      req.continue();
    }).as('apiDeposito');

    cy.get(SEL.wallet.depositTab).click();
    cy.get(SEL.wallet.depositAmount).clear().type('100.00');
    cy.get(SEL.wallet.paymentMethod).select(dados.wallet.metodoPIX);

    // Múltiplos cliques rápidos
    cy.get(SEL.wallet.btnDeposit).dblclick();
    cy.get(SEL.wallet.btnDeposit).click();

    cy.get(SEL.wallet.successMsg).should('be.visible');
    // Botão deve ser desabilitado após o primeiro clique (idempotência via UI)
    cy.get(SEL.wallet.btnDeposit).should('be.disabled');
  });

  // ── Validação via API ─────────────────────────────────────────────────────

  it('CT-W11 | API de saldo retorna estrutura correta', { tags: ['carteira', 'api'] }, () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('BASE_URL')}/api/wallet/balance`,
      headers: { 'X-Tenant-Id': Cypress.env('TENANT_A') },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('balance');
      expect(res.body.balance).to.be.a('number').and.to.be.at.least(0);
      expect(res.body).to.have.property('currency');
    });
  });
});
