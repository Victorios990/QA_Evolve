/**
 * Suite Completa de Carga — iGaming
 *
 * Executa todos os cenários em sequência:
 *   Smoke → Carga Normal → Stress → Spike → Soak
 *
 * Execução:
 *   k6 run load-tests/k6/full_suite.js
 *   k6 run --env SCENARIO=spike load-tests/k6/full_suite.js
 *   k6 run --env BASE_URL=https://real-env.com load-tests/k6/full_suite.js
 *
 * Instalar k6: brew install k6  (Mac) | choco install k6 (Windows)
 */
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { CREDENTIALS, TENANTS, THRESHOLDS } from './config.js';
import {
  login, getSaldo, realizarDeposito, realizarSaque,
  realizarAposta, listarEventos, listarTransacoes, pausaHumana,
} from './helpers.js';

// ── Métricas customizadas ─────────────────────────────────────────────────────
const loginDuration      = new Trend('login_duration',      true);
const walletDuration     = new Trend('wallet_duration',     true);
const sportsbookDuration = new Trend('sportsbook_duration', true);
const historyDuration    = new Trend('history_duration',    true);
const overallSuccessRate = new Rate('overall_success_rate');
const criticalOpsTotal   = new Counter('critical_operations_total');

// ── Definição dos cenários por tipo ──────────────────────────────────────────
const SCENARIO = __ENV.SCENARIO || 'all';

function buildScenarios() {
  const all = {

    // ── Smoke: apenas 2 VUs por 30s ─────────────────────────────────────────
    smoke: {
      executor:  'constant-vus',
      vus:       2,
      duration:  '30s',
      tags:      { scenario: 'smoke' },
    },

    // ── Load: rampa até 100 VUs ──────────────────────────────────────────────
    load: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '1m', target: 50  },  // subida
        { duration: '3m', target: 100 },  // patamar principal
        { duration: '1m', target: 0   },  // descida
      ],
      startTime: '40s',
      tags:      { scenario: 'load' },
    },

    // ── Stress: encontrar ponto de ruptura ───────────────────────────────────
    stress: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '2m', target: 100  },
        { duration: '2m', target: 200  },
        { duration: '2m', target: 400  },
        { duration: '2m', target: 600  },  // ponto onde erros começam a aparecer
        { duration: '2m', target: 0    },
      ],
      startTime: '6m',
      tags:      { scenario: 'stress' },
    },

    // ── Spike: final de campeonato ───────────────────────────────────────────
    spike: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '10s', target: 10  },  // operação normal
        { duration: '5s',  target: 500 },  // spike imediato (final de Copa)
        { duration: '30s', target: 500 },  // sustentação do pico
        { duration: '10s', target: 10  },  // normalização
        { duration: '5s',  target: 0   },
      ],
      startTime: '20m',
      tags:      { scenario: 'spike' },
    },

    // ── Soak: 30 min com carga moderada (detecta memory leaks) ──────────────
    soak: {
      executor:  'constant-vus',
      vus:       50,
      duration:  '30m',
      startTime: '32m',
      tags:      { scenario: 'soak' },
    },
  };

  if (SCENARIO === 'all') return all;
  if (all[SCENARIO]) return { [SCENARIO]: all[SCENARIO] };

  console.warn(`Cenário desconhecido: ${SCENARIO}. Executando smoke.`);
  return { smoke: all.smoke };
}

// ── Configuração global ───────────────────────────────────────────────────────
export const options = {
  thresholds: {
    ...THRESHOLDS,
    login_duration:      ['p(95)<2000'],
    wallet_duration:     ['p(95)<3000'],
    sportsbook_duration: ['p(95)<3000'],
    history_duration:    ['p(95)<2000'],
    overall_success_rate: ['rate>0.98'],
  },
  scenarios: buildScenarios(),
};

// ── Jornada completa do usuário ───────────────────────────────────────────────
export default function () {
  let token;

  // 1. Login
  group('Login', () => {
    const start = Date.now();
    token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
    loginDuration.add(Date.now() - start);
    if (!token) return;
  });

  if (!token) { sleep(1); return; }

  // 2. Consulta de saldo
  group('Consulta de Saldo', () => {
    const res = getSaldo(token, TENANTS.A);
    walletDuration.add(res.timings.duration);
    const ok = check(res, {
      '[saldo] status 200':       (r) => r.status === 200,
      '[saldo] balance >= 0':     (r) => JSON.parse(r.body).balance >= 0,
    });
    overallSuccessRate.add(ok);
    criticalOpsTotal.add(1);
    pausaHumana(0.5, 1.5);
  });

  // 3. Depósito
  group('Depósito', () => {
    const res = realizarDeposito(token, TENANTS.A, 100.00, 'PIX');
    walletDuration.add(res.timings.duration);
    const ok = check(res, {
      '[depósito] status 2xx':            (r) => r.status >= 200 && r.status < 300,
      '[depósito] transaction_id existe': (r) => !!JSON.parse(r.body).transaction_id,
    });
    overallSuccessRate.add(ok);
    criticalOpsTotal.add(1);
    pausaHumana(1, 2);
  });

  // 4. Aposta (80% dos usuários apostam — simula proporção real)
  if (Math.random() < 0.8) {
    group('Aposta Esportiva', () => {
      const resEventos = listarEventos(token, TENANTS.A);
      sportsbookDuration.add(resEventos.timings.duration);

      let eventId = 'evt_001';
      try {
        const eventos = JSON.parse(resEventos.body).events;
        if (eventos?.length > 0) eventId = eventos[0].id;
      } catch (_) {}

      const resAposta = realizarAposta(token, TENANTS.A, eventId, 25.00);
      sportsbookDuration.add(resAposta.timings.duration);
      const ok = check(resAposta, {
        '[aposta] status 201':     (r) => r.status === 201,
        '[aposta] bet_id existe':  (r) => !!JSON.parse(r.body).bet_id,
        '[aposta] status é OPEN':  (r) => JSON.parse(r.body).status === 'OPEN',
      });
      overallSuccessRate.add(ok);
      criticalOpsTotal.add(1);
      pausaHumana(1, 3);
    });
  }

  // 5. Histórico de transações (50% dos usuários consultam)
  if (Math.random() < 0.5) {
    group('Histórico de Transações', () => {
      const res = listarTransacoes(token, TENANTS.A, 1);
      historyDuration.add(res.timings.duration);
      check(res, {
        '[histórico] status 200':              (r) => r.status === 200,
        '[histórico] transactions é array':    (r) => Array.isArray(JSON.parse(r.body).transactions),
        '[histórico] paginação presente':      (r) => JSON.parse(r.body).total !== undefined,
      });
      pausaHumana(0.5, 1.5);
    });
  }

  // 6. Saque (30% dos usuários)
  if (Math.random() < 0.3) {
    group('Saque', () => {
      const res = realizarSaque(token, TENANTS.A, 50.00);
      walletDuration.add(res.timings.duration);
      const ok = check(res, {
        '[saque] status 200 ou 422': (r) => [200, 422].includes(r.status),
        // 422 é esperado quando saldo insuficiente — não é falha do sistema
      });
      overallSuccessRate.add(ok);
      criticalOpsTotal.add(1);
      pausaHumana(1, 2);
    });
  }
}

// ── Relatório customizado ─────────────────────────────────────────────────────
export function handleSummary(data) {
  const report = {
    timestamp:  new Date().toISOString(),
    scenario:   SCENARIO,
    thresholds: data.metrics,
    summary: {
      total_requests:      data.metrics.http_reqs?.values?.count,
      failed_requests:     data.metrics.http_req_failed?.values?.passes,
      p95_duration_ms:     data.metrics.http_req_duration?.values?.['p(95)'],
      p99_duration_ms:     data.metrics.http_req_duration?.values?.['p(99)'],
      overall_success_rate: data.metrics.overall_success_rate?.values?.rate,
      critical_ops_total:  data.metrics.critical_operations_total?.values?.count,
    },
  };

  return {
    'load-tests/results/full_suite_summary.json': JSON.stringify(report, null, 2),
    stdout: `\n📊 Resumo: ${JSON.stringify(report.summary, null, 2)}\n`,
  };
}
