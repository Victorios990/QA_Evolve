import { SEL } from '../../support/selectors';

describe('Multi-Tenant — Isolamento e Segurança', () => {
  let dados;
  let msgs;

  before(() => {
    cy.fixture('igaming').then((d)   => { dados = d; });
    cy.fixture('mensagens').then((m) => { msgs  = m; });
  });

  // ── Troca de tenant (admin) ───────────────────────────────────────────────

  describe('Como administrador', () => {
    beforeEach(() => {
      cy.login(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS'));
      cy.acessarPainelTenant();
    });

    it('MT-01 | [smoke] Troca de tenant exibe tenant correto', { tags: ['smoke', 'multitenant', 'positivo'] }, () => {
      cy.trocarTenant(dados.tenants.A);

      cy.get(SEL.multitenant.currentTenant)
        .should('be.visible')
        .and('contain', dados.tenants.A);

      cy.get(SEL.multitenant.successMsg)
        .should('be.visible')
        .and('contain', msgs.multitenant.trocaSucesso);
    });

    it('MT-02 | Dados de Tenant A não aparecem após trocar para Tenant B', { tags: ['multitenant', 'positivo', 'isolamento'] }, () => {
      // Captura dado exclusivo do Tenant A
      cy.trocarTenant(dados.tenants.A);
      cy.get(SEL.multitenant.balanceTotal).invoke('text').then((saldoTenantA) => {

        // Troca para Tenant B
        cy.trocarTenant(dados.tenants.B);

        // Verifica que os dados do Tenant A não são visíveis
        cy.get('body').should('not.contain', saldoTenantA);
      });
    });

    it('MT-03 | Saldo total do tenant é exibido corretamente', { tags: ['multitenant', 'positivo'] }, () => {
      cy.trocarTenant(dados.tenants.A);
      cy.get(SEL.multitenant.balanceTotal)
        .should('be.visible')
        .invoke('text')
        .then((txt) => {
          expect(txt.trim()).to.not.be.empty;
        });
    });

    it('MT-04 | Quantidade de usuários do tenant é exibida', { tags: ['multitenant', 'positivo'] }, () => {
      cy.trocarTenant(dados.tenants.A);
      cy.get(SEL.multitenant.userCount)
        .should('be.visible')
        .invoke('text')
        .then((txt) => {
          const qtd = parseInt(txt.trim());
          expect(qtd).to.be.at.least(0);
        });
    });

    it('MT-05 | Tenant inexistente exibe erro adequado', { tags: ['multitenant', 'negativo'] }, () => {
      cy.intercept('POST', '/api/admin/tenants/switch', {
        statusCode: 403,
        body: { error: msgs.multitenant.tenantInvalido },
      }).as('tenantInvalido');

      cy.get(SEL.multitenant.tenantSelector).select('Tenant-Inexistente');
      cy.get(SEL.multitenant.btnSwitch).click();

      cy.get(SEL.multitenant.errorMsg)
        .should('be.visible')
        .and('contain', msgs.multitenant.tenantInvalido);
    });
  });

  // ── Segurança: jogador tentando acessar painel admin ─────────────────────

  describe('Como jogador (sem permissão)', () => {
    beforeEach(() => {
      cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    });

    it('MT-06 | Jogador é bloqueado ao tentar acessar painel de tenants', { tags: ['multitenant', 'negativo', 'seguranca'] }, () => {
      cy.visit('/admin/tenants', { failOnStatusCode: false });

      cy.get(SEL.multitenant.accessDenied)
        .should('be.visible')
        .and('contain', msgs.multitenant.acessoNegado);

      cy.get(SEL.multitenant.balanceTotal).should('not.exist');
    });

    it('MT-07 | Token de jogador é rejeitado em endpoint de admin', { tags: ['multitenant', 'negativo', 'seguranca', 'api'] }, () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('BASE_URL')}/api/admin/tenants`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
        expect(res.body).to.have.property('error');
      });
    });

    it('MT-08 | Token de Tenant A não autoriza acesso a dados do Tenant B', { tags: ['multitenant', 'negativo', 'seguranca', 'api'] }, () => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('BASE_URL')}/api/admin/tenants/${dados.tenants.B}/data`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': dados.tenants.A,
          },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.be.oneOf([401, 403]);
        });
      });
    });
  });

  // ── Isolamento financeiro ─────────────────────────────────────────────────

  describe('Isolamento financeiro entre tenants', () => {
    it('MT-09 | Depósito em Tenant B não afeta saldo do Tenant A', { tags: ['multitenant', 'integridade', 'api'] }, () => {
      // Lê saldo do Tenant A antes
      cy.request({
        method: 'GET',
        url: `${Cypress.env('BASE_URL')}/api/wallet/balance`,
        headers: { 'X-Tenant-Id': dados.tenants.A },
      }).then((resSaldoAntes) => {
        const saldoAntes = resSaldoAntes.body.balance;

        // Simula depósito no Tenant B
        cy.request({
          method: 'POST',
          url: `${Cypress.env('BASE_URL')}/api/wallet/deposit`,
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Id': dados.tenants.B,
          },
          body: { amount: 500.00, payment_method: 'PIX', currency: 'BRL' },
        });

        // Verifica que saldo do Tenant A não mudou
        cy.request({
          method: 'GET',
          url: `${Cypress.env('BASE_URL')}/api/wallet/balance`,
          headers: { 'X-Tenant-Id': dados.tenants.A },
        }).then((resSaldoDepois) => {
          expect(resSaldoDepois.body.balance).to.eq(saldoAntes);
        });
      });
    });
  });
});
