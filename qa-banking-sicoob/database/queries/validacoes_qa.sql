-- ============================================================
-- QUERIES DE VALIDAÇÃO QA — Sistema Bancário
-- Compatíveis com PostgreSQL e IBM DB2
-- ============================================================

-- -------------------------------------------------------
-- 1. INTEGRIDADE REFERENCIAL
-- -------------------------------------------------------

-- Contas sem cliente associado (deve retornar 0 registros)
SELECT a.id AS conta, a.type, a.balance
FROM account a
LEFT JOIN customer c ON a.customer_id = c.id
WHERE c.id IS NULL;

-- Transações sem conta de origem (deve retornar 0 registros)
SELECT t.id, t.amount, t.description
FROM transaction t
LEFT JOIN account a ON t.account_id = a.id
WHERE a.id IS NULL;

-- -------------------------------------------------------
-- 2. VALIDAÇÃO DE SALDOS
-- -------------------------------------------------------

-- Saldo negativo em contas que não permitem (deve retornar 0)
SELECT id, type, balance
FROM account
WHERE balance < 0
  AND type NOT IN ('LOAN', 'CREDIT', 'OVERDRAFT');

-- Resumo de saldo por tipo de conta
SELECT
    type                        AS tipo_conta,
    COUNT(*)                    AS quantidade,
    SUM(balance)                AS saldo_total,
    AVG(balance)                AS saldo_medio,
    MIN(balance)                AS saldo_minimo,
    MAX(balance)                AS saldo_maximo
FROM account
WHERE active = TRUE
GROUP BY type
ORDER BY saldo_total DESC;

-- -------------------------------------------------------
-- 3. VALIDAÇÃO DE TRANSAÇÕES
-- -------------------------------------------------------

-- Transações do dia atual
SELECT
    t.id,
    c.first_name || ' ' || c.last_name  AS cliente,
    a.type                               AS tipo_conta,
    t.type                               AS tipo_transacao,
    t.amount,
    t.description,
    t.date
FROM transaction t
JOIN account  a ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.date = CURRENT_DATE
ORDER BY t.created_at DESC;

-- Somatório de débitos e créditos por conta
SELECT
    a.id                                 AS conta_id,
    c.first_name || ' ' || c.last_name   AS cliente,
    a.balance                            AS saldo_atual,
    SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount ELSE 0 END) AS total_creditos,
    SUM(CASE WHEN t.type = 'DEBIT'  THEN t.amount ELSE 0 END) AS total_debitos,
    COUNT(t.id)                          AS qtd_transacoes
FROM account a
JOIN customer c ON a.customer_id = c.id
LEFT JOIN transaction t ON t.account_id = a.id
GROUP BY a.id, c.first_name, c.last_name, a.balance
ORDER BY a.id;

-- -------------------------------------------------------
-- 4. AUDITORIA
-- -------------------------------------------------------

-- Transações sem registro de auditoria (deve retornar 0)
SELECT t.id, t.description, t.amount
FROM transaction t
LEFT JOIN audit_log al ON al.transaction_id = t.id
WHERE al.id IS NULL;

-- Últimas 10 entradas de auditoria
SELECT
    al.id,
    al.transaction_id,
    al.action,
    al.table_name,
    al.performed_by,
    al.performed_at
FROM audit_log al
ORDER BY al.performed_at DESC
LIMIT 10;

-- -------------------------------------------------------
-- 5. VALIDAÇÕES DE NEGÓCIO BANCÁRIO
-- -------------------------------------------------------

-- CPF/SSN duplicado (deve retornar 0 registros)
SELECT ssn, COUNT(*) AS duplicatas
FROM customer
WHERE ssn IS NOT NULL
GROUP BY ssn
HAVING COUNT(*) > 1;

-- Clientes com mais de uma conta corrente ativa (possível duplicidade)
SELECT
    c.id,
    c.first_name || ' ' || c.last_name AS cliente,
    COUNT(*) AS qtd_contas_correntes
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE a.type = 'CHECKING'
  AND a.active = TRUE
GROUP BY c.id, c.first_name, c.last_name
HAVING COUNT(*) > 1;

-- Transferências realizadas no dia (Debit + Credit correspondentes)
SELECT
    t_origem.account_id    AS conta_origem,
    t_destino.account_id   AS conta_destino,
    t_origem.amount,
    t_origem.date
FROM transaction t_origem
JOIN transaction t_destino
    ON t_origem.amount    = t_destino.amount
   AND t_origem.date      = t_destino.date
   AND t_origem.type      = 'DEBIT'
   AND t_destino.type     = 'CREDIT'
   AND t_origem.description LIKE '%Transfer Sent%'
   AND t_destino.description LIKE '%Transfer Received%'
WHERE t_origem.date = CURRENT_DATE;

-- -------------------------------------------------------
-- 6. QUERIES DE APOIO — usadas nos testes automatizados
-- -------------------------------------------------------

-- Buscar saldo de uma conta específica (substituir :account_id)
SELECT balance FROM account WHERE id = :account_id;

-- Última transação de uma conta
SELECT * FROM transaction
WHERE account_id = :account_id
ORDER BY created_at DESC
LIMIT 1;

-- Verificar se cliente existe pelo username
SELECT id, first_name, last_name, active
FROM customer
WHERE username = :username;
