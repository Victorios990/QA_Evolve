# CT002 — Transferência entre Contas

**Módulo:** Operações Financeiras  
**Prioridade:** Alta  
**Tipo:** Funcional + Banco de Dados  
**Técnica utilizada:** Partição de Equivalência + Análise de Valor Limite + Tabela de Decisão

---

## Pré-condições
- Usuário autenticado (john / demo)
- Conta origem com saldo disponível ≥ R$ 100,00
- Conta destino cadastrada
- Banco de dados disponível para validação

---

## Casos de Teste

| ID       | Descrição                              | Valor      | Origem   | Destino  | Resultado Esperado                            | DB Validação               | Status |
|----------|----------------------------------------|------------|----------|----------|-----------------------------------------------|----------------------------|--------|
| CT002-01 | Transferência com saldo suficiente     | 100.00     | CC João  | CP João  | "Transfer Complete!" + atualização de saldo   | Débito e crédito no banco  | -      |
| CT002-02 | Transferência de valor mínimo          | 0.01       | CC João  | CP João  | Transferência realizada                        | Transação registrada       | -      |
| CT002-03 | Transferência com saldo exato          | saldo total | CC João | CP João  | Transferência realizada + saldo = 0            | Saldo zerado no banco      | -      |
| CT002-04 | Transferência com saldo insuficiente   | 9999999.00 | CC João  | CP João  | Mensagem de erro: saldo insuficiente           | Nenhuma transação criada   | -      |
| CT002-05 | Valor zerado                           | 0.00       | CC João  | CP João  | Mensagem de erro de validação                  | Nenhuma transação criada   | -      |
| CT002-06 | Campo valor em branco                  | (vazio)    | CC João  | CP João  | Mensagem de campo obrigatório                  | Nenhuma transação criada   | -      |
| CT002-07 | Valor negativo                         | -50.00     | CC João  | CP João  | Mensagem de erro de validação                  | Nenhuma transação criada   | -      |
| CT002-08 | Valor com vírgula (formato BR)         | 100,00     | CC João  | CP João  | Verificar se aceita formato brasileiro         | -                          | -      |
| CT002-09 | Conta origem = conta destino           | 50.00      | CC João  | CC João  | Mensagem: não é possível transferir para mesma conta | -                  | -      |
| CT002-10 | Transferência e verificação no extrato | 75.00      | CC João  | CP João  | Transação aparece no extrato de ambas as contas | Dois registros no banco   | -      |

---

## Análise de Valor Limite — Campo Valor

| Classe         | Valor de Limite | Resultado Esperado  |
|----------------|-----------------|---------------------|
| Inválida       | -0.01           | Erro                |
| Inválida       | 0.00            | Erro                |
| Válida (min)   | 0.01            | Sucesso             |
| Válida         | saldo - 0.01    | Sucesso             |
| Válida (max)   | saldo exato     | Sucesso (saldo = 0) |
| Inválida       | saldo + 0.01    | Erro: saldo insuficiente |

---

## Validação SQL esperada após CT002-01

```sql
-- Verificar débito na conta de origem
SELECT amount, type, description
FROM transaction
WHERE account_id = :conta_origem
  AND type = 'DEBIT'
  AND date = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
-- Esperado: amount = 100.00, type = DEBIT

-- Verificar crédito na conta de destino
SELECT amount, type, description
FROM transaction
WHERE account_id = :conta_destino
  AND type = 'CREDIT'
  AND date = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 1;
-- Esperado: amount = 100.00, type = CREDIT
```
