import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Trend } from 'k6/metrics'

const depositErrors = new Counter('deposit_errors')
const betErrors = new Counter('bet_errors')
const depositDuration = new Trend('deposit_duration', true)
const betDuration = new Trend('bet_duration', true)

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const TENANT = __ENV.TENANT || 'operator-a'

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      tags: { scenario: 'load' },
    },
    spike_final_campeonato: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 10 },
      ],
      preAllocatedVUs: 300,
      tags: { scenario: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
    deposit_errors: ['count<5'],
    bet_errors: ['count<10'],
  },
}

function getToken() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'player_tenant_a',
    password: 'Test@1234',
    tenant: TENANT,
  }), { headers: { 'Content-Type': 'application/json' } })

  check(res, { 'login 200': (r) => r.status === 200 })
  return res.json('token')
}

export default function () {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': TENANT,
  }

  // Depósito
  const startDeposit = Date.now()
  const depositRes = http.post(`${BASE_URL}/api/wallet/deposit`,
    JSON.stringify({ amount: 100 }), { headers })
  depositDuration.add(Date.now() - startDeposit)

  const depositOk = check(depositRes, {
    'deposit 200': (r) => r.status === 200,
    'deposit balance updated': (r) => r.json('balance') !== undefined,
  })
  if (!depositOk) depositErrors.add(1)

  sleep(0.5)

  // Aposta
  const startBet = Date.now()
  const betRes = http.post(`${BASE_URL}/api/sportsbook/bet`,
    JSON.stringify({ eventId: 'evt-001', amount: 50 }), { headers })
  betDuration.add(Date.now() - startBet)

  const betOk = check(betRes, {
    'bet 200 or 201': (r) => [200, 201].includes(r.status),
    'bet id returned': (r) => r.json('betId') !== undefined,
  })
  if (!betOk) betErrors.add(1)

  sleep(1)
}
