# BUG-005 — Saque registrado com valor positivo no histórico (ausência de sinal)

| Campo          | Valor                                           |
|----------------|-------------------------------------------------|
| **ID**         | BUG-005                                         |
| **Módulo**     | Histórico — `POST /api/wallet/withdrawal`       |
| **Severidade** | Média                                           |
| **Prioridade** | P2                                              |
| **Status**     | Aberto                                          |
| **Encontrado** | 2026-07-09                                      |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express)   |

---

## Resumo

Todas as transações (Depósito, Saque e Aposta) são registradas com `amount` **positivo** no histórico, independentemente de representarem crédito ou débito na conta. Isso torna impossível distinguir, por inspeção do campo `amount`, se uma transação aumentou ou reduziu o saldo — exigindo depender do campo `type` para inferir a direção do fluxo financeiro.

---

## Passos para Reproduzir

```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"player01","password":"Senha@123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Realizar um saque de R$ 50,00
curl -s http://localhost:3000/api/wallet/withdrawal \
  -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: operadora-a" \
  -d '{"amount":50.00}'

# Consultar o histórico
curl -s "http://localhost:3000/api/transactions?type=Saque&limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: operadora-a"
```

---

## Resultado Esperado

O campo `amount` deveria indicar a direção do fluxo. Opções aceitas:

**Opção A — Valor negativo para débito:**
```json
{ "type": "Saque", "amount": -50.00 }
```

**Opção B — Campo `direction` separado:**
```json
{ "type": "Saque", "amount": 50.00, "direction": "debit" }
```

**Opção C — Campo `signed_amount`:**
```json
{ "type": "Saque", "amount": 50.00, "signed_amount": -50.00 }
```

---

## Resultado Obtido

```json
{
  "transactions": [
    {
      "id": "saq-1783582211093",
      "type": "Saque",
      "amount": 50,
      "date": "2026-07-09T07:30:11.093Z",
      "status": "Concluído",
      "username": "player01"
    }
  ],
  "total": 11,
  "page": 1
}
```

`amount: 50` (positivo) — **não indica que o saldo foi reduzido**.

---

## Evidência (output terminal — 2026-07-09)

```
=== Realizando saque de R$50 ===
{
    "message": "Saque realizado com sucesso",
    "balance": 2000
}

=== Verificando histórico — saque aparece como valor positivo: ===
{
    "transactions": [
        {
            "id": "saq-1783582211093",
            "type": "Saque",
            "amount": 50,             ← valor positivo, sem indicador de débito
            "date": "2026-07-09T07:30:11.093Z",
            "status": "Concluído",
            "username": "player01"
        }
    ]
}
```

---

## Causa Raiz

Arquivo: `demo-igaming/server.js` — handlers de `withdrawal` e `bets`:

```js
// withdrawal handler
transactions[tenantId].unshift({
  type:   'Saque',
  amount,              // ← armazena o valor positivo bruto
  status: 'Concluído',
});

// bets handler
transactions[tenantId].unshift({
  type:   'Aposta',
  amount,              // ← mesmo problema
  status: 'Aberta',
});
```

Já o seed de dados também usa somente valores positivos:
```js
rows.push({ amount: 50 + i * 10 });  // sempre positivo
```

---

## Correção Sugerida

**Opção recomendada (compatível com sistemas financeiros):** Usar valor **negativo para débitos**:

```js
// withdrawal handler
transactions[tenantId].unshift({
  type:   'Saque',
  amount: -amount,     // ← negativo = débito
  status: 'Concluído',
});

// bets handler
transactions[tenantId].unshift({
  type:   'Aposta',
  amount: -amount,     // ← aposta é sempre débito inicial
  status: 'Aberta',
});
```

**Ajuste necessário no CSV export** — remover o `-` ao formatar o amount para exibição:
```js
const rows = txs.map(t => `${t.id},${t.type},${Math.abs(t.amount)},${t.date},${t.status}`).join('\n');
```

**Atenção:** Essa mudança afeta os testes `HT-08`, `HT-14` e `HT-15` que validam o campo `amount` — precisarão de ajuste após o fix.

---

## Impacto

| Cenário                   | Risco                                                              |
|---------------------------|--------------------------------------------------------------------|
| Conciliação financeira    | Impossível somar o extrato algebricamente para obter saldo final   |
| Exportação de dados       | CSV sem sinalização de débito/crédito dificulta importação em ERPs |
| Auditoria                 | Relatórios para compliance não seguem padrão GAAP/IFRS            |
| Integração com BI/DW      | Ferramentas que somam `amount` produzirão saldo inflado            |
