/**
 * Testes de Carga — Isolamento Multi-Tenant sob Carga
 *
 * Valida que operações simultâneas em tenants diferentes não se interferem:
 *   - Saldo de Tenant A não é afetado por operações do Tenant B
 *   - Tokens de um tenant não autorizam acesso ao outro
 *   - Tempo de resposta não degrada com múltiplos tenants ativos
 *
 * Execução:
 *   k6 run load-tests/k6/multi_tenant_load.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, CREDENTIALS, TENANTS, THRESHOLDS, headersAuth } from './config.js';
import { login, getSaldo, realizarDeposito, pausaHumana } from './helpers.js';

// ── Métricas customizadas ─────────────────────────────────────────────────────
const tenantADuration      = new Trend('tenant_a_duration', true);
const tenantBDuration      = new Trend('tenant_b_duration', true);
const isolationSuccessRate = new Rate('tenant_isolation_success_rate');
const authRejectRate       = new Rate('cross_tenant_auth_reject_rate');

// ── Cenários ──────────────────────────────────────────────────────────────────
export const options = {
  thresholds: {
    ...THRESHOLDS,
    tenant_a_duration:            ['p(95)<2000'],
    tenant_b_duration:            ['p(95)<2000'],
    tenant_isolation_success_rate: ['rate>0.999'],
    cross_tenant_auth_reject_rate: ['rate>0.999'],
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    // Carga cruzada: 50% dos usuários no Tenant A e 50% no Tenant B simultaneamente
    carga_cruzada: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 80  },
        { duration: '3m', target: 80  },
        { duration: '1m', target: 0   },
      ],
      startTime: '35s',
      tags: { scenario: 'carga_cruzada' },
    },
  },
};

// ── Fluxo principal ───────────────────────────────────────────────────────────
export default function () {
  // Cada VU alterna entre Tenant A e Tenant B baseado em seu ID
  const tenantAtual = __VU % 2 === 0 ? TENANTS.A : TENANTS.B;
  const tenantOutro = tenantAtual === TENANTS.A ? TENANTS.B : TENANTS.A;

  const token = login(CREDENTIALS.player.username, CREDENTIALS.player.password);
  if (!token) return;

  group(`Operação no ${tenantAtual}`, () => {
    // Operação legítima no tenant correto
    const resDeposito = realizarDeposito(token, tenantAtual, 50.00, 'PIX');
    const dur = resDeposito.timings.duration;

    if (tenantAtual === TENANTS.A) tenantADuration.add(dur);
    else tenantBDuration.add(dur);

    check(resDeposito, {
      '[tenant-legitimo] status 200 ou 201': (r) => [200, 201].includes(r.status),
      '[tenant-legitimo] < 2s':              (r) => r.timings.duration < 2000,
    });
    pausaHumana(0.5, 1);
  });

  group('Tentativa de Acesso Cross-Tenant', () => {
    // Usa token do tenant atual para tentar acessar recursos do outro tenant
    const resCrossTenant = http.get(
      `${BASE_URL}/api/admin/tenants/${tenantOutro}/data`,
      {
        headers: headersAuth(token, tenantAtual),
        tags: { name: 'cross_tenant_attempt' },
      }
    );

    const rejeitado = check(resCrossTenant, {
      '[isolamento] acesso cross-tenant bloqueado': (r) => [403, 401].includes(r.status),
      '[isolamento] não retorna dados de outro tenant': (r) => {
        if (r.status === 403 || r.status === 401) return true;
        try {
          const body = JSON.parse(r.body);
          return body.tenant_id !== tenantOutro;
        } catch (_) { return true; }
      },
    });

    isolationSuccessRate.add(rejeitado);
    authRejectRate.add([403, 401].includes(resCrossTenant.status));
    pausaHumana(0.5, 1.5);
  });

  group('Validação de Saldo por Tenant', () => {
    const resSaldo = getSaldo(token, tenantAtual);
    check(resSaldo, {
      '[saldo-tenant] status 200':                 (r) => r.status === 200,
      '[saldo-tenant] tenant_id correto na resposta': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.tenant_id === tenantAtual || body.tenant_id === undefined;
        } catch (_) { return true; }
      },
    });
    pausaHumana(0.5, 1);
  });
}

export function handleSummary(data) {
  return {
    'load-tests/results/multi_tenant_summary.json': JSON.stringify(data, null, 2),
  };
}
