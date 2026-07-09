import { SEL } from '../../support/selectors';

describe('Segurança — Sessão, Autenticação e Autorização', () => {

  // ── Páginas protegidas — redirecionamento sem token ───────────────────────

  describe('Acesso sem token redireciona para /login', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it('SEC-01 | [smoke] Carteira inacessível sem token → redireciona para /login', { tags: ['smoke', 'seguranca', 'sessao'] }, () => {
      cy.visit('/account/wallet');
      cy.url({ timeout: 5000 }).should('include', '/login');
    });

    it('SEC-02 | Histórico inacessível sem token → redireciona para /login', { tags: ['seguranca', 'sessao'] }, () => {
      cy.visit('/account/transactions');
      cy.url({ timeout: 5000 }).should('include', '/login');
    });

    it('SEC-03 | Sportsbook inacessível sem token → redireciona para /login', { tags: ['seguranca', 'sessao'] }, () => {
      cy.visit('/sportsbook');
      cy.url({ timeout: 5000 }).should('include', '/login');
    });

    it('SEC-04 | Painel admin inacessível sem token → redireciona para /login', { tags: ['seguranca', 'sessao', 'rbac'] }, () => {
      cy.visit('/admin/tenants');
      cy.url({ timeout: 5000 }).should('include', '/login');
    });
  });

  // ── API — autenticação e autorização ────────────────────────────────────────

  describe('API: endpoints admin exigem autenticação e papel correto', () => {

    it('SEC-05 | /api/admin/tenants sem token retorna 401', { tags: ['seguranca', 'api', 'autenticacao'] }, () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('BASE_URL')}/api/admin/tenants`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body).to.have.property('error');
      });
    });

    it('SEC-06 | /api/admin/tenants com token de player retorna 403', { tags: ['seguranca', 'api', 'rbac'] }, () => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('BASE_URL')}/api/admin/tenants`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(403);
          expect(res.body).to.have.property('error');
        });
      });
    });

    it('SEC-07 | /api/admin/tenants com token inválido retorna 401', { tags: ['seguranca', 'api', 'autenticacao'] }, () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('BASE_URL')}/api/admin/tenants`,
        headers: { Authorization: 'Bearer token_invalido_proposital' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body).to.have.property('error');
      });
    });
  });

  // ── Integridade — concorrência de depósito ──────────────────────────────────

  describe('Concorrência — integridade financeira', () => {
    it('SEC-08 | [resilience] Dois depósitos simultâneos não corrompem o saldo', { tags: ['seguranca', 'integridade', 'resiliencia'] }, () => {
      let saldoAntes;
      const valor = 100.00;

      cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
      cy.visit('/account/wallet');

      cy.request({
        method: 'GET',
        url: '/api/wallet/balance',
        headers: { 'X-Tenant-Id': 'operadora-a' },
      }).then((res) => { saldoAntes = res.body.balance; });

      // Dois fetches disparados em paralelo para testar ausência de lost update
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': 'operadora-a',
        };
        const body = JSON.stringify({ amount: valor, payment_method: 'PIX', currency: 'BRL' });

        return Promise.all([
          win.fetch('/api/wallet/deposit', { method: 'POST', headers, body }),
          win.fetch('/api/wallet/deposit', { method: 'POST', headers, body }),
        ]).then(([r1, r2]) => {
          expect(r1.status).to.eq(201);
          expect(r2.status).to.eq(201);
        });
      });

      cy.request({
        method: 'GET',
        url: '/api/wallet/balance',
        headers: { 'X-Tenant-Id': 'operadora-a' },
      }).then((resAfter) => {
        expect(resAfter.body.balance).to.be.approximately(saldoAntes + valor * 2, 0.01);
      });
    });
  });

  // ── Interface — persistência de tema ─────────────────────────────────────────

  describe('Tema — persistência entre navegações', () => {
    beforeEach(() => {
      cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    });

    it('SEC-09 | Dark/light mode persiste ao navegar entre páginas', { tags: ['seguranca', 'ui', 'tema'] }, () => {
      cy.visit('/account/wallet');

      // Garante que começa em dark e alterna para light
      cy.window().then((win) => win.localStorage.setItem('theme', 'dark'));
      cy.get(SEL.tema.toggle).click();
      cy.window().its('localStorage').invoke('getItem', 'theme').should('eq', 'light');

      // Navega para sportsbook — tema deve persistir
      cy.visit('/sportsbook');
      cy.window().its('localStorage').invoke('getItem', 'theme').should('eq', 'light');
      cy.get('body').should('have.class', 'light');

      // Navega para histórico — tema deve persistir
      cy.visit('/account/transactions');
      cy.window().its('localStorage').invoke('getItem', 'theme').should('eq', 'light');
      cy.get('body').should('have.class', 'light');
    });
  });
});
