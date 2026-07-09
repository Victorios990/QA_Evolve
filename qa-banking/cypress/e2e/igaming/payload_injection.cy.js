/**
 * Segurança Avançada — Injeção de Payload, Token Forgery e IDOR
 *
 * Cobre:
 *   - SQL Injection em autenticação
 *   - XSS em parâmetros de API
 *   - JWT Token Forgery (vulnerabilidade real do servidor demo)
 *   - Fuzzing de campos financeiros
 *   - IDOR entre tenants
 *
 * Pré-condições:
 *   - Servidor demo-igaming em execução em localhost:3000
 *   - Usuários player01 / Senha@123 e admin_qa / Admin@Seguro1 disponíveis
 */

const BASE = () => Cypress.env('BASE_URL');
const TENANT_A = () => Cypress.env('TENANT_A');
const TENANT_B = () => Cypress.env('TENANT_B');

describe('Segurança Avançada — Injeção de Payload, Token Forgery e IDOR', () => {

  // ── SQL Injection em autenticação ─────────────────────────────────────────

  describe('SQL Injection — Autenticação', () => {

    const payloadsSqlUsername = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR '1'='1",
    ];

    it('INJ-01 | SQL injection no username não autentica (retorna 401, sem access_token)', { tags: ['seguranca', 'injecao', 'sql', 'autenticacao'] }, () => {
      payloadsSqlUsername.forEach((payload) => {
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/auth/login`,
          body: { username: payload, password: 'qualquer_senha_qa' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status, `Payload SQL injection "${payload}" não deve autenticar`).to.eq(401);
          expect(res.body).to.not.have.property('access_token');
        });
      });
    });

    it('INJ-02 | SQL injection na senha não autentica', { tags: ['seguranca', 'injecao', 'sql', 'autenticacao'] }, () => {
      payloadsSqlUsername.forEach((payload) => {
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/auth/login`,
          body: { username: 'player01', password: payload },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status, `SQL injection na senha "${payload}" não deve autenticar`).to.eq(401);
          expect(res.body).to.not.have.property('access_token');
        });
      });
    });

    it('INJ-03 | Servidor retorna 401, não 500 (não vaza stack trace)', { tags: ['seguranca', 'injecao', 'sql', 'estabilidade'] }, () => {
      // Testa todos os payloads garantindo ausência de erro interno do servidor
      payloadsSqlUsername.forEach((payload) => {
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/auth/login`,
          body: { username: payload, password: payload },
          failOnStatusCode: false,
        }).then((res) => {
          expect(
            res.status,
            `SQL injection não deve causar erro 500 (payload: "${payload}")`
          ).to.not.eq(500);

          // Garante que nenhuma informação de stack trace ou mensagem interna é exposta
          const bodyStr = JSON.stringify(res.body).toLowerCase();
          expect(bodyStr).to.not.include('stack');
          expect(bodyStr).to.not.include('traceback');
          expect(bodyStr).to.not.include('sql');
          expect(bodyStr).to.not.include('syntax error');
        });
      });
    });

  });

  // ── XSS em parâmetros de API ──────────────────────────────────────────────

  describe('XSS — Parâmetros de API', () => {

    const payloadsXss = [
      "<script>alert('xss')</script>",
      '"><img src=x onerror=alert(1)>',
      'javascript:alert(1)',
    ];

    beforeEach(() => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    });

    it('INJ-04 | XSS no filtro de tipo de transação: Content-Type da resposta é application/json (não text/html)', { tags: ['seguranca', 'injecao', 'xss', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');

        payloadsXss.forEach((payload) => {
          cy.request({
            method: 'GET',
            url: `${BASE()}/api/transactions`,
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': TENANT_A(),
            },
            qs: { type: payload, page: 1, limit: 10 },
            failOnStatusCode: false,
          }).then((res) => {
            // O servidor não deve retornar 500 e o Content-Type nunca deve ser text/html
            expect(res.status).to.not.eq(500);
            expect(
              res.headers['content-type'],
              `XSS payload "${payload}" não deve forçar resposta text/html`
            ).to.include('application/json');
          });
        });
      });
    });

    it('INJ-05 | XSS no campo de busca de eventos: servidor não retorna eventos com XSS no nome', { tags: ['seguranca', 'injecao', 'xss', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');

        payloadsXss.forEach((payload) => {
          cy.request({
            method: 'GET',
            url: `${BASE()}/api/sportsbook/events`,
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Tenant-Id': TENANT_A(),
            },
            qs: { search: payload },
            failOnStatusCode: false,
          }).then((res) => {
            expect(res.status).to.not.eq(500);
            expect(res.headers['content-type']).to.include('application/json');

            // Se retornar eventos, nenhum deles deve ter o payload XSS no nome
            if (res.status === 200 && res.body.events) {
              res.body.events.forEach((evento) => {
                expect(
                  evento.name,
                  `Nome do evento não deve conter payload XSS`
                ).to.not.include('<script>');
                expect(evento.name).to.not.include('onerror=');
                expect(evento.name).to.not.include('javascript:');
              });
            }
          });
        });
      });
    });

  });

  // ── JWT Token Forgery (vulnerabilidade real do servidor demo) ─────────────
  //
  // SECURITY FINDING: O servidor demo usa base64 simples sem assinatura HMAC.
  // Qualquer cliente pode decodificar o token, alterar o campo `role` de 'player'
  // para 'admin' e re-encodar — o servidor aceita o token forjado sem validar
  // a integridade criptográfica.
  //
  // IMPACTO: Escalação de privilégios — qualquer player pode tornar-se admin.
  //
  // FIX RECOMENDADO: Substituir codificação base64 por jsonwebtoken com HMAC-SHA256.
  //   Exemplo: jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' })
  //            jwt.verify(token, process.env.JWT_SECRET)
  //
  // REFERÊNCIA: OWASP A07:2021 — Identification and Authentication Failures
  // ─────────────────────────────────────────────────────────────────────────────

  describe('JWT Token Forgery — Escalação de Privilégios', () => {

    it('INJ-06 | [VULNERABILITY] Token forjado com role=admin acessa endpoint admin → 200 (documenta a falha)', { tags: ['seguranca', 'jwt', 'vulnerabilidade', 'autorizacao'] }, () => {
      // Obtém token legítimo de player via API
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((tokenReal) => {

        // Decodifica o token base64, altera role para 'admin' e re-encoda
        const payloadDecodificado = JSON.parse(Buffer.from(tokenReal, 'base64').toString());

        cy.log(`Payload original: role=${payloadDecodificado.role}`);
        expect(payloadDecodificado.role).to.eq('player', 'token de player deve ter role=player antes da forja');

        const tokenForjado = Buffer.from(
          JSON.stringify({ ...payloadDecodificado, role: 'admin' })
        ).toString('base64');

        cy.log('Token forjado com role=admin criado — tentando acessar /api/admin/tenants...');

        // Tenta acessar endpoint restrito a admin com o token forjado
        cy.request({
          method: 'GET',
          url: `${BASE()}/api/admin/tenants`,
          headers: { Authorization: `Bearer ${tokenForjado}` },
          failOnStatusCode: false,
        }).then((res) => {
          // VULNERABILITY CONFIRMED: servidor aceita token forjado sem verificar HMAC
          // O assert abaixo PASSA porque o servidor é vulnerável.
          // Quando a vulnerabilidade for corrigida, este teste deve retornar 401.
          expect(res.status).to.eq(200, [
            'SECURITY FINDING CONFIRMADO:',
            'Token forjado com role=admin obteve acesso 200 ao endpoint de admin.',
            'O servidor não valida assinatura do token.',
            'Fix: usar jsonwebtoken com HMAC-SHA256 e variável JWT_SECRET no ambiente.',
          ].join(' '));
        });
      });
    });

  });

  // ── Fuzzing de Payload ────────────────────────────────────────────────────

  describe('Fuzzing — Campos Financeiros e Autenticação', () => {

    beforeEach(() => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS'));
    });

    it('INJ-07 | Deposit com amount como string retorna 400', { tags: ['seguranca', 'fuzzing', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/wallet/deposit`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': TENANT_A(),
            'Content-Type': 'application/json',
          },
          body: { amount: 'abc', payment_method: 'PIX', currency: 'BRL' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body).to.have.property('error');
        });
      });
    });

    it('INJ-08 | Deposit com body vazio retorna 400', { tags: ['seguranca', 'fuzzing', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/wallet/deposit`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': TENANT_A(),
            'Content-Type': 'application/json',
          },
          body: {},
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body).to.have.property('error');
        });
      });
    });

    it('INJ-09 | Deposit com amount negativo retorna 400', { tags: ['seguranca', 'fuzzing', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/wallet/deposit`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': TENANT_A(),
            'Content-Type': 'application/json',
          },
          body: { amount: -500.00, payment_method: 'PIX', currency: 'BRL' },
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body).to.have.property('error');
        });
      });
    });

    it('INJ-10 | Deposit com amount extremamente grande retorna 400 (limite diário)', { tags: ['seguranca', 'fuzzing', 'api'] }, () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('access_token');
        cy.request({
          method: 'POST',
          url: `${BASE()}/api/wallet/deposit`,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tenant-Id': TENANT_A(),
            'Content-Type': 'application/json',
          },
          body: { amount: Number.MAX_SAFE_INTEGER, payment_method: 'PIX', currency: 'BRL' },
          failOnStatusCode: false,
        }).then((res) => {
          // Deve rejeitar valores absurdos como limite diário excedido
          expect(res.status).to.eq(400);
          expect(res.body).to.have.property('error');
          // Garante que não causa overflow silencioso no servidor
          expect(res.status).to.not.eq(500);
        });
      });
    });

    it('INJ-11 | Login com campos ausentes retorna 401, não 500', { tags: ['seguranca', 'fuzzing', 'autenticacao'] }, () => {
      // Corpo completamente vazio
      cy.request({
        method: 'POST',
        url: `${BASE()}/api/auth/login`,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.not.eq(500, 'servidor não deve retornar 500 para body vazio');
        expect(res.status).to.be.oneOf([400, 401]);
      });

      // Apenas username, sem password
      cy.request({
        method: 'POST',
        url: `${BASE()}/api/auth/login`,
        body: { username: 'player01' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.not.eq(500, 'servidor não deve retornar 500 sem campo password');
        expect(res.status).to.be.oneOf([400, 401]);
      });

      // Apenas password, sem username
      cy.request({
        method: 'POST',
        url: `${BASE()}/api/auth/login`,
        body: { password: 'Senha@123' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.not.eq(500, 'servidor não deve retornar 500 sem campo username');
        expect(res.status).to.be.oneOf([400, 401]);
      });
    });

    it('INJ-12 | Header Content-Type errado (text/plain) com corpo JSON retorna resposta válida ou 400 (não 500)', { tags: ['seguranca', 'fuzzing', 'api'] }, () => {
      cy.request({
        method: 'POST',
        url: `${BASE()}/api/auth/login`,
        headers: { 'Content-Type': 'text/plain' },
        // Envia JSON serializado como string pura (Content-Type incorreto)
        body: JSON.stringify({ username: 'player01', password: 'Senha@123' }),
        failOnStatusCode: false,
      }).then((res) => {
        // O servidor pode aceitar (200), rejeitar (400/415) ou retornar 401 quando o corpo
        // não é parseado (Content-Type desconhecido → req.body indefinido → credenciais ausentes)
        expect(res.status).to.not.eq(500, 'Content-Type incorreto não deve causar erro interno do servidor');
        expect(res.status).to.be.oneOf([200, 400, 401, 415]);
      });
    });

  });

  // ── IDOR — Insecure Direct Object Reference ────────────────────────────────

  describe('IDOR — Acesso Cross-Tenant', () => {

    it('INJ-13 | Player não pode acessar dados de outro tenant sem permissão (retorna 403)', { tags: ['seguranca', 'idor', 'autorizacao', 'api'] }, () => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((token) => {
        // Player tenta acessar dados do tenant B usando token do tenant A
        cy.request({
          method: 'GET',
          url: `${BASE()}/api/admin/tenants/${TENANT_B()}/data`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then((res) => {
          // Player não tem role=admin, deve receber 403 (Forbidden) ou 401 (não autorizado)
          expect(
            res.status,
            `Player não deve ter acesso a dados do tenant ${TENANT_B()}`
          ).to.be.oneOf([401, 403]);
          expect(res.body).to.have.property('error');
        });
      });
    });

    it('INJ-14 | Saldo de outro tenant não é afetado por operações no tenant próprio', { tags: ['seguranca', 'idor', 'integridade', 'api'] }, () => {
      cy.loginViaApi(Cypress.env('IGAMING_USER'), Cypress.env('IGAMING_PASS')).then((token) => {
        const headers = (tenantId) => ({
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json',
        });

        // Lê saldo do tenant B antes de qualquer operação no tenant A
        cy.request({
          method: 'GET',
          url: `${BASE()}/api/wallet/balance`,
          headers: headers(TENANT_B()),
          failOnStatusCode: false,
        }).then((resAntes) => {
          // Se o player não tem conta no tenant B, o endpoint deve retornar 403 ou 404
          // e o teste confirma isolamento por ausência de acesso
          if (resAntes.status === 403 || resAntes.status === 404) {
            cy.log(`Tenant B retornou ${resAntes.status} — isolamento confirmado por controle de acesso`);
            return;
          }

          expect(resAntes.status).to.eq(200);
          const saldoBAntes = resAntes.body.balance;

          // Realiza depósito no tenant A
          cy.request({
            method: 'POST',
            url: `${BASE()}/api/wallet/deposit`,
            headers: headers(TENANT_A()),
            body: { amount: 100.00, payment_method: 'PIX', currency: 'BRL' },
            failOnStatusCode: false,
          }).then((resDeposito) => {
            expect(resDeposito.status).to.be.oneOf([200, 201]);

            // Lê saldo do tenant B após depósito no tenant A
            cy.request({
              method: 'GET',
              url: `${BASE()}/api/wallet/balance`,
              headers: headers(TENANT_B()),
              failOnStatusCode: false,
            }).then((resDepois) => {
              expect(resDepois.status).to.eq(200);
              expect(
                resDepois.body.balance,
                `Saldo do tenant B não deve ser alterado por operação no tenant A`
              ).to.eq(saldoBAntes);
            });
          });
        });
      });
    });

  });

});
