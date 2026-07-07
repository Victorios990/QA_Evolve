// Configuração central compartilhada por todos os scripts k6
export const BASE_URL = __ENV.BASE_URL || 'https://igaming-qa.example.com';

export const CREDENTIALS = {
  player:  { username: __ENV.IGAMING_USER || 'player01',  password: __ENV.IGAMING_PASS || 'Senha@123' },
  admin:   { username: __ENV.IGAMING_ADMIN || 'admin_qa', password: __ENV.IGAMING_ADMIN_PASS || 'Admin@Seguro1' },
};

export const TENANTS = {
  A: 'operadora-a',
  B: 'operadora-b',
};

// Thresholds globais aplicados em todos os testes
export const THRESHOLDS = {
  // 95% das requisições devem responder em menos de 2 segundos
  http_req_duration: ['p(95)<2000'],
  // 99% das requisições devem responder em menos de 5 segundos
  'http_req_duration{critical:true}': ['p(99)<5000'],
  // Taxa de erros HTTP deve ser menor que 1%
  http_req_failed: ['rate<0.01'],
  // Taxa de sucesso das verificações deve ser maior que 99%
  checks: ['rate>0.99'],
};

// Configuração dos headers padrão
export function headersAuth(token, tenantId = TENANTS.A) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Id':   tenantId,
  };
}

export function headersPublic() {
  return { 'Content-Type': 'application/json' };
}
