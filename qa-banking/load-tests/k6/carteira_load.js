/**
 * Testes de Carga — Carteira (Wallet)
 *
 * Execução:
 *   k6 run load-tests/k6/carteira_load.js
 *   k6 run --env BASE_URL=https://real-env.com load-tests/k6/carteira_load.js
 */
import { check, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { CREDENTIALS, TENANTS, THRESHOLDS } from './config.js';
import { login, getSaldo, realizarDeposito, realizarSaque, pausaHumana } from './helpers.js';

// ── Métricas customizadas ─────────────────────────────────────────────────────
const depositDuration    = new Trend('wallet_deposit_duration',    true);
const withdrawDuration   = new Trend('wallet_withdraw_duration',   true);
const balanceDuration    = new Trend('wallet_balance_duration',    true);
const depositSuccessRate = new Rate('wallet_deposit_success_rate');
const withdrawSuccessRate = new Rate('wallet_withdraw_success_rate');
const totalDeposits      = new Counter('total_deposits');
const totalWithdrawals   = new Counter('total_withdrawals');

// ── Cenários ──────────────────────────────────────────────────────────────────
export const options = {
  thresholds: {
    ...THRESHOLDS,
    wallet_deposit_duration:   ['p(95)<3000'],
    wallet_withdraw_duration:  ['p(95)<3000'],
    wallet_balance_duration:   ['p(95)<1000'],
    wallet_deposit_success_rate:  ['rate>0.98'],
    wallet_withdraw_success_rate: ['rate>0.98'],
  },
  scenarios: {
    // Smoke: valida que o ambiente está de pé antes de qualquer carga
    smoke: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Carga normal: simula operações regulares do dia
    carga_normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50  },  // subida gradual
        { duration: '3m', target: 50  },  // patamar de carga
        { duration: '1m', target: 0   },  // descida
      ],
      startTime: '35s',
      tags: { scenario: 'carga_normal' },
    },
    // Pico: simula rush de apostas numa final de campeonato
    pico: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 },  // spike súbito
        { duration: '30s', target: 200 },  // patamar de pico
        { duration: '10s', target: 0   },  // recuperação
      ],
      startTime: '7m',
      tags: { scenario: 'pico' },
    },
  },
};

// ── Fluxo principal ───────────────────────────────────────────────────────────
export default function () {
  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  group('Consulta de Saldo', () => {
    const res = getSaldo(token, TENANTS.A);
    balanceDuration.add(res.timings.duration);
    check(res, {
      '[saldo] status 200':             (r) => r.status === 200,
      '[saldo] balance é número':       (r) => typeof JSON.parse(r.body).balance === 'number',
      '[saldo] balance não negativo':   (r) => JSON.parse(r.body).balance >= 0,
      '[saldo] currency presente':      (r) => JSON.parse(r.body).currency !== undefined,
    });
    pausaHumana(0.5, 1.5);
  });

  group('Depósito via PIX', () => {
    const res = realizarDeposito(token, TENANTS.A, 100.00, 'PIX');
    depositDuration.add(res.timings.duration);
    const ok = check(res, {
      '[depósito] status 200 ou 201':     (r) => [200, 201].includes(r.status),
      '[depósito] transaction_id presente': (r) => JSON.parse(r.body).transaction_id !== undefined,
      '[depósito] novo saldo retornado':  (r) => JSON.parse(r.body).new_balance !== undefined,
      '[depósito] < 3s':                  (r) => r.timings.duration < 3000,
    });
    depositSuccessRate.add(ok);
    totalDeposits.add(1);
    pausaHumana(1, 2);
  });

  group('Saque', () => {
    const res = realizarSaque(token, TENANTS.A, 50.00);
    withdrawDuration.add(res.timings.duration);
    const ok = check(res, {
      '[saque] status 200':               (r) => r.status === 200,
      '[saque] transaction_id presente':  (r) => JSON.parse(r.body).transaction_id !== undefined,
      '[saque] < 3s':                     (r) => r.timings.duration < 3000,
    });
    withdrawSuccessRate.add(ok);
    totalWithdrawals.add(1);
    pausaHumana(1, 3);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/carteira_summary.json': JSON.stringify(data, null, 2),
  };
}
