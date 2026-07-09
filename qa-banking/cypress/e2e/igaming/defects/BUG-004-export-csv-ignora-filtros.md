# BUG-004 — Export CSV ignora parâmetros de filtro (retorna todas as transações)

| Campo          | Valor                                           |
|----------------|-------------------------------------------------|
| **ID**         | BUG-004                                         |
| **Módulo**     | Histórico — `GET /api/transactions/export`      |
| **Severidade** | Média                                           |
| **Prioridade** | P2                                              |
| **Status**     | Aberto                                          |
| **Encontrado** | 2026-07-09                                      |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express)   |

---

## Resumo

O endpoint `GET /api/transactions/export` **ignora todos os query parameters** de filtro (`type`, `date_from`, `date_to`, `amount_min`, `amount_max`). Independentemente do filtro enviado, o endpoint sempre retorna **todas** as transações do usuário no tenant. O endpoint equivalente `GET /api/transactions` implementa os mesmos filtros corretamente.

---

## Passos para Reproduzir

```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"player01","password":"Senha@123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Exportar filtrando APENAS por tipo "Depósito"
curl -s "http://localhost:3000/api/transactions/export?type=Dep%C3%B3sito" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: operadora-a"
```

---

## Resultado Esperado

CSV contendo **somente** linhas com `type=Depósito`:

```
id,type,amount,date,status
dep-xxx,Depósito,100,2026-07-09T...,Concluído
dep-yyy,Depósito,200,2026-07-09T...,Concluído
```

---

## Resultado Obtido

CSV contendo **todas as transações**, incluindo Saques e Apostas:

```
id,type,amount,date,status
dep-1783582130685,Depósito,100,2026-07-09T07:28:50.685Z,Concluído
dep-1783582130683,Depósito,100,2026-07-09T07:28:50.683Z,Concluído
bet-1783582101946,Aposta,25,2026-07-09T07:28:21.946Z,Aberta
saq-xxx,Saque,50,2026-07-09T...,Concluído       ← NÃO deveria aparecer
```

**10 linhas do tipo "Saque" encontradas no CSV filtrado por tipo "Depósito".**

---

## Evidência (output terminal — 2026-07-09)

```
=== Export COM filtro type=Deposito (ignora o filtro!): ===
Linhas 'Saque' encontradas (deveria ser 0): 10
```

---

## Causa Raiz

Arquivo: `demo-igaming/server.js`

```js
// GET /api/transactions — CORRETO: aplica filtros
app.get('/api/transactions', optionalAuth, (req, res) => {
  const { type, date_from, date_to, amount_min, amount_max } = req.query;
  let txs = (transactions[tenantId] || []).filter(t => t.username === req.user.username);
  if (type)       txs = txs.filter(t => t.type === type);     // ← filtros aplicados
  if (date_from)  txs = txs.filter(t => new Date(t.date) >= parseDate(date_from));
  // ...
});

// GET /api/transactions/export — INCORRETO: ignora todos os filtros
app.get('/api/transactions/export', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const txs = (transactions[tenantId] || []).filter(t => t.username === req.user.username);
  // ← req.query NUNCA é lido — filtros ignorados completamente
  const header = 'id,type,amount,date,status';
  const rows   = txs.map(t => `${t.id},${t.type},${t.amount},${t.date},${t.status}`).join('\n');
  // ...
});
```

---

## Correção Sugerida

Reutilizar a mesma lógica de filtragem do endpoint `GET /api/transactions`:

```js
app.get('/api/transactions/export', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { type, date_from, date_to, amount_min, amount_max } = req.query;

  let txs = (transactions[tenantId] || []).filter(t => t.username === req.user.username);

  // Aplicar os mesmos filtros do endpoint /api/transactions
  if (type)       txs = txs.filter(t => t.type === type);
  if (date_from)  txs = txs.filter(t => new Date(t.date) >= parseDate(date_from));
  if (date_to)    txs = txs.filter(t => new Date(t.date) <= parseDate(date_to));
  if (amount_min) txs = txs.filter(t => t.amount >= parseFloat(amount_min));
  if (amount_max) txs = txs.filter(t => t.amount <= parseFloat(amount_max));

  const header = 'id,type,amount,date,status';
  const rows   = txs.map(t => `${t.id},${t.type},${t.amount},${t.date},${t.status}`).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.status(200).send(`${header}\n${rows}`);
});
```

**Também recomendado:** Adicionar paginação ou limite máximo de linhas no export para evitar resposta excessivamente grande.

---

## Impacto

| Cenário                  | Risco                                                    |
|--------------------------|----------------------------------------------------------|
| Relatório financeiro     | Usuário não consegue exportar apenas depósitos do mês   |
| Conciliação contábil     | CSV exportado precisa ser filtrado manualmente           |
| Performance              | Export sem filtro retorna N registros sem limitação      |
| Conformidade regulatória | Relatórios para órgãos reguladores podem exigir recorte |
