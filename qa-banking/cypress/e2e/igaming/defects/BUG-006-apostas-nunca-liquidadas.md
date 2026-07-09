# BUG-006 — Apostas permanecem em estado "Aberta" indefinidamente (sem liquidação)

| Campo          | Valor                                           |
|----------------|-------------------------------------------------|
| **ID**         | BUG-006                                         |
| **Módulo**     | Sportsbook — Ciclo de vida de apostas           |
| **Severidade** | Alta                                            |
| **Prioridade** | P1                                              |
| **Status**     | Aberto                                          |
| **Encontrado** | 2026-07-09                                      |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express)   |

---

## Resumo

O sistema **não possui endpoint de liquidação de apostas**. Após ser registrada, uma aposta fica permanentemente em status `OPEN` — nunca transita para `WON`, `LOST` ou `SETTLED`. Isso impede qualquer validação do ciclo de vida completo de uma aposta, crédito de prêmio por vitória, e correta contabilização de apostas resolvidas no histórico.

---

## Passos para Reproduzir

```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"player01","password":"Senha@123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 1. Registrar uma aposta
BET_RESPONSE=$(curl -s http://localhost:3000/api/sportsbook/bets \
  -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: operadora-a" \
  -d '{"event_id":"evt-001","amount":25.00}')

echo $BET_RESPONSE
# → {"bet_id":"BET-xxx","status":"OPEN",...}

BET_ID=$(echo $BET_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['bet_id'])")

# 2. Tentar resolver a aposta como vencedora (endpoint inexistente)
curl -s http://localhost:3000/api/sportsbook/bets/$BET_ID/settle \
  -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"result":"WON"}'
# → 404 Not Found (endpoint não existe)

# 3. Consultar apostas — aposta ainda está OPEN após evento encerrado
curl -s "http://localhost:3000/api/sportsbook/bets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: operadora-a"
# → status: "OPEN" — nunca muda
```

---

## Resultado Esperado

O sistema deveria suportar ao menos um dos seguintes mecanismos:

1. **Endpoint de liquidação manual (admin):**  
   `POST /api/admin/bets/:betId/settle` com `{"result": "WON" | "LOST"}`

2. **Liquidação automática via evento:**  
   Ao encerrar um evento, todas as apostas vinculadas são processadas automaticamente

3. **Status transitional completo:**  
   `OPEN → SETTLED (WON | LOST | CANCELLED | VOID)`

---

## Resultado Obtido

Apenas dois estados disponíveis:
- `OPEN` — após criação
- `CANCELLED` — após `DELETE /api/sportsbook/bets/:betId`

**Não existe** `WON`, `LOST`, `SETTLED`, `VOID` ou qualquer endpoint para liquidar apostas.

---

## Evidência

```bash
# Verificar endpoints disponíveis na API
curl -s http://localhost:3000/api/sportsbook/ 2>&1
# → Cannot GET /api/sportsbook/ (sem listagem de endpoints)

# Tentar PATCH para atualizar status
curl -s -X PATCH http://localhost:3000/api/sportsbook/bets/BET-xxx \
  -H "Content-Type: application/json" \
  -d '{"status":"WON"}' -o /dev/null -w "%{http_code}"
# → 404
```

**Apostas no seed de dados:**
```js
// server.js — array de apostas começa vazio
const bets = [];
// Nenhum job/scheduler para processar resultados de eventos
```

---

## Causa Raiz

A implementação do Sportsbook cobre apenas o fluxo de **abertura** e **cancelamento** de apostas. O ciclo de vida completo requer:

```
Criação (OPEN)
    ↓
Evento encerrado
    ↓
Liquidação (SETTLED → WON / LOST)
    ↓
Crédito/débito contabilizado
    ↓
Histórico atualizado
```

Nenhum passo após "Criação" está implementado.

---

## Correção Sugerida

**Endpoint de liquidação para admin:**

```js
app.post('/api/admin/bets/:betId/settle', auth, adminOnly, (req, res) => {
  const { result } = req.body; // 'WON' | 'LOST'
  const bet = bets.find(b => b.bet_id === req.params.betId);

  if (!bet)               return res.status(404).json({ error: 'Aposta não encontrada' });
  if (bet.status !== 'OPEN') return res.status(400).json({ error: 'Aposta já liquidada' });
  if (!['WON', 'LOST'].includes(result))
    return res.status(400).json({ error: 'Resultado inválido' });

  bet.status = result;

  if (result === 'WON') {
    const event  = events.find(e => e.id === bet.event_id);
    const payout = +(bet.amount * (event?.odds || 2.0)).toFixed(2);
    const wallet = getWallet(bet.username, bet.tenantId);
    wallet.balance = +(wallet.balance + payout).toFixed(2);

    transactions[bet.tenantId]?.unshift({
      id:       `win-${Date.now()}`,
      type:     'Prêmio',
      amount:   payout,
      date:     new Date().toISOString(),
      status:   'Concluído',
      username: bet.username,
    });
  }

  res.json({ bet_id: bet.bet_id, status: bet.status });
});
```

---

## Impacto

| Área                     | Impacto                                                         |
|--------------------------|-----------------------------------------------------------------|
| Saldo do usuário         | Ganhos de apostas nunca são creditados                         |
| Histórico                | Nenhuma transação de tipo "Prêmio" é gerada                    |
| Relatórios               | GGR (Gross Gaming Revenue) não pode ser calculado              |
| Testes de regressão      | Fluxo de premiação impossível de automatizar                   |
| Regulatório              | Odds e pagamentos não podem ser auditados end-to-end           |
