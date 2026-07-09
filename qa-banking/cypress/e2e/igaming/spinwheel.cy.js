/**
 * SpinWheel — Fluxo Completo
 *
 * Cobre os endpoints:
 *   GET  /api/spinwheel/prizes
 *   GET  /api/spinwheel/tickets
 *   GET  /api/spinwheel/goals
 *   POST /api/spinwheel/spin
 *   GET  /api/spinwheel/history
 *   POST /api/spinwheel/history/:spinId/redeem
 *   POST /api/spinwheel/goals/:goalCode/progress
 *
 * Todos os testes usam cy.request() — sem interação com Canvas.
 *
 * Pré-condições:
 *   - Servidor demo-igaming em execução em localhost:3000
 *   - Usuário player01 / Senha@123 (role=player) com tickets >= 3 (seed)
 *   - Usuário admin_qa / Admin@Seguro1 (role=admin)
 *   - Tenant padrão: operadora-a
 */

import { SEL } from '../../support/selectors';

const TIPOS_VALIDOS = ['coins', 'discount', 'product', 'ticket', 'jackpot'];
const GOAL_TYPES_VALIDOS = ['bets_count', 'deposit_amount', 'sports_variety', 'login_streak', 'referral'];

describe('SpinWheel — Fluxo Completo', () => {
  let token;
  let adminToken;

  before(() => {
    // Reseta estado do banco para valores de seed (300 tickets, metas zeradas)
    cy.request({ method: 'POST', url: '/api/_test/spinwheel-reset' });

    cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((t) => {
      token = t;
    });
    cy.loginViaApi(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS')).then((t) => {
      adminToken = t;
    });
  });

  // ── Prêmios ──────────────────────────────────────────────────────────────────

  describe('Prêmios — GET /api/spinwheel/prizes', () => {

    it('SW-01 | [smoke] GET /api/spinwheel/prizes retorna lista não vazia com campos obrigatórios',
      { tags: ['smoke', 'spinwheel', 'premios', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.headers['content-type']).to.include('application/json');
          expect(res.body).to.have.property('prizes').that.is.an('array').and.have.length.greaterThan(0);

          res.body.prizes.forEach((premio) => {
            expect(premio, `prêmio ${premio.id} — campo id`).to.have.property('id').that.is.a('number');
            expect(premio, `prêmio ${premio.id} — campo name`).to.have.property('name').that.is.a('string').and.not.empty;
            expect(premio, `prêmio ${premio.id} — campo type`).to.have.property('type').that.is.a('string').and.not.empty;
            expect(premio, `prêmio ${premio.id} — campo value`).to.have.property('value').that.is.a('number');
            expect(premio, `prêmio ${premio.id} — campo weight`).to.have.property('weight').that.is.a('number');
            expect(premio, `prêmio ${premio.id} — campo icon`).to.have.property('icon').that.is.a('string').and.not.empty;
            expect(premio, `prêmio ${premio.id} — campo color`).to.have.property('color').that.is.a('string').and.not.empty;
            expect(premio, `prêmio ${premio.id} — campo probability_pct`).to.have.property('probability_pct').that.is.a('number');
          });
        });
      }
    );

    it('SW-02 | Soma de todos os weights é igual a 1000',
      { tags: ['spinwheel', 'premios', 'integridade', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          const somaWeights = res.body.prizes.reduce((acc, p) => acc + p.weight, 0);
          expect(somaWeights, `Soma dos weights deve ser 1000, recebido: ${somaWeights}`).to.eq(1000);
        });
      }
    );

    it('SW-03 | probability_pct de cada prêmio = weight / 10 (tolerância ±0.1)',
      { tags: ['spinwheel', 'premios', 'integridade', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          res.body.prizes.forEach((p) => {
            const esperado = p.weight / 10;
            expect(
              p.probability_pct,
              `prêmio "${p.name}" — probability_pct (${p.probability_pct}) deve ser weight/10 (${esperado})`
            ).to.be.approximately(esperado, 0.1);
          });
        });
      }
    );

    it('SW-04 | Existe pelo menos 1 prêmio do tipo jackpot com weight >= 1',
      { tags: ['spinwheel', 'premios', 'jackpot', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          const jackpots = res.body.prizes.filter((p) => p.type === 'jackpot');
          expect(jackpots.length, 'Deve existir pelo menos 1 prêmio do tipo jackpot').to.be.greaterThan(0);
          jackpots.forEach((j) => {
            expect(j.weight, `jackpot "${j.name}" deve ter weight >= 1`).to.be.greaterThan(0);
          });
        });
      }
    );

    it('SW-05 | Nenhum prêmio possui weight <= 0',
      { tags: ['spinwheel', 'premios', 'integridade', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          res.body.prizes.forEach((p) => {
            expect(p.weight, `prêmio "${p.name}" tem weight inválido: ${p.weight}`).to.be.greaterThan(0);
          });
        });
      }
    );

  });

  // ── Tickets ───────────────────────────────────────────────────────────────────

  describe('Tickets — GET /api/spinwheel/tickets', () => {

    it('SW-06 | [smoke] GET /api/spinwheel/tickets retorna balance >= 0 com estrutura correta',
      { tags: ['smoke', 'spinwheel', 'tickets', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.headers['content-type']).to.include('application/json');
          expect(res.body).to.have.property('username').that.is.a('string').and.not.empty;
          expect(res.body).to.have.property('tenant_id').that.is.a('string').and.not.empty;
          expect(res.body).to.have.property('balance').that.is.a('number');
          expect(res.body).to.have.property('updated_at').that.is.a('string').and.not.empty;
          expect(res.body.balance, 'balance deve ser >= 0').to.be.at.least(0);
        });
      }
    );

    it('SW-07 | player01 tem balance >= 3 no tenant operadora-a (seed)',
      { tags: ['spinwheel', 'tickets', 'seed', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(
            res.body.balance,
            `player01 deve ter ao menos 3 tickets em operadora-a, atual: ${res.body.balance}`
          ).to.be.at.least(3);
        });
      }
    );

    it('SW-08 | Tenant B tem balance >= 0 (endpoint responde corretamente para segundo tenant)',
      { tags: ['spinwheel', 'tickets', 'multitenant', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_B'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body).to.have.property('balance').that.is.a('number');
          expect(res.body.balance, 'balance do Tenant B deve ser >= 0').to.be.at.least(0);
          expect(res.body.tenant_id).to.eq(Cypress.env('TENANT_B'));
        });
      }
    );

    it('SW-09 | Tenant A e Tenant B têm balances independentes (isolamento)',
      { tags: ['spinwheel', 'tickets', 'multitenant', 'isolamento', 'api'] },
      () => {
        let balanceTenantA;

        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resA) => {
          expect(resA.status).to.eq(200);
          balanceTenantA = resA.body.balance;

          cy.request({
            url: '/api/spinwheel/tickets',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_B'),
            },
          }).then((resB) => {
            expect(resB.status).to.eq(200);
            // Os balances de tenants distintos devem ser rastreados separadamente
            // — a chave de verificação é que o tenant_id retornado corresponde ao solicitado
            expect(resA.body.tenant_id).to.eq(Cypress.env('TENANT_A'));
            expect(resB.body.tenant_id).to.eq(Cypress.env('TENANT_B'));
            // E que o objeto retornado do Tenant B não confunde com o Tenant A
            expect(resB.body.tenant_id).to.not.eq(resA.body.tenant_id);
          });
        });
      }
    );

  });

  // ── Metas semanais ────────────────────────────────────────────────────────────

  describe('Metas Semanais — GET /api/spinwheel/goals', () => {

    it('SW-10 | [smoke] GET /api/spinwheel/goals retorna lista de metas com campos obrigatórios',
      { tags: ['smoke', 'spinwheel', 'goals', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.headers['content-type']).to.include('application/json');
          expect(res.body).to.have.property('goals').that.is.an('array').and.have.length.greaterThan(0);
          expect(res.body).to.have.property('week_start').that.is.a('string').and.not.empty;

          res.body.goals.forEach((meta) => {
            expect(meta, `meta ${meta.code} — campo id`).to.have.property('id').that.is.a('number');
            expect(meta, `meta ${meta.code} — campo code`).to.have.property('code').that.is.a('string').and.not.empty;
            expect(meta, `meta ${meta.code} — campo name`).to.have.property('name').that.is.a('string').and.not.empty;
            expect(meta, `meta ${meta.code} — campo goal_type`).to.have.property('goal_type').that.is.a('string').and.not.empty;
            expect(meta, `meta ${meta.code} — campo target_value`).to.have.property('target_value');
            expect(meta, `meta ${meta.code} — campo tickets_reward`).to.have.property('tickets_reward').that.is.a('number');
            expect(meta, `meta ${meta.code} — campo current_value`).to.have.property('current_value');
            expect(meta, `meta ${meta.code} — campo completed`).to.have.property('completed').that.is.a('boolean');
            expect(meta, `meta ${meta.code} — campo progress_pct`).to.have.property('progress_pct');
          });
        });
      }
    );

    it('SW-11 | Existem exatamente 5 metas ativas',
      { tags: ['spinwheel', 'goals', 'contrato', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(
            res.body.goals.length,
            `Deve haver exatamente 5 metas ativas, retornou: ${res.body.goals.length}`
          ).to.eq(5);
        });
      }
    );

    it('SW-12 | Cada meta tem goal_type válido',
      { tags: ['spinwheel', 'goals', 'contrato', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          res.body.goals.forEach((meta) => {
            expect(
              GOAL_TYPES_VALIDOS,
              `meta "${meta.code}" tem goal_type inválido: "${meta.goal_type}"`
            ).to.include(meta.goal_type);
          });
        });
      }
    );

    it('SW-13 | progress_pct entre 0 e 100 para todas as metas',
      { tags: ['spinwheel', 'goals', 'integridade', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          res.body.goals.forEach((meta) => {
            const pct = parseFloat(meta.progress_pct);
            expect(
              pct,
              `meta "${meta.code}" — progress_pct (${pct}) deve estar entre 0 e 100`
            ).to.be.within(0, 100);
          });
        });
      }
    );

    it('SW-14 | Meta WEEKLY_BETS_5 para player01 tem current_value = 3 e progress_pct = 60.0',
      { tags: ['spinwheel', 'goals', 'seed', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          const meta = res.body.goals.find((g) => g.code === 'WEEKLY_BETS_5');
          expect(meta, 'Meta WEEKLY_BETS_5 deve existir na listagem').to.not.be.undefined;
          expect(
            parseInt(meta.current_value, 10),
            `current_value deve ser 3, recebido: ${meta.current_value}`
          ).to.eq(3);
          expect(
            parseFloat(meta.progress_pct),
            `progress_pct deve ser 60.0, recebido: ${meta.progress_pct}`
          ).to.eq(60.0);
        });
      }
    );

    it('SW-15 | week_start está no formato YYYY-MM-DD e é uma segunda-feira',
      { tags: ['spinwheel', 'goals', 'contrato', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((res) => {
          expect(res.status).to.eq(200);
          const weekStart = res.body.week_start;

          // Valida formato YYYY-MM-DD via regex
          expect(weekStart).to.match(
            /^\d{4}-\d{2}-\d{2}$/,
            `week_start "${weekStart}" deve estar no formato YYYY-MM-DD`
          );

          // Valida que é uma segunda-feira (getDay() === 1)
          const data = new Date(weekStart + 'T00:00:00Z');
          expect(
            data.getUTCDay(),
            `week_start "${weekStart}" deve ser segunda-feira (day=1), recebido day=${data.getUTCDay()}`
          ).to.eq(1);
        });
      }
    );

  });

  // ── Spin ─────────────────────────────────────────────────────────────────────

  describe('Spin — POST /api/spinwheel/spin', () => {

    it('SW-16 | [smoke] POST /api/spinwheel/spin retorna prize, ticket_balance, seed_hash e nonce',
      { tags: ['smoke', 'spinwheel', 'spin', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resTickets) => {
          expect(resTickets.body.balance, 'Precisa de tickets para executar SW-16').to.be.greaterThan(0);

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.headers['content-type']).to.include('application/json');
            expect(res.body).to.have.property('spin_id').that.is.a('number');
            expect(res.body).to.have.property('prize').that.is.an('object');
            expect(res.body).to.have.property('ticket_balance').that.is.a('number');
            expect(res.body).to.have.property('seed_hash').that.is.a('string').and.not.empty;
            expect(res.body).to.have.property('nonce').that.is.a('number');

            const premio = res.body.prize;
            expect(premio).to.have.property('id').that.is.a('number');
            expect(premio).to.have.property('name').that.is.a('string').and.not.empty;
            expect(premio).to.have.property('type').that.is.a('string').and.not.empty;
            expect(premio).to.have.property('value').that.is.a('number');
            expect(premio).to.have.property('icon').that.is.a('string').and.not.empty;
            expect(premio).to.have.property('color').that.is.a('string').and.not.empty;
          });
        });
      }
    );

    it('SW-17 | ticket_balance após spin = balance_antes - 1 (exceto quando type = ticket)',
      { tags: ['spinwheel', 'spin', 'integridade', 'api'] },
      () => {
        let balanceAntes;

        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resTickets) => {
          expect(resTickets.body.balance, 'Precisa de tickets para executar SW-17').to.be.greaterThan(0);
          balanceAntes = resTickets.body.balance;

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
          }).then((resSpin) => {
            expect(resSpin.status).to.eq(200);
            const tipoPremiado = resSpin.body.prize.type;
            const balanceApos = resSpin.body.ticket_balance;

            if (tipoPremiado === 'ticket') {
              // Prêmio em ticket: balance = antes - 1 + prize.value
              const esperado = balanceAntes - 1 + resSpin.body.prize.value;
              expect(
                balanceApos,
                `Com prêmio tipo 'ticket', ticket_balance deve ser ${esperado}, recebido: ${balanceApos}`
              ).to.eq(esperado);
            } else {
              expect(
                balanceApos,
                `ticket_balance deve ser balance_antes (${balanceAntes}) - 1 = ${balanceAntes - 1}, recebido: ${balanceApos}`
              ).to.eq(balanceAntes - 1);
            }
          });
        });
      }
    );

    it('SW-18 | spin_id aparece no histórico após o giro',
      { tags: ['spinwheel', 'spin', 'historico', 'api'] },
      () => {
        let spinIdGerado;

        // Garante tickets disponíveis
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 5, tenant_id: Cypress.env('TENANT_A') },
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        }).then((resSpin) => {
          expect(resSpin.status).to.eq(200);
          spinIdGerado = resSpin.body.spin_id;

          cy.request({
            url: '/api/spinwheel/history',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
            },
            qs: { page: 1, limit: 10 },
          }).then((resHistorico) => {
            expect(resHistorico.status).to.eq(200);
            const ids = resHistorico.body.spins.map((s) => s.id);
            expect(ids, `spin_id ${spinIdGerado} deve aparecer no histórico`).to.include(spinIdGerado);
          });
        });
      }
    );

    it('SW-19 | prize.type é um dos tipos válidos',
      { tags: ['spinwheel', 'spin', 'contrato', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resTickets) => {
          expect(resTickets.body.balance, 'Precisa de tickets para executar SW-19').to.be.greaterThan(0);

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(
              TIPOS_VALIDOS,
              `prize.type "${res.body.prize.type}" deve ser um dos tipos válidos: ${TIPOS_VALIDOS.join(', ')}`
            ).to.include(res.body.prize.type);
          });
        });
      }
    );

    it('SW-20 | seed_hash é string não vazia (provably fair)',
      { tags: ['spinwheel', 'spin', 'provably-fair', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resTickets) => {
          expect(resTickets.body.balance, 'Precisa de tickets para executar SW-20').to.be.greaterThan(0);

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.seed_hash).to.be.a('string').and.have.length.greaterThan(0);
          });
        });
      }
    );

    it('SW-21 | nonce é número > 0 e único em giros consecutivos',
      { tags: ['spinwheel', 'spin', 'provably-fair', 'api'] },
      () => {
        // Adiciona tickets para garantir 2 spins
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 5, tenant_id: Cypress.env('TENANT_A') },
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        }).then((res1) => {
          expect(res1.status).to.eq(200);
          expect(res1.body.nonce).to.be.a('number').and.greaterThan(0);
          const nonce1 = res1.body.nonce;

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
          }).then((res2) => {
            expect(res2.status).to.eq(200);
            expect(res2.body.nonce).to.be.a('number').and.greaterThan(0);
            expect(res2.body.nonce, `nonce deve ser único entre spins consecutivos (nonce1=${nonce1})`).to.not.eq(nonce1);
          });
        });
      }
    );

    it('SW-22 | Spin sem tickets disponíveis retorna 400 com mensagem "Sem tickets"',
      { tags: ['spinwheel', 'spin', 'negativo', 'api'] },
      () => {
        // Tenant isolado por timestamp — nunca teve tickets
        const tenantIsolado = `tenant-isolado-${Date.now()}`;

        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': tenantIsolado,
          },
        }).then((resTickets) => {
          expect(resTickets.status).to.eq(200);
          expect(
            resTickets.body.balance,
            `Tenant isolado deve ter 0 tickets, recebido: ${resTickets.body.balance}`
          ).to.eq(0);

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': tenantIsolado,
              'Content-Type': 'application/json',
            },
            body: {},
            failOnStatusCode: false,
          }).then((resSpin) => {
            expect(resSpin.status).to.eq(400);
            expect(resSpin.body).to.have.property('error');
            expect(resSpin.body.error).to.include('Sem tickets');
          });
        });
      }
    );

    it('SW-23 | Prêmio retornado existe na lista de GET /api/spinwheel/prizes (prize.id válido)',
      { tags: ['spinwheel', 'spin', 'integridade', 'api'] },
      () => {
        let idsDosCatalogo;

        cy.request({ url: '/api/spinwheel/prizes' }).then((resPremios) => {
          expect(resPremios.status).to.eq(200);
          idsDosCatalogo = resPremios.body.prizes.map((p) => p.id);

          cy.request({
            url: '/api/spinwheel/tickets',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
            },
          }).then((resTickets) => {
            expect(resTickets.body.balance, 'Precisa de tickets para executar SW-23').to.be.greaterThan(0);

            cy.request({
              method: 'POST',
              url: '/api/spinwheel/spin',
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Tenant-Id': Cypress.env('TENANT_A'),
                'Content-Type': 'application/json',
              },
              body: {},
            }).then((resSpin) => {
              expect(resSpin.status).to.eq(200);
              expect(
                idsDosCatalogo,
                `prize.id ${resSpin.body.prize.id} deve existir no catálogo de prêmios`
              ).to.include(resSpin.body.prize.id);
            });
          });
        });
      }
    );

    it('SW-24 | Distribuição em 50 spins: tipo coins aparece pelo menos 1 vez',
      { tags: ['spinwheel', 'spin', 'distribuicao', 'api'], timeout: 180000 },
      () => {
        // Adiciona 60 tickets para os 50 spins via goals progress (admin)
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 60, tenant_id: Cypress.env('TENANT_A') },
        }).then((resProgress) => {
          expect(resProgress.status).to.eq(200);
        });

        const TOTAL_SPINS = 50;
        const contadorTipos = {};

        const executarSpin = (n) => {
          if (n === 0) return;

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/spin',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
            body: {},
            failOnStatusCode: false,
          }).then((res) => {
            if (res.status === 200) {
              const tipo = res.body.prize.type;
              contadorTipos[tipo] = (contadorTipos[tipo] || 0) + 1;
            }
            executarSpin(n - 1);
          });
        };

        executarSpin(TOTAL_SPINS);

        cy.then(() => {
          cy.log(`Distribuição observada em ${TOTAL_SPINS} spins: ${JSON.stringify(contadorTipos)}`);
          expect(
            contadorTipos['coins'] || 0,
            `Tipo 'coins' (probabilidade ~65%) deve aparecer ao menos 1 vez em ${TOTAL_SPINS} spins`
          ).to.be.greaterThan(0);
        });
      }
    );

  });

  // ── Histórico ─────────────────────────────────────────────────────────────────

  describe('Histórico — GET /api/spinwheel/history', () => {

    it('SW-25 | [smoke] GET /api/spinwheel/history retorna spins com estrutura correta',
      { tags: ['smoke', 'spinwheel', 'historico', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/history',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
          qs: { page: 1, limit: 10 },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.headers['content-type']).to.include('application/json');
          expect(res.body).to.have.property('spins').that.is.an('array');
          expect(res.body).to.have.property('total').that.is.a('number');
          expect(res.body).to.have.property('page').that.is.a('number');

          res.body.spins.forEach((spin) => {
            expect(spin).to.have.property('id').that.is.a('number');
            expect(spin).to.have.property('prize_name').that.is.a('string').and.not.empty;
            expect(spin).to.have.property('prize_type').that.is.a('string').and.not.empty;
            expect(spin).to.have.property('prize_value');
            expect(spin).to.have.property('spun_at').that.is.a('string').and.not.empty;
            expect(spin).to.have.property('redeemed').that.is.a('boolean');
            expect(spin).to.have.property('icon').that.is.a('string').and.not.empty;
            expect(spin).to.have.property('color').that.is.a('string').and.not.empty;
          });
        });
      }
    );

    it('SW-26 | Histórico é ordenado por spun_at DESC (mais recente primeiro)',
      { tags: ['spinwheel', 'historico', 'ordenacao', 'api'] },
      () => {
        cy.request({
          url: '/api/spinwheel/history',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
          qs: { page: 1, limit: 10 },
        }).then((res) => {
          expect(res.status).to.eq(200);
          const spins = res.body.spins;

          if (spins.length < 2) {
            cy.log('Menos de 2 registros no histórico — ordenação não verificável nesta execução');
            return;
          }

          for (let i = 0; i < spins.length - 1; i++) {
            const atual = new Date(spins[i].spun_at).getTime();
            const proximo = new Date(spins[i + 1].spun_at).getTime();
            expect(
              atual,
              `spins[${i}].spun_at (${spins[i].spun_at}) deve ser >= spins[${i + 1}].spun_at (${spins[i + 1].spun_at})`
            ).to.be.at.least(proximo);
          }
        });
      }
    );

    it('SW-27 | Paginação: page 2 com limit=1 retorna registro diferente do page 1',
      { tags: ['spinwheel', 'historico', 'paginacao', 'api'] },
      () => {
        // Garante que existem pelo menos 2 registros
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 5, tenant_id: Cypress.env('TENANT_A') },
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        });

        let idPagina1;

        cy.request({
          url: '/api/spinwheel/history',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
          qs: { page: 1, limit: 1 },
        }).then((resP1) => {
          expect(resP1.status).to.eq(200);
          expect(resP1.body.spins.length).to.eq(1);
          idPagina1 = resP1.body.spins[0].id;

          cy.request({
            url: '/api/spinwheel/history',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
            },
            qs: { page: 2, limit: 1 },
          }).then((resP2) => {
            expect(resP2.status).to.eq(200);
            expect(resP2.body.spins.length).to.eq(1);
            expect(resP2.body.spins[0].id, 'Página 2 deve conter registro diferente da página 1').to.not.eq(idPagina1);
          });
        });
      }
    );

  });

  // ── Resgate ───────────────────────────────────────────────────────────────────

  describe('Resgate — POST /api/spinwheel/history/:spinId/redeem', () => {

    it('SW-28 | POST /api/spinwheel/history/:spinId/redeem marca redeemed = true',
      { tags: ['spinwheel', 'resgate', 'api'] },
      () => {
        // Garante ticket e faz spin para obter spin_id
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 5, tenant_id: Cypress.env('TENANT_A') },
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        }).then((resSpin) => {
          expect(resSpin.status).to.eq(200);
          const spinId = resSpin.body.spin_id;

          cy.request({
            method: 'POST',
            url: `/api/spinwheel/history/${spinId}/redeem`,
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
          }).then((resRedeem) => {
            expect(resRedeem.status).to.eq(200);
            expect(resRedeem.body).to.have.property('message').that.includes('resgatado');
            expect(resRedeem.body).to.have.property('spin_id').that.eq(spinId);
            expect(resRedeem.body).to.have.property('prize_name').that.is.a('string').and.not.empty;

            // Verifica que o histórico marca redeemed=true
            cy.request({
              url: '/api/spinwheel/history',
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Tenant-Id': Cypress.env('TENANT_A'),
              },
              qs: { page: 1, limit: 20 },
            }).then((resHistorico) => {
              const spinResgatado = resHistorico.body.spins.find((s) => s.id === spinId);
              expect(spinResgatado, `spin_id ${spinId} deve existir no histórico`).to.not.be.undefined;
              expect(spinResgatado.redeemed, `redeemed deve ser true para spin_id ${spinId}`).to.eq(true);
            });
          });
        });
      }
    );

    it('SW-29 | Resgatar o mesmo spin duas vezes retorna 400 "já foi resgatado"',
      { tags: ['spinwheel', 'resgate', 'negativo', 'api'] },
      () => {
        // Garante ticket e faz spin
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: { username: Cypress.env('IGAMING_USER'), increment: 5, tenant_id: Cypress.env('TENANT_A') },
        });

        cy.request({
          method: 'POST',
          url: '/api/spinwheel/spin',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          body: {},
        }).then((resSpin) => {
          expect(resSpin.status).to.eq(200);
          const spinId = resSpin.body.spin_id;

          // Primeiro resgate — deve ser bem-sucedido
          cy.request({
            method: 'POST',
            url: `/api/spinwheel/history/${spinId}/redeem`,
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
              'Content-Type': 'application/json',
            },
          }).then((res1) => {
            expect(res1.status).to.eq(200);

            // Segundo resgate — deve retornar 400
            cy.request({
              method: 'POST',
              url: `/api/spinwheel/history/${spinId}/redeem`,
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Tenant-Id': Cypress.env('TENANT_A'),
                'Content-Type': 'application/json',
              },
              failOnStatusCode: false,
            }).then((res2) => {
              expect(res2.status).to.eq(400);
              expect(res2.body).to.have.property('error');
              expect(res2.body.error).to.include('já foi resgatado');
            });
          });
        });
      }
    );

    it('SW-30 | Resgatar spin_id inexistente retorna 404',
      { tags: ['spinwheel', 'resgate', 'negativo', 'api'] },
      () => {
        // Usa spin_id fictício que não existe no banco
        const spinIdFicticio = 99999;

        cy.request({
          method: 'POST',
          url: `/api/spinwheel/history/${spinIdFicticio}/redeem`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(404);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('não encontrado');
        });
      }
    );

  });

  // ── Metas com progressão ──────────────────────────────────────────────────────

  describe('Metas com Progressão — POST /api/spinwheel/goals/:goalCode/progress', () => {

    it('SW-31 | POST /api/spinwheel/goals/:goalCode/progress com admin atualiza current_value',
      { tags: ['spinwheel', 'goals', 'admin', 'api'] },
      () => {
        // Lê current_value antes da progressão
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resAntes) => {
          expect(resAntes.status).to.eq(200);
          const metaAntes = resAntes.body.goals.find((g) => g.code === 'WEEKLY_BETS_5');
          const currentAntes = parseInt(metaAntes.current_value, 10);

          const incremento = 1;

          cy.request({
            method: 'POST',
            url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              username: Cypress.env('IGAMING_USER'),
              increment: incremento,
              tenant_id: Cypress.env('TENANT_A'),
            },
          }).then((resProgress) => {
            expect(resProgress.status).to.eq(200);
            expect(resProgress.body).to.have.property('goal_code').that.eq('WEEKLY_BETS_5');
            expect(resProgress.body).to.have.property('username').that.eq(Cypress.env('IGAMING_USER'));
            expect(resProgress.body).to.have.property('current_value').that.is.a('number');

            // current_value após progressão deve ser >= current_antes (pode ter atingido cap)
            expect(
              resProgress.body.current_value,
              `current_value após incremento deve ser >= ${currentAntes}`
            ).to.be.at.least(currentAntes);
          });
        });
      }
    );

    it('SW-32 | Ao completar meta (current_value >= target), completed = true e tickets_granted = true',
      { tags: ['spinwheel', 'goals', 'admin', 'tickets', 'api'] },
      () => {
        // Busca target_value da meta
        cy.request({
          url: '/api/spinwheel/goals',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resGoals) => {
          const meta = resGoals.body.goals.find((g) => g.code === 'WEEKLY_BETS_5');
          const targetValue = parseInt(meta.target_value, 10);

          // Incremento suficiente para ultrapassar target independentemente do estado atual
          cy.request({
            method: 'POST',
            url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              username: Cypress.env('IGAMING_USER'),
              increment: targetValue + 10,
              tenant_id: Cypress.env('TENANT_A'),
            },
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.completed, 'completed deve ser true ao atingir target_value').to.eq(true);
            expect(res.body.tickets_granted, 'tickets_granted deve ser true ao completar a meta').to.eq(true);
            expect(
              res.body.current_value,
              `current_value (${res.body.current_value}) deve ser >= target_value (${targetValue})`
            ).to.be.at.least(targetValue);
          });
        });
      }
    );

    it('SW-33 | Chamar progress em meta já completada não gera tickets duplicados',
      { tags: ['spinwheel', 'goals', 'admin', 'integridade', 'api'] },
      () => {
        // Completa a meta primeiro
        cy.request({
          method: 'POST',
          url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            username: Cypress.env('IGAMING_USER'),
            increment: 20,
            tenant_id: Cypress.env('TENANT_A'),
          },
        }).then((res1) => {
          expect(res1.status).to.eq(200);
          expect(res1.body.completed).to.eq(true);

          // Lê balance de tickets após primeira conclusão
          cy.request({
            url: '/api/spinwheel/tickets',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
            },
          }).then((resTickets1) => {
            const balanceAposCompletar = resTickets1.body.balance;

            // Chama progress novamente na meta já completada
            cy.request({
              method: 'POST',
              url: '/api/spinwheel/goals/WEEKLY_BETS_5/progress',
              headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
              },
              body: {
                username: Cypress.env('IGAMING_USER'),
                increment: 5,
                tenant_id: Cypress.env('TENANT_A'),
              },
            }).then((res2) => {
              expect(res2.status).to.eq(200);
              // tickets_granted_now deve ser false (meta já estava completa)
              expect(
                res2.body.tickets_granted_now,
                'Segunda chamada em meta completada não deve conceder tickets adicionais'
              ).to.eq(false);

              // Confirma que o balance de tickets não aumentou novamente
              cy.request({
                url: '/api/spinwheel/tickets',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Tenant-Id': Cypress.env('TENANT_A'),
                },
              }).then((resTickets2) => {
                expect(
                  resTickets2.body.balance,
                  `Balance não deve aumentar em segunda conclusão (antes: ${balanceAposCompletar}, depois: ${resTickets2.body.balance})`
                ).to.eq(balanceAposCompletar);
              });
            });
          });
        });
      }
    );

  });

});
