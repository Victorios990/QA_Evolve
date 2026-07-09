import { SEL } from './selectors';

// ── Autenticação ─────────────────────────────────────────────────────────────

// Login via UI
Cypress.Commands.add('login', (username, password) => {
  cy.session(
    [username, password],
    () => {
      cy.visit('/login');
      cy.get(SEL.login.username).clear().type(username);
      cy.get(SEL.login.password).clear().type(password);
      cy.get(SEL.login.btnLogin).click();
      cy.get(SEL.wallet.balance).should('be.visible');
    },
    {
      cacheAcrossSpecs: true,
    }
  );
});

// Login via API (sem UI — mais rápido para setup de pré-condições)
Cypress.Commands.add('loginViaApi', (username, password) => {
  return cy
    .request('POST', '/api/auth/login', { username, password })
    .then((res) => {
      expect(res.status).to.eq(200);
      window.localStorage.setItem('access_token', res.body.access_token);
      return res.body.access_token;
    });
});

// ── Wallet ───────────────────────────────────────────────────────────────────

Cypress.Commands.add('acessarCarteira', () => {
  cy.visit('/account/wallet');
  cy.get(SEL.wallet.balance).should('be.visible');
});

Cypress.Commands.add('getSaldo', () => {
  return cy.get(SEL.wallet.balance)
    .should('be.visible')
    .invoke('text')
    .then((txt) => parseFloat(txt.replace(/[^0-9.,]/g, '').replace(',', '.')));
});

Cypress.Commands.add('realizarDeposito', (valor, metodo = 'PIX') => {
  cy.get(SEL.wallet.depositTab).click();
  cy.get(SEL.wallet.depositAmount).clear().type(valor);
  cy.get(SEL.wallet.paymentMethod).select(metodo);
  cy.get(SEL.wallet.btnDeposit).click();
});

Cypress.Commands.add('realizarSaque', (valor) => {
  cy.get(SEL.wallet.withdrawalTab).click();
  cy.get(SEL.wallet.withdrawalAmount).clear().type(valor);
  cy.get(SEL.wallet.btnWithdrawal).click();
});

// Depósito via API (setup rápido de pré-condição)
Cypress.Commands.add('depositarViaApi', (valor, tenantId = 'operadora-a') => {
  const token = window.localStorage.getItem('access_token');
  return cy.request({
    method: 'POST',
    url: '/api/wallet/deposit',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
    body: { amount: parseFloat(valor), payment_method: 'PIX', currency: 'BRL' },
  });
});

// ── Sportsbook ────────────────────────────────────────────────────────────────

Cypress.Commands.add('acessarSportsbook', () => {
  cy.visit('/sportsbook');
  cy.get(SEL.sportsbook.eventList).should('be.visible');
});

Cypress.Commands.add('pesquisarEvento', (nomeEvento) => {
  cy.get(SEL.sportsbook.searchEvents).clear().type(nomeEvento);
  cy.get(SEL.sportsbook.firstEvent).should('be.visible');
});

Cypress.Commands.add('selecionarPrimeiroEvento', () => {
  cy.get(SEL.sportsbook.firstEvent).click();
  cy.get(SEL.sportsbook.betSlip).should('be.visible');
});

Cypress.Commands.add('realizarAposta', (valor) => {
  cy.get(SEL.sportsbook.betAmount).clear().type(valor);
  cy.get(SEL.sportsbook.btnPlaceBet).click();
});

// ── Histórico ─────────────────────────────────────────────────────────────────

Cypress.Commands.add('acessarHistorico', () => {
  cy.visit('/account/transactions');
  cy.get(SEL.historico.table).should('be.visible');
});

Cypress.Commands.add('filtrarPorTipo', (tipo) => {
  cy.get(SEL.historico.filterType).select(tipo);
});

Cypress.Commands.add('filtrarPorPeriodo', (dataInicio, dataFim) => {
  cy.get(SEL.historico.filterDateFrom).clear().type(dataInicio);
  cy.get(SEL.historico.filterDateTo).clear().type(dataFim);
});

Cypress.Commands.add('filtrarPorValor', (min, max) => {
  cy.get(SEL.historico.filterAmountMin).clear().type(min);
  cy.get(SEL.historico.filterAmountMax).clear().type(max);
});

Cypress.Commands.add('aplicarFiltros', () => {
  cy.get(SEL.historico.btnApplyFilter).click();
  cy.get(SEL.historico.table).should('be.visible');
});

// ── Multi-Tenant ──────────────────────────────────────────────────────────────

Cypress.Commands.add('acessarPainelTenant', () => {
  cy.visit('/admin/tenants');
  cy.get(SEL.multitenant.currentTenant).should('be.visible');
});

Cypress.Commands.add('trocarTenant', (nomeTenant) => {
  cy.get(SEL.multitenant.tenantSelector).select(nomeTenant);
  cy.get(SEL.multitenant.btnSwitch).click();
  cy.get(SEL.multitenant.currentTenant).should('contain', nomeTenant);
});

// ── Interceptações reutilizáveis ─────────────────────────────────────────────

// Intercepta a API de depósito e verifica idempotência
Cypress.Commands.add('interceptarDeposito', () => {
  cy.intercept('POST', '/api/wallet/deposit').as('apiDeposito');
});

Cypress.Commands.add('interceptarAposta', () => {
  cy.intercept('POST', '/api/sportsbook/bets').as('apiAposta');
});

Cypress.Commands.add('interceptarSaldo', () => {
  cy.intercept('GET', '/api/wallet/balance').as('apiSaldo');
});
