/**
 * Testes de Carga — Sportsbook (Apostas Esportivas)
 *
 * Execução:
 *   k6 run load-tests/k6/sportsbook_load.js
 *   k6 run --env BASE_URL=https://real-env.com load-tests/k6/sportsbook_load.js
 */
import { check, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { CREDENTIALS, TENANTS, THRESHOLDS } from './config.js';
import { login, listarEventos, realizarAposta, pausaHumana } from './helpers.js';

// ── Métricas customizadas ─────────────────────────────────────────────────────
const eventListDuration  = new Trend('sb_event_list_duration',  true);
const betPlaceDuration   = new Trend('sb_bet_place_duration',   true);
const betSuccessRate     = new Rate('sb_bet_success_rate');
const totalBets          = new Counter('total_bets_placed');

// ── Cenários ──────────────────────────────────────────────────────────────────
export const options = {
  thresholds: {
    ...THRESHOLDS,
    sb_event_list_duration: ['p(95)<1500'],
    sb_bet_place_duration:  ['p(95)<3000', 'p(99)<5000'],
    sb_bet_success_rate:    ['rate>0.98'],
  },
  scenarios: {
    // Smoke: verifica funcionamento básico
    smoke: {
      executor: 'constant-vus',
      vus: 3,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Carga: operação normal de sportsbook
    carga_normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },  // aquecimento
        { duration: '3m', target: 100 },  // patamar
        { duration: '1m', target: 0   },
      ],
      startTime: '35s',
      tags: { scenario: 'carga_normal' },
    },
    // Spike de final: simula pico de apostas nos minutos antes de um jogo importante
    pico_final_campeonato: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      stages: [
        { duration: '10s', target: 50  },  // 50 apostas/s
        { duration: '30s', target: 200 },  // pico: 200 apostas/s
        { duration: '20s', target: 50  },  // arrefecimento
        { duration: '10s', target: 0   },
      ],
      startTime: '7m',
      tags: { scenario: 'pico_final_campeonato' },
    },
  },
};

// ── Fluxo principal ───────────────────────────────────────────────────────────
export default function () {
  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  let primeiroEventoId = 'evt_001';

  group('Listagem de Eventos', () => {
    const res = listarEventos(token, TENANTS.A);
    eventListDuration.add(res.timings.duration);
    check(res, {
      '[eventos] status 200':         (r) => r.status === 200,
      '[eventos] lista não vazia':    (r) => JSON.parse(r.body).events?.length > 0,
      '[eventos] odds > 1.0':         (r) => {
        const events = JSON.parse(r.body).events;
        return events && events.every(e => e.odds > 1.0);
      },
      '[eventos] < 1.5s':             (r) => r.timings.duration < 1500,
    });

    try {
      const events = JSON.parse(res.body).events;
      if (events && events.length > 0) primeiroEventoId = events[0].id;
    } catch (_) {}

    pausaHumana(0.5, 2);
  });

  group('Realização de Aposta', () => {
    const res = realizarAposta(token, TENANTS.A, primeiroEventoId, 25.00);
    betPlaceDuration.add(res.timings.duration);

    const ok = check(res, {
      '[aposta] status 201':              (r) => r.status === 201,
      '[aposta] bet_id presente':         (r) => JSON.parse(r.body).bet_id !== undefined,
      '[aposta] status OPEN':             (r) => JSON.parse(r.body).status === 'OPEN',
      '[aposta] saldo debitado':          (r) => JSON.parse(r.body).new_balance !== undefined,
      '[aposta] < 3s':                    (r) => r.timings.duration < 3000,
    });
    betSuccessRate.add(ok);
    totalBets.add(1);
    pausaHumana(1, 3);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/sportsbook_summary.json': JSON.stringify(data, null, 2),
  };
}
