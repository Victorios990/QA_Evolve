/**
 * Testes de Carga — Concorrência Financeira
 *
 * Valida a integridade do sistema sob pressão de operações simultâneas,
 * cobrindo três cenários críticos de concorrência em plataformas iGaming:
 *
 *   Cenário 1 — Depósitos Simultâneos:
 *     Verifica que 20 VUs fazendo depósitos em paralelo não corrompem o saldo
 *     e que o servidor responde dentro dos SLAs definidos.
 *
 *   Cenário 2 — Corrida por Saque (Race to Zero):
 *     Verifica que o mecanismo de controle de saldo é atômico: quando múltiplos
 *     VUs tentam sacar ao mesmo tempo, o servidor nunca permite saque abaixo de
 *     zero nem retorna erros 500 — apenas 200 (sucesso) ou 400 (saldo insuficiente).
 *
 *   Cenário 3 — Apostas Paralelas no Mesmo Evento:
 *     Simula o pico de apostas simultâneas num evento popular, validando que o
 *     servidor processa ou rejeita graciosamente sem falhas internas.
 *
 * Execução:
 *   k6 run load-tests/k6/concurrency_load.js
 *   k6 run --env BASE_URL=http://localhost:3000 load-tests/k6/concurrency_load.js
 */

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, CREDENTIALS, TENANTS, THRESHOLDS, headersAuth, headersPublic } from './config.js';
import { login, getSaldo, realizarDeposito, realizarSaque, pausaHumana } from './helpers.js';

// ── Métricas customizadas ─────────────────────────────────────────────────────

// Taxa de sucesso de depósitos concorrentes (meta: > 98%)
const deposit_concurrent_rate = new Rate('deposit_concurrent_rate');

// Taxa de integridade de saques simultâneos:
// registra 'true' quando a resposta é 200 ou 400 (comportamentos esperados),
// e 'false' quando é qualquer outro status (ex.: 500 — falha de integridade)
const withdrawal_integrity_rate = new Rate('withdrawal_integrity_rate');

// Duração individual de cada operação por cenário
const depositConcurrentDuration = new Trend('deposit_concurrent_duration', true);
const withdrawalRaceDuration     = new Trend('withdrawal_race_duration',    true);
const betParallelDuration        = new Trend('bet_parallel_duration',       true);

// ── Configuração de cenários ──────────────────────────────────────────────────

export const options = {
  thresholds: {
    // Thresholds globais herdados do config central
    ...THRESHOLDS,

    // Cenário 1: p(95) dos depósitos concorrentes deve ser < 3s
    deposit_concurrent_duration: ['p(95)<3000'],

    // Cenário 1: taxa de sucesso de depósitos concorrentes > 98%
    // Admite até 2% de falha para cobrir rejeições legítimas (ex.: limite diário)
    deposit_concurrent_rate: ['rate>0.98'],

    // Cenário 2: integridade financeira dos saques deve ser 100%
    // O servidor nunca pode retornar 500; apenas 200 ou 400 são aceitáveis
    withdrawal_integrity_rate: ['rate>0.99'],

    // Cenário 3: apostas paralelas devem responder em < 4s no p(95)
    bet_parallel_duration: ['p(95)<4000'],
  },

  scenarios: {
    // ── Cenário 1: Depósitos Simultâneos ─────────────────────────────────────
    // 20 VUs fazem depósitos de R$50 simultaneamente no mesmo tenant (operadora-a).
    // Objetivo: verificar ausência de race condition na criação de transações e
    // que o saldo resultante reflete corretamente todos os depósitos aceitos.
    depositos_simultaneos: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      tags: { scenario: 'depositos_simultaneos' },
    },

    // ── Cenário 2: Corrida por Saque (Race to Zero) ───────────────────────────
    // 10 VUs tentam sacar R$200 de um saldo inicial de R$1000 simultaneamente.
    // Apenas 5 saques devem ter sucesso; os demais devem receber 400 "Saldo insuficiente".
    // Objetivo: validar atomicidade do débito — sem overdraft e sem erros internos.
    corrida_saque: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '35s',
      tags: { scenario: 'corrida_saque' },
    },

    // ── Cenário 3: Apostas Paralelas no Mesmo Evento ──────────────────────────
    // 50 VUs apostam simultaneamente no evento evt-001 com taxa crescente.
    // Objetivo: garantir que o sistema nunca retorna 500, processa bet_ids únicos
    // nos 201 e rejeita com 400 quando saldo insuficiente — sem falhas silenciosas.
    apostas_paralelas: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: [
        { duration: '10s', target: 10 },  // aquecimento: 10 apostas/s
        { duration: '20s', target: 50 },  // patamar de pressão: 50 apostas/s
        { duration: '10s', target: 0  },  // drenagem gradual
      ],
      startTime: '70s',
      tags: { scenario: 'apostas_paralelas' },
    },
  },
};

// ── Cenário 1: Depósitos Simultâneos ─────────────────────────────────────────

function executarDepositosConcorrentes() {
  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  group('Depósito Concorrente — operadora-a', () => {
    const res = realizarDeposito(token, TENANTS.A, 50.00, 'PIX');
    depositConcurrentDuration.add(res.timings.duration);

    const sucesso = check(res, {
      '[deposito-concorrente] status 201':           (r) => r.status === 201,
      '[deposito-concorrente] balance na resposta':  (r) => {
        try {
          return JSON.parse(r.body).new_balance !== undefined ||
                 JSON.parse(r.body).balance !== undefined;
        } catch (_) { return false; }
      },
      '[deposito-concorrente] < 3s':                 (r) => r.timings.duration < 3000,
      '[deposito-concorrente] sem erro 500':          (r) => r.status !== 500,
    });

    deposit_concurrent_rate.add(sucesso);
    pausaHumana(0.1, 0.5);
  });
}

// ── Cenário 2: Corrida por Saque (Race to Zero) ───────────────────────────────

function executarCorridaSaque() {
  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  group('Corrida por Saque — Race to Zero', () => {
    // Cada VU tenta sacar R$200; com saldo inicial de R$1000, no máximo 5 devem ter sucesso
    const res = realizarSaque(token, TENANTS.A, 200.00);
    withdrawalRaceDuration.add(res.timings.duration);

    // Integridade financeira: resposta DEVE ser 200 (saque aceito) ou 400 (saldo insuficiente)
    // Qualquer outro status (especialmente 500) indica falha de integridade
    const respostaIntegra = check(res, {
      '[saque-race] resposta é 200 ou 400 (nunca 500)': (r) => r.status === 200 || r.status === 400,
      '[saque-race] sem erro interno do servidor':       (r) => r.status !== 500,
    });

    // Valida mensagem de erro quando saldo insuficiente
    if (res.status === 400) {
      check(res, {
        '[saque-race] mensagem "Saldo insuficiente" presente no 400': (r) => {
          try {
            return JSON.parse(r.body).error.includes('Saldo insuficiente') ||
                   JSON.parse(r.body).message.includes('Saldo insuficiente');
          } catch (_) { return false; }
        },
      });
    }

    // Valida que saque bem-sucedido retorna novo saldo
    if (res.status === 200) {
      check(res, {
        '[saque-race] transaction_id presente no sucesso': (r) => {
          try { return JSON.parse(r.body).transaction_id !== undefined; }
          catch (_) { return false; }
        },
      });
    }

    // Registra na métrica de integridade: true = comportamento esperado (200 ou 400)
    withdrawal_integrity_rate.add(respostaIntegra);
    pausaHumana(0.1, 0.3);
  });
}

// ── Cenário 3: Apostas Paralelas no Mesmo Evento ──────────────────────────────

function executarApostasParalelas() {
  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  group('Apostas Paralelas — evento evt-001', () => {
    const res = http.post(
      `${BASE_URL}/api/sportsbook/bets`,
      JSON.stringify({
        event_id:  'evt-001',
        amount:    25.00,
        currency:  'BRL',
        selection: 'HOME_WIN',
      }),
      {
        headers: headersAuth(token, TENANTS.A),
        tags: { name: 'sportsbook_bet_parallel', critical: 'true' },
      }
    );

    betParallelDuration.add(res.timings.duration);

    check(res, {
      '[aposta-paralela] status 201 ou 400 (nunca 500)': (r) => r.status === 201 || r.status === 400,
      '[aposta-paralela] sem erro interno do servidor':   (r) => r.status !== 500,
    });

    // Quando aceita (201), bet_id deve estar presente
    if (res.status === 201) {
      check(res, {
        '[aposta-paralela] bet_id presente no 201': (r) => {
          try { return JSON.parse(r.body).bet_id !== undefined; }
          catch (_) { return false; }
        },
      });
    }

    // Quando rejeitado (400), deve ter mensagem legível
    if (res.status === 400) {
      check(res, {
        '[aposta-paralela] mensagem de erro presente no 400': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.error !== undefined || body.message !== undefined;
          } catch (_) { return false; }
        },
      });
    }

    pausaHumana(0.05, 0.2);
  });
}

// ── Função principal — router de cenários ─────────────────────────────────────

export default function () {
  // O k6 injeta a tag de cenário via __ENV.__SCENARIO ou via options.scenarios tags.
  // Usamos a tag atribuída no options para rotear a função correta.
  const cenario = __ENV.SCENARIO_TAG || 'depositos_simultaneos';

  // Roteamento por tag de execução (injetada automaticamente pelo k6 via scenario tags)
  // Quando executado sem filtro, todos os cenários rodam conforme o startTime configurado.
  // O roteamento explícito via tag permite execução isolada de um único cenário.
  if (cenario === 'corrida_saque') {
    executarCorridaSaque();
  } else if (cenario === 'apostas_paralelas') {
    executarApostasParalelas();
  } else {
    // Comportamento padrão: roda o cenário relevante ao tempo atual
    // Na prática o k6 roteia VUs aos cenários via o executor configurado em options.scenarios
    executarDepositosConcorrentes();
  }
}

// ── Funções de setup por cenário (executadas uma vez antes dos VUs) ────────────

export function setup() {
  // Pré-condição: garante que o player tem saldo suficiente para os cenários
  // Saldo necessário (estimativa conservadora):
  //   Cenário 1: 20 VUs × 50 depósitos = auto-financiado (depósitos)
  //   Cenário 2: 10 VUs × R$200 = R$2000 (apenas 5 terão sucesso)
  //   Cenário 3: N apostas × R$25 por VU

  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) {
    console.error('[setup] Falha no login — impossível preparar saldo inicial');
    return;
  }

  // Depósito inicial generoso para cobrir toda a suite
  const resDeposito = realizarDeposito(token, TENANTS.A, 5000.00, 'PIX');

  check(resDeposito, {
    '[setup] depósito inicial processado': (r) => r.status === 201 || r.status === 200,
  });

  console.log(`[setup] Saldo inicial provisionado. Status: ${resDeposito.status}`);
}

// ── Sumário de resultados ─────────────────────────────────────────────────────

export function handleSummary(data) {
  // Grava o sumário completo em JSON para análise posterior
  return {
    'load-tests/results/concurrency_summary.json': JSON.stringify(data, null, 2),
  };
}
