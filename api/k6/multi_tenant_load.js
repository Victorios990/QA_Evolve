import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const tenantLeakErrors = new Counter('tenant_leak_errors')
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  vus: 20,
  duration: '3m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    tenant_leak_errors: ['count==0'],
  },
}

const TENANTS = [
  { id: 'operator-a', user: 'player_tenant_a', pass: 'Test@1234' },
  { id: 'operator-b', user: 'player_tenant_b', pass: 'Test@1234' },
]

function loginTenant(tenant) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: tenant.user,
    password: tenant.pass,
    tenant: tenant.id,
  }), { headers: { 'Content-Type': 'application/json' } })
  return res.json('token')
}

export default function () {
  const tenant = TENANTS[__VU % 2]
  const token = loginTenant(tenant)

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': tenant.id,
  }

  // Tenta acessar dados do tenant correto
  const myData = http.get(`${BASE_URL}/api/transactions`, { headers })
  check(myData, { 'own transactions 200': (r) => r.status === 200 })

  // Verifica que nenhuma transação pertence a outro tenant
  if (myData.status === 200) {
    const transactions = myData.json()
    if (Array.isArray(transactions)) {
      const leaked = transactions.filter(t => t.tenantId !== tenant.id)
      if (leaked.length > 0) tenantLeakErrors.add(leaked.length)
    }
  }

  // Tenta acessar API do tenant errado com o token atual
  const otherTenantId = tenant.id === 'operator-a' ? 'operator-b' : 'operator-a'
  const crossRes = http.get(`${BASE_URL}/api/transactions`, {
    headers: { ...headers, 'X-Tenant-Id': otherTenantId },
  })
  check(crossRes, {
    'cross-tenant rejected 401 or 403': (r) => [401, 403].includes(r.status),
  })

  sleep(1)
}
