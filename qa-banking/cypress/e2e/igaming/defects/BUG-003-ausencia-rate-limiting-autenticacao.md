# BUG-003 — Ausência de rate limiting no endpoint de autenticação (Brute Force)

| Campo          | Valor                                         |
|----------------|-----------------------------------------------|
| **ID**         | BUG-003                                       |
| **Módulo**     | Autenticação — `POST /api/auth/login`         |
| **Severidade** | Alta                                          |
| **Prioridade** | P1                                            |
| **Status**     | Aberto                                        |
| **Encontrado** | 2026-07-09                                    |
| **CWE**        | CWE-307 — Improper Restriction of Excessive Authentication Attempts |
| **OWASP**      | A07:2021 — Identification and Authentication Failures |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express) |

---

## Resumo

O endpoint de login **não implementa nenhum mecanismo de limitação de tentativas**. Um atacante pode submeter indefinidamente combinações de usuário/senha sem ser bloqueado ou receber qualquer throttling, viabilizando ataques de força bruta e credential stuffing.

---

## Passos para Reproduzir

```bash
# Disparar 20 tentativas inválidas consecutivas — NENHUMA resulta em 429
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code} " \
    http://localhost:3000/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"username":"player01","password":"tentativa_'$i'"}'
done
echo ""
```

---

## Resultado Esperado

Após N tentativas inválidas (ex.: 5), o servidor deveria retornar:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{ "error": "Muitas tentativas. Tente novamente em 60 segundos." }
```

---

## Resultado Obtido

```
401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401
```

**Todas as 20 requisições retornaram 401.** Nenhum `429 Too Many Requests` foi emitido.  
O servidor responde de forma idêntica à primeira e à vigésima tentativa.

---

## Evidência (output terminal — 2026-07-09)

```
401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 401 
=== Nenhum 429 (Too Many Requests) recebido = SEM rate limiting ===
```

---

## Causa Raiz

O handler de login em `demo-igaming/server.js` não possui nenhum middleware de throttling:

```js
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password)
    return res.status(401).json({ error: 'Credenciais inválidas' });
  res.json({ access_token: createToken(username, user.role), role: user.role });
  // ← sem contagem de tentativas, sem bloqueio temporário
});
```

---

## Correção Sugerida

**Opção 1 — Middleware `express-rate-limit`:**

```bash
npm install express-rate-limit
```

```js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // janela de 15 minutos
  max: 10,                    // máximo de 10 tentativas por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, (req, res) => { ... });
```

**Opção 2 — Bloqueio por conta (lockout):**
Após 5 falhas, bloquear a conta por N minutos independentemente do IP (mitiga ataques de IPs distribuídos).

**Opção 3 — CAPTCHA** após 3 tentativas (adequado para contexto iGaming com usuários reais).

---

## Impacto

| Cenário         | Risco                                                             |
|-----------------|-------------------------------------------------------------------|
| Brute force     | Senhas fracas comprometidas em minutos                            |
| Credential stuffing | Listas de senhas vazadas testadas automaticamente             |
| Account takeover | Contas de alto saldo podem ser sequestradas                      |
| Regulatório     | Violação de requisitos de segurança (PCI-DSS Req. 8.3, LGPD Art. 46) |

---

## Endpoints também afetados

- `POST /api/wallet/deposit` — sem rate limiting (possível flood de depósitos)
- `POST /api/sportsbook/bets` — sem rate limiting (possível flood de apostas)
- `GET /api/transactions/export` — sem rate limiting (possível DoS por exportações pesadas)
