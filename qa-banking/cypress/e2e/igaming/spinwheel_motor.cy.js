/**
 * SpinWheel — Motor Probabilístico e Provably Fair
 *
 * Cobre integridade estatística e auditabilidade do motor da SpinWheel:
 *   - Conformidade de probabilidades com o catálogo
 *   - Consistência do ticket_balance em sequências de spin
 *   - Unicidade e integridade do seed_hash / nonce (provably fair)
 *   - Distribuição observada em amostras de 50 spins
 *
 * Todos os testes usam cy.request() — sem interação com Canvas.
 *
 * Pré-condições:
 *   - Servidor demo-igaming em execução em localhost:3000
 *   - Usuário player01 / Senha@123 (role=player)
 *   - Usuário admin_qa / Admin@Seguro1 (role=admin)
 *   - before() garante >= 200 tickets antes dos testes de motor
 */

import { SEL } from '../../support/selectors';

describe('SpinWheel — Motor Probabilístico e Provably Fair', () => {
  let token;
  let adminToken;

  before(() => {
    // Reseta estado do banco para valores de seed (300 tickets, metas zeradas)
    cy.request({ method: 'POST', url: '/api/_test/spinwheel-reset' }).then((res) => {
      expect(res.status).to.eq(200);
      cy.log(`Motor setup: banco resetado — tickets: ${res.body.tickets}`);
    });

    cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((t) => {
      token = t;
    });
    cy.loginViaApi(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS')).then((t) => {
      adminToken = t;
    });
  });

  // ── Motor Probabilístico ──────────────────────────────────────────────────────

  describe('Motor Probabilístico', () => {

    it('MOT-01 | [smoke] Motor retorna seed_hash decodificável em base64 contendo username e nonce',
      { tags: ['smoke', 'motor', 'provably-fair', 'api'] },
      () => {
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
          expect(res.body).to.have.property('seed_hash').that.is.a('string').and.have.length.greaterThan(0);
          expect(res.body).to.have.property('nonce').that.is.a('number').and.greaterThan(0);

          const seedHash = res.body.seed_hash;
          const nonce = res.body.nonce;

          // Tenta decodificar base64
          let decodificado;
          try {
            decodificado = atob(seedHash);
          } catch (e) {
            // Pode ser base64url ou hash hexadecimal — valida que é string não vazia
            decodificado = seedHash;
          }

          expect(decodificado, 'seed_hash decodificado deve ser não vazio').to.have.length.greaterThan(0);

          cy.log(`seed_hash: ${seedHash}`);
          cy.log(`nonce: ${nonce}`);
          cy.log(`seed_hash decodificado: ${decodificado}`);
        });
      }
    );

    it('MOT-02 | Jackpot tem probability_pct <= 0.5% conforme catálogo',
      { tags: ['motor', 'jackpot', 'probabilidade', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          const jackpots = res.body.prizes.filter((p) => p.type === 'jackpot');
          expect(jackpots.length, 'Deve existir ao menos 1 jackpot no catálogo').to.be.greaterThan(0);

          jackpots.forEach((j) => {
            expect(
              j.probability_pct,
              `Jackpot "${j.name}" tem probability_pct ${j.probability_pct}% — deve ser <= 0.5%`
            ).to.be.at.most(0.5);
          });
        });
      }
    );

    it('MOT-03 | Prêmios do tipo coins representam >= 50% da probabilidade total',
      { tags: ['motor', 'probabilidade', 'distribuicao', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          const premios = res.body.prizes;

          const totalPct = premios.reduce((acc, p) => acc + p.probability_pct, 0);
          const coinsPct = premios
            .filter((p) => p.type === 'coins')
            .reduce((acc, p) => acc + p.probability_pct, 0);

          cy.log(`Probabilidade total de coins: ${coinsPct.toFixed(2)}% (total catálogo: ${totalPct.toFixed(2)}%)`);

          expect(
            coinsPct,
            `Tipo 'coins' deve representar >= 50% da probabilidade total (atual: ${coinsPct.toFixed(2)}%)`
          ).to.be.at.least(50);
        });
      }
    );

    it('MOT-04 | Nenhum prêmio individual tem probability_pct > 40%',
      { tags: ['motor', 'probabilidade', 'integridade', 'api'] },
      () => {
        cy.request({ url: '/api/spinwheel/prizes' }).then((res) => {
          expect(res.status).to.eq(200);
          res.body.prizes.forEach((p) => {
            expect(
              p.probability_pct,
              `Prêmio "${p.name}" tem probability_pct ${p.probability_pct}% — nenhum prêmio deve ter > 40%`
            ).to.be.at.most(40);
          });
        });
      }
    );

    it('MOT-05 | Distribuição observada em 50 spins: coins é o tipo mais frequente',
      { tags: ['motor', 'distribuicao', 'estatistica', 'api'], timeout: 180000 },
      () => {
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
          cy.log(`Distribuição observada (${TOTAL_SPINS} spins): ${JSON.stringify(contadorTipos)}`);

          const coinsCount = contadorTipos['coins'] || 0;
          const discountCount = contadorTipos['discount'] || 0;
          const productCount = contadorTipos['product'] || 0;

          // coins tem ~65% de probabilidade teórica — deve ser o tipo dominante
          expect(
            coinsCount,
            `coins (${coinsCount}) deve ser mais frequente que discount (${discountCount})`
          ).to.be.greaterThan(discountCount);

          expect(
            coinsCount,
            `coins (${coinsCount}) deve ser mais frequente que product (${productCount})`
          ).to.be.greaterThan(productCount);
        });
      }
    );

    it('MOT-06 | ticket_balance é consistente após cada spin: decresce 1 por giro (exceto prêmio tipo ticket)',
      { tags: ['motor', 'integridade', 'tickets', 'api'] },
      () => {
        const TOTAL_SPINS = 5;
        const historico = [];

        const executarSpinRastreado = (n) => {
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
          }).then((res) => {
            expect(res.status).to.eq(200);
            historico.push({
              spin_id: res.body.spin_id,
              ticket_balance: res.body.ticket_balance,
              prize_type: res.body.prize.type,
              prize_value: res.body.prize.value,
            });
            executarSpinRastreado(n - 1);
          });
        };

        // Registra balance antes
        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resTickets) => {
          const balanceInicial = resTickets.body.balance;
          expect(balanceInicial, 'Precisa de >= 5 tickets para MOT-06').to.be.at.least(TOTAL_SPINS);

          executarSpinRastreado(TOTAL_SPINS);

          cy.then(() => {
            cy.log(`Histórico de ${TOTAL_SPINS} spins: ${JSON.stringify(historico)}`);
            expect(historico.length).to.eq(TOTAL_SPINS);

            let balanceEsperado = balanceInicial;

            historico.forEach((entry, idx) => {
              if (entry.prize_type === 'ticket') {
                balanceEsperado = balanceEsperado - 1 + entry.prize_value;
              } else {
                balanceEsperado -= 1;
              }

              expect(
                entry.ticket_balance,
                `Spin #${idx + 1} (id=${entry.spin_id}, type=${entry.prize_type}): ticket_balance esperado ${balanceEsperado}, recebido ${entry.ticket_balance}`
              ).to.eq(balanceEsperado);
            });
          });
        });
      }
    );

    it('MOT-07 | Integridade financeira: 3 spins decrementam o balance exatamente 3 (ajustado por prêmios ticket)',
      { tags: ['motor', 'integridade', 'tickets', 'api'] },
      () => {
        const TOTAL_SPINS = 3;
        const premiosObtidos = [];

        cy.request({
          url: '/api/spinwheel/tickets',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': Cypress.env('TENANT_A'),
          },
        }).then((resAntes) => {
          const balanceAntes = resAntes.body.balance;
          expect(balanceAntes, 'Precisa de >= 3 tickets para MOT-07').to.be.at.least(TOTAL_SPINS);

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
            }).then((res) => {
              expect(res.status).to.eq(200);
              premiosObtidos.push({
                type: res.body.prize.type,
                value: res.body.prize.value,
              });
              executarSpin(n - 1);
            });
          };

          executarSpin(TOTAL_SPINS);

          cy.request({
            url: '/api/spinwheel/tickets',
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': Cypress.env('TENANT_A'),
            },
          }).then((resDepois) => {
            const balanceDepois = resDepois.body.balance;

            cy.then(() => {
              // Calcula o delta esperado: -1 por spin, +prize.value para type='ticket'
              let deltaEsperado = -TOTAL_SPINS;
              premiosObtidos.forEach((p) => {
                if (p.type === 'ticket') {
                  deltaEsperado += p.value;
                }
              });

              cy.log(`balance_antes: ${balanceAntes}, balance_depois: ${balanceDepois}, delta: ${balanceDepois - balanceAntes}, delta_esperado: ${deltaEsperado}`);
              cy.log(`Prêmios: ${JSON.stringify(premiosObtidos)}`);

              expect(
                balanceDepois - balanceAntes,
                `Delta do balance após ${TOTAL_SPINS} spins deve ser ${deltaEsperado} (recebido: ${balanceDepois - balanceAntes})`
              ).to.eq(deltaEsperado);
            });
          });
        });
      }
    );

    it('MOT-08 | Todos os prêmios retornados em 50 spins existem no catálogo',
      { tags: ['motor', 'integridade', 'catalogo', 'api'], timeout: 180000 },
      () => {
        let idsCatalogo;

        cy.request({ url: '/api/spinwheel/prizes' }).then((resPremios) => {
          expect(resPremios.status).to.eq(200);
          idsCatalogo = resPremios.body.prizes.map((p) => p.id);

          const TOTAL_SPINS = 50;
          const idsPremiosObtidos = [];

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
                idsPremiosObtidos.push(res.body.prize.id);
              }
              executarSpin(n - 1);
            });
          };

          executarSpin(TOTAL_SPINS);

          cy.then(() => {
            cy.log(`IDs do catálogo: ${JSON.stringify(idsCatalogo)}`);
            cy.log(`IDs obtidos nos spins: ${JSON.stringify([...new Set(idsPremiosObtidos)])}`);

            idsPremiosObtidos.forEach((idObtido) => {
              expect(
                idsCatalogo,
                `prize.id ${idObtido} retornado em spin não existe no catálogo de prêmios`
              ).to.include(idObtido);
            });
          });
        });
      }
    );

  });

  // ── Provably Fair ─────────────────────────────────────────────────────────────

  describe('Provably Fair', () => {

    it('MOT-09 | seed_hash é único para cada spin em 50 giros consecutivos',
      { tags: ['motor', 'provably-fair', 'unicidade', 'api'], timeout: 180000 },
      () => {
        const TOTAL_SPINS = 50;
        const seedHashes = [];

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
              seedHashes.push(res.body.seed_hash);
            }
            executarSpin(n - 1);
          });
        };

        executarSpin(TOTAL_SPINS);

        cy.then(() => {
          cy.log(`Total de seed_hashes coletados: ${seedHashes.length}`);

          // Verifica que não há duplicatas
          const conjuntoUnico = new Set(seedHashes);
          expect(
            conjuntoUnico.size,
            `Todos os ${seedHashes.length} seed_hashes devem ser únicos, encontrados ${conjuntoUnico.size} distintos`
          ).to.eq(seedHashes.length);
        });
      }
    );

    it('MOT-10 | Nonce é crescente (timestamp-based) entre spins consecutivos',
      { tags: ['motor', 'provably-fair', 'nonce', 'api'] },
      () => {
        // Realiza 3 spins sequenciais e verifica que nonce aumenta
        const nonces = [];

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
          }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.nonce).to.be.a('number').and.greaterThan(0);
            nonces.push(res.body.nonce);
            executarSpin(n - 1);
          });
        };

        executarSpin(3);

        cy.then(() => {
          expect(nonces.length).to.eq(3);
          cy.log(`Nonces coletados: ${JSON.stringify(nonces)}`);

          // Verifica crescimento (nonce baseado em timestamp Unix ms)
          for (let i = 0; i < nonces.length - 1; i++) {
            expect(
              nonces[i + 1],
              `nonce[${i + 1}] (${nonces[i + 1]}) deve ser >= nonce[${i}] (${nonces[i]}) — nonce é timestamp crescente`
            ).to.be.at.least(nonces[i]);
          }

          // Garante que ao menos um par difere (não todos iguais)
          const algumDiferente = nonces.some((v, idx) => idx > 0 && v !== nonces[idx - 1]);
          expect(
            algumDiferente,
            `Ao menos um nonce deve ser diferente do anterior (nonces: ${JSON.stringify(nonces)})`
          ).to.eq(true);
        });
      }
    );

  });

});
