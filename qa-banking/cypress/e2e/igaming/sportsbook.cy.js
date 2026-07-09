import { SEL } from '../../support/selectors';

describe('Apostas Esportivas (Sportsbook)', () => {
  let dados;
  let msgs;

  before(() => {
    cy.fixture('igaming').then((d)   => { dados = d; });
    cy.fixture('mensagens').then((m) => { msgs  = m; });
  });

  beforeEach(() => {
    cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    cy.acessarSportsbook();
  });

  // ── Realização de aposta ──────────────────────────────────────────────────

  it('SB-01 | [smoke] Realizar aposta em evento disponível', { tags: ['smoke', 'sportsbook', 'positivo'] }, () => {
    cy.interceptarAposta();
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.realizarAposta(dados.sportsbook.apostaValida);

    cy.wait('@apiAposta').then((intercept) => {
      expect(intercept.response.statusCode).to.eq(201);
      expect(intercept.response.body).to.have.property('bet_id');
      expect(intercept.response.body.status).to.eq('OPEN');
    });

    cy.get(SEL.sportsbook.successMsg)
      .should('be.visible')
      .and('contain', msgs.sportsbook.apostaSucesso);
  });

  it('SB-02 | Odds são exibidas e maiores que 1.00', { tags: ['sportsbook', 'positivo'] }, () => {
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();

    cy.get(SEL.sportsbook.firstEventOdds)
      .should('be.visible')
      .invoke('text')
      .then((texto) => {
        const odds = parseFloat(texto.trim().replace(',', '.'));
        expect(odds).to.be.greaterThan(1.0);
      });
  });

  it('SB-03 | Saldo é debitado após aposta confirmada', { tags: ['sportsbook', 'positivo', 'integridade'] }, () => {
    cy.visit('/account/wallet');
    cy.getSaldo().then((saldoAntes) => {
      cy.acessarSportsbook();
      cy.pesquisarEvento(dados.sportsbook.eventoValido);
      cy.selecionarPrimeiroEvento();
      cy.realizarAposta(dados.sportsbook.apostaValida);
      cy.get(SEL.sportsbook.successMsg).should('be.visible');

      cy.visit('/account/wallet');
      cy.getSaldo().then((saldoDepois) => {
        const aposta = parseFloat(dados.sportsbook.apostaValida);
        expect(saldoDepois).to.be.approximately(saldoAntes - aposta, 0.01);
      });
    });
  });

  // ── Cancelamento ─────────────────────────────────────────────────────────

  it('SB-04 | Cancelar aposta aberta devolve crédito', { tags: ['sportsbook', 'positivo'] }, () => {
    // Coloca uma aposta primeiro
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.realizarAposta(dados.sportsbook.apostaValida);
    cy.get(SEL.sportsbook.successMsg).should('be.visible');

    // Cancela
    cy.get(SEL.sportsbook.openBetsTab).click();
    cy.get(SEL.sportsbook.firstOpenBet).should('be.visible').click();
    cy.get(SEL.sportsbook.btnCancelBet).click();

    cy.get(SEL.sportsbook.successMsg)
      .should('be.visible')
      .and('contain', msgs.sportsbook.cancelSucesso);
  });

  // ── Cenários negativos ────────────────────────────────────────────────────

  it('SB-05 | Aposta com saldo insuficiente é bloqueada', { tags: ['sportsbook', 'negativo'] }, () => {
    cy.intercept('GET', '/api/wallet/balance', {
      statusCode: 200,
      body: { balance: 0.00, currency: 'BRL' },
    }).as('saldoZerado');

    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.realizarAposta(dados.sportsbook.apostaValida);

    cy.get(SEL.sportsbook.errorMsg)
      .should('be.visible')
      .and('contain', msgs.sportsbook.saldoInsuficiente);
  });

  it('SB-06 | Aposta abaixo do valor mínimo é rejeitada', { tags: ['sportsbook', 'negativo'] }, () => {
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.realizarAposta(dados.sportsbook.apostaMinima);

    cy.get(SEL.sportsbook.errorMsg)
      .should('be.visible')
      .and('contain', msgs.sportsbook.abaixoMinimo);
  });

  it('SB-07 | Aposta acima do valor máximo é rejeitada', { tags: ['sportsbook', 'negativo'] }, () => {
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.realizarAposta(dados.sportsbook.apostaMaxima);

    cy.get(SEL.sportsbook.errorMsg)
      .should('be.visible')
      .and('contain', msgs.sportsbook.acimaMaximo);
  });

  it('SB-08 | Evento encerrado não permite aposta', { tags: ['sportsbook', 'negativo'] }, () => {
    cy.pesquisarEvento(dados.sportsbook.eventoEncerrado);

    cy.get(SEL.sportsbook.eventUnavailable)
      .should('be.visible');
  });

  // ── Mudança de odds ───────────────────────────────────────────────────────

  it('SB-09 | Alerta exibido quando odds mudam durante preenchimento', { tags: ['sportsbook', 'positivo'] }, () => {
    cy.pesquisarEvento(dados.sportsbook.eventoValido);
    cy.selecionarPrimeiroEvento();
    cy.get(SEL.sportsbook.betAmount).type(dados.sportsbook.apostaValida);

    // Simula mudança de odds via intercept
    cy.intercept('GET', '/api/sportsbook/events/*', (req) => {
      req.reply((res) => {
        res.body.odds_changed = true;
        res.send(res.body);
      });
    });

    cy.get(SEL.sportsbook.oddsChanged).should('be.visible');
  });

  // ── API de sportsbook ─────────────────────────────────────────────────────

  it('SB-10 | API de eventos retorna odds válidas', { tags: ['sportsbook', 'api'] }, () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('BASE_URL')}/api/sportsbook/events`,
      headers: { 'X-Tenant-Id': Cypress.env('TENANT_A') },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.events).to.be.an('array').and.have.length.greaterThan(0);
      res.body.events.forEach((evento) => {
        expect(evento.odds).to.be.a('number').and.to.be.greaterThan(1.0);
        expect(evento).to.have.property('id');
        expect(evento).to.have.property('name');
      });
    });
  });
});
