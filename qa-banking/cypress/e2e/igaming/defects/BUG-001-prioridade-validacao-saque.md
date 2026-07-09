# BUG-001 — Prioridade incorreta de validação no endpoint de saque

| Campo          | Valor                                      |
|----------------|--------------------------------------------|
| **ID**         | BUG-001                                    |
| **Módulo**     | Carteira — Saque                           |
| **Severidade** | Alta                                       |
| **Prioridade** | P1                                         |
| **Status**     | Aberto                                     |
| **Encontrado** | 2026-07-09                                 |
| **Teste**      | CT-W09 — `carteira.cy.js`                  |
| **Ambiente**   | demo-igaming localhost:3000 (Node.js/Express) |

---

## Resumo

O endpoint `POST /api/wallet/withdrawal` valida o **saldo disponível antes de verificar o limite diário**. Isso faz com que a mensagem de erro exibida ao usuário seja "Saldo insuficiente" em vez de "Limite diário de saque excedido" quando o valor solicitado ultrapassa ambos os limites.

---

## Passos para Reproduzir

```bash
# 1. Autenticar como player01 (saldo inicial: R$ 1.000,00)
curl -s http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"player01","password":"Senha@123"}'

# 2. Tentar sacar R$ 50.000,00 (acima do limite diário de R$ 10.000,00)
curl -s http://localhost:3000/api/wallet/withdrawal \
  -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":50000.00}'
```

---

## Resultado Esperado

```json
{ "error": "Limite diário de saque excedido" }
```
Status HTTP: `400`

---

## Resultado Obtido

```json
{ "error": "Saldo insuficiente para esta operação" }
```
Status HTTP: `400`

A mensagem correta tecnicamente bloqueia a operação, porém induz o usuário a erro:  
ele acredita que o problema é o saldo, não o limite diário, podendo depositar mais dinheiro  
e tentar novamente sem resultado diferente.

---

## Evidências

### Falha no Cypress (attempt 1)
![CT-W09 Falha](../../../../reports/screenshots/carteira.cy.js/Carteira%20(Wallet)%20--%20CT-W09%20%20Saque%20acima%20do%20limite%20di%C3%A1rio%20%C3%A9%20bloqueado%20(failed).png)

### Falha no Cypress (attempt 2)
![CT-W09 Falha attempt 2](../../../../reports/screenshots/carteira.cy.js/Carteira%20(Wallet)%20--%20CT-W09%20%20Saque%20acima%20do%20limite%20di%C3%A1rio%20%C3%A9%20bloqueado%20(failed)%20(attempt%202).png)

### Falha no Cypress (attempt 3)
![CT-W09 Falha attempt 3](../../../../reports/screenshots/carteira.cy.js/Carteira%20(Wallet)%20--%20CT-W09%20%20Saque%20acima%20do%20limite%20di%C3%A1rio%20%C3%A9%20bloqueado%20(failed)%20(attempt%203).png)

**Relatório Mochawesome:** `cypress/reports/index.html`

---

## Causa Raiz

Arquivo: `demo-igaming/server.js` — rota `POST /api/wallet/withdrawal`

```js
// ORDEM ATUAL (incorreta):
if (wallet.balance < amount)           // ← verifica saldo PRIMEIRO
  return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });

if (amount > DAILY_LIMIT)              // ← limite diário só verificado depois
  return res.status(400).json({ error: 'Limite diário de saque excedido' });
```

Como `50000 > 1000 (saldo)`, a primeira condição é verdadeira e retorna antes de chegar na verificação do limite diário.

---

## Correção Sugerida

Inverter a ordem das validações:

```js
// ORDEM CORRETA:
if (amount > DAILY_LIMIT)              // ← verificar limite diário PRIMEIRO
  return res.status(400).json({ error: 'Limite diário de saque excedido' });

if (wallet.balance < amount)           // ← depois verificar saldo
  return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });
```

---

## Impacto

- **UX**: Mensagem de erro enganosa — usuário tenta resolver problema errado
- **Regulatório**: Limite diário não é comunicado corretamente, podendo ferir regulamentações de gaming responsável
- **Testes**: CT-W09 falha em todos os ambientes com este estado de saldo
