import { SEL } from '../../support/selectors';

describe('Histórico de Transações', () => {
  let dados;
  let msgs;

  before(() => {
    cy.fixture('igaming').then((d)   => { dados = d; });
    cy.fixture('mensagens').then((m) => { msgs  = m; });
  });

  beforeEach(() => {
    cy.login(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    cy.acessarHistorico();
  });

  // ── Listagem básica ───────────────────────────────────────────────────────

  it('HT-01 | [smoke] Tabela de transações é exibida', { tags: ['smoke', 'historico', 'positivo'] }, () => {
    cy.get(SEL.historico.table).should('be.visible');
    cy.get(SEL.historico.tableRows).should('have.length.greaterThan', 0);
  });

  it('HT-02 | Todas as colunas esperadas estão presentes', { tags: ['historico', 'positivo'] }, () => {
    cy.get(SEL.historico.table).within(() => {
      cy.get('thead th').should('contain', 'Data');
      cy.get('thead th').should('contain', 'Tipo');
      cy.get('thead th').should('contain', 'Valor');
      cy.get('thead th').should('contain', 'Status');
    });
  });

  // ── Filtros ───────────────────────────────────────────────────────────────

  it('HT-03 | Filtro por tipo "Depósito" retorna apenas depósitos', { tags: ['historico', 'positivo'] }, () => {
    cy.filtrarPorTipo(dados.historico.tipoDeposito);
    cy.aplicarFiltros();

    cy.get(SEL.historico.tableRows).each(($row) => {
      cy.wrap($row).find('td.type').should('contain', dados.historico.tipoDeposito);
    });
  });

  it('HT-04 | Filtro por tipo "Saque" retorna apenas saques', { tags: ['historico', 'positivo'] }, () => {
    cy.filtrarPorTipo(dados.historico.tipoSaque);
    cy.aplicarFiltros();

    cy.get(SEL.historico.tableRows).each(($row) => {
      cy.wrap($row).find('td.type').should('contain', dados.historico.tipoSaque);
    });
  });

  it('HT-05 | Filtro por período de datas válido', { tags: ['historico', 'positivo'] }, () => {
    cy.intercept('GET', '/api/transactions*').as('apiTransacoes');
    cy.filtrarPorPeriodo(dados.historico.dataInicio, dados.historico.dataFim);
    cy.aplicarFiltros();

    cy.wait('@apiTransacoes').then((intercept) => {
      expect(intercept.request.url).to.include('date_from');
      expect(intercept.request.url).to.include('date_to');
    });
    cy.get(SEL.historico.table).should('be.visible');
  });

  it('HT-06 | Período inválido (início > fim) exibe erro', { tags: ['historico', 'negativo'] }, () => {
    cy.filtrarPorPeriodo(dados.historico.dataInicioInvalida, dados.historico.dataFimInvalida);
    cy.aplicarFiltros();

    cy.get(SEL.historico.errorMsg)
      .should('be.visible')
      .and('contain', msgs.historico.periodoInvalido);
  });

  it('HT-07 | Período sem transações exibe estado vazio', { tags: ['historico', 'negativo'] }, () => {
    cy.filtrarPorPeriodo('01/01/2000', '02/01/2000');
    cy.aplicarFiltros();

    cy.get(SEL.historico.noResults)
      .should('be.visible')
      .and('contain', msgs.historico.semResultados);
    cy.get(SEL.historico.tableRows).should('not.exist');
  });

  it('HT-08 | Filtro por faixa de valor retorna transações corretas', { tags: ['historico', 'positivo'] }, () => {
    cy.filtrarPorValor(dados.historico.valorMinFiltro, dados.historico.valorMaxFiltro);
    cy.aplicarFiltros();

    cy.get(SEL.historico.tableRows).each(($row) => {
      cy.wrap($row)
        .find('td.amount')
        .invoke('text')
        .then((txt) => {
          const valor = parseFloat(txt.replace(/[^0-9.,]/g, '').replace(',', '.'));
          expect(valor).to.be.within(
            parseFloat(dados.historico.valorMinFiltro),
            parseFloat(dados.historico.valorMaxFiltro)
          );
        });
    });
  });

  // ── Exportação ────────────────────────────────────────────────────────────

  it('HT-09 | Exportação CSV dispara o download', { tags: ['historico', 'positivo'] }, () => {
    cy.intercept('GET', '/api/transactions/export*').as('exportCsv');
    cy.get(SEL.historico.btnExportCsv).click();

    cy.wait('@exportCsv').then((intercept) => {
      expect(intercept.response.statusCode).to.eq(200);
    });
  });

  // ── Paginação ─────────────────────────────────────────────────────────────

  it('HT-10 | Paginação carrega registros diferentes na página 2', { tags: ['historico', 'positivo'] }, () => {
    let idsPagina1 = [];

    cy.get(SEL.historico.tableRows)
      .then(($rows) => {
        idsPagina1 = [...$rows].map((r) => r.getAttribute('data-id'));
      });

    cy.get(SEL.historico.nextPage).should('be.visible').click();
    cy.get(SEL.historico.table).should('be.visible');

    cy.get(SEL.historico.tableRows).then(($rows) => {
      const idsPagina2 = [...$rows].map((r) => r.getAttribute('data-id'));
      const overlap = idsPagina1.filter((id) => idsPagina2.includes(id));
      expect(overlap).to.have.length(0);
    });
  });

  // ── Integridade ───────────────────────────────────────────────────────────

  it('HT-11 | Depósito aparece no histórico com valor correto', { tags: ['historico', 'positivo', 'integridade'] }, () => {
    const valor = '150.00';

    // Setup: realiza depósito e navega para histórico
    cy.visit('/account/wallet');
    cy.realizarDeposito(valor, 'PIX');
    cy.get(SEL.wallet.successMsg).should('be.visible');

    cy.acessarHistorico();
    cy.filtrarPorTipo(dados.historico.tipoDeposito);
    cy.aplicarFiltros();

    cy.get(SEL.historico.firstRowAmount)
      .invoke('text')
      .then((txt) => {
        const valorExibido = parseFloat(txt.replace(/[^0-9.,]/g, '').replace(',', '.'));
        expect(valorExibido).to.eq(parseFloat(valor));
      });
  });

  // ── API de histórico ──────────────────────────────────────────────────────

  it('HT-12 | API de transações retorna estrutura paginada', { tags: ['historico', 'api'] }, () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('BASE_URL')}/api/transactions?page=1&limit=20`,
      headers: { 'X-Tenant-Id': Cypress.env('TENANT_A') },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('transactions').that.is.an('array');
      expect(res.body).to.have.property('total').that.is.a('number');
      expect(res.body).to.have.property('page').that.eq(1);
    });
  });
});
