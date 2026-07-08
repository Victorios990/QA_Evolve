import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, headersPublic } from './config.js';

// Realiza login e retorna o access_token
export function login(username, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password }),
    { headers: headersPublic() }
  );

  const ok = check(res, {
    '[auth] status 200': (r) => r.status === 200,
    '[auth] token presente': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  if (!ok) {
    console.error(`Login falhou para ${username}: status=${res.status} body=${res.body}`);
    return null;
  }

  return JSON.parse(res.body).access_token;
}

// Consulta saldo da carteira
export function getSaldo(token, tenantId) {
  return http.get(`${BASE_URL}/api/wallet/balance`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
    tags: { name: 'wallet_balance', critical: 'true' },
  });
}

// Realiza depósito
export function realizarDeposito(token, tenantId, amount = 100.00, method = 'PIX') {
  return http.post(
    `${BASE_URL}/api/wallet/deposit`,
    JSON.stringify({ amount, payment_method: method, currency: 'BRL' }),
    {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id':   tenantId,
      },
      tags: { name: 'wallet_deposit', critical: 'true' },
    }
  );
}

// Realiza saque
export function realizarSaque(token, tenantId, amount = 50.00) {
  return http.post(
    `${BASE_URL}/api/wallet/withdraw`,
    JSON.stringify({ amount, currency: 'BRL' }),
    {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id':   tenantId,
      },
      tags: { name: 'wallet_withdraw', critical: 'true' },
    }
  );
}

// Realiza aposta esportiva
export function realizarAposta(token, tenantId, eventId = 'evt_001', amount = 25.00) {
  return http.post(
    `${BASE_URL}/api/sportsbook/bets`,
    JSON.stringify({ event_id: eventId, amount, currency: 'BRL', selection: 'HOME_WIN' }),
    {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id':   tenantId,
      },
      tags: { name: 'sportsbook_bet', critical: 'true' },
    }
  );
}

// Lista eventos esportivos
export function listarEventos(token, tenantId) {
  return http.get(`${BASE_URL}/api/sportsbook/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
    tags: { name: 'sportsbook_events' },
  });
}

// Lista histórico de transações
export function listarTransacoes(token, tenantId, page = 1) {
  return http.get(`${BASE_URL}/api/transactions?page=${page}&limit=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
    tags: { name: 'transactions_list' },
  });
}

// Pausa aleatória entre 1s e 3s (simula comportamento humano)
export function pausaHumana(min = 1, max = 3) {
  sleep(Math.random() * (max - min) + min);
}
