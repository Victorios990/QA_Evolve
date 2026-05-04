-- ============================================================
-- PRÁTICA SQL — PROCESSO SELETIVO QA BANCÁRIO (SICOOB)
-- Organizado por nível: Básico → Intermediário → Avançado → Conformidade
-- Compatível com PostgreSQL (local) e IBM DB2 (produção)
--
-- NOTA DB2: onde há LIMIT, o equivalente DB2 é FETCH FIRST N ROWS ONLY
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- NÍVEL 1 — BÁSICO: SELECT, WHERE, ORDER BY, LIKE, BETWEEN
-- ════════════════════════════════════════════════════════════

-- ── 1.1 Liste todos os clientes ativos de Brasília, ordenados por nome
SELECT first_name, last_name, email, phone
FROM customer
WHERE active = TRUE
  AND city = 'Brasília'
ORDER BY last_name, first_name;

-- ── 1.2 Liste todas as contas poupança com saldo acima de R$5.000
SELECT a.id AS conta_id, c.first_name || ' ' || c.last_name AS titular, a.balance
FROM account a
JOIN customer c ON a.customer_id = c.id
WHERE a.type = 'SAVINGS'
  AND a.balance > 5000.00
ORDER BY a.balance DESC;

-- ── 1.3 Quais clientes têm sobrenome começando com 'S'?
SELECT first_name, last_name, city, state
FROM customer
WHERE last_name LIKE 'S%'
ORDER BY last_name;

-- ── 1.4 Liste transações entre R$1.000 e R$5.000 em março/2024
SELECT t.id, t.description, t.amount, t.type, t.date
FROM transaction t
WHERE t.amount BETWEEN 1000.00 AND 5000.00
  AND t.date BETWEEN '2024-03-01' AND '2024-03-31'
ORDER BY t.amount DESC;

-- ── 1.5 Quais contas estão ativas mas têm saldo zero?
SELECT a.id, c.first_name || ' ' || c.last_name AS titular, a.type, a.balance
FROM account a
JOIN customer c ON a.customer_id = c.id
WHERE a.balance = 0.00
  AND a.active = TRUE;

-- ── 1.6 Liste os 5 maiores depósitos (CREDIT) da base inteira
--   PostgreSQL:
SELECT c.first_name || ' ' || c.last_name AS cliente, t.amount, t.description, t.date
FROM transaction t
JOIN account a ON t.account_id = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.type = 'CREDIT'
ORDER BY t.amount DESC
LIMIT 5;
--   DB2:
-- ...ORDER BY t.amount DESC FETCH FIRST 5 ROWS ONLY;

-- ── 1.7 Quantas transações existem por tipo (DEBIT / CREDIT)?
SELECT type AS tipo, COUNT(*) AS quantidade, SUM(amount) AS volume_total
FROM transaction
GROUP BY type;


-- ════════════════════════════════════════════════════════════
-- NÍVEL 2 — INTERMEDIÁRIO: JOIN, GROUP BY, HAVING, SUBQUERY, CASE WHEN
-- ════════════════════════════════════════════════════════════

-- ── 2.1 Saldo total e quantidade de contas por tipo
SELECT
    type                    AS tipo_conta,
    COUNT(*)                AS qtd_contas,
    SUM(balance)            AS saldo_total,
    ROUND(AVG(balance), 2)  AS saldo_medio,
    MAX(balance)            AS maior_saldo,
    MIN(balance)            AS menor_saldo
FROM account
WHERE active = TRUE
GROUP BY type
ORDER BY saldo_total DESC;

-- ── 2.2 Clientes com mais de uma conta ativa
SELECT
    c.id,
    c.first_name || ' ' || c.last_name AS cliente,
    COUNT(a.id)                         AS qtd_contas,
    STRING_AGG(a.type::TEXT, ', ')      AS tipos        -- PostgreSQL
    -- LISTAGG(a.type, ', ') WITHIN GROUP (ORDER BY a.type)  -- DB2
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE a.active = TRUE
GROUP BY c.id, c.first_name, c.last_name
HAVING COUNT(a.id) > 1
ORDER BY qtd_contas DESC;

-- ── 2.3 Clientes sem nenhuma transação (LEFT JOIN + IS NULL)
SELECT c.id, c.first_name || ' ' || c.last_name AS cliente, c.city
FROM customer c
LEFT JOIN account a   ON a.customer_id = c.id
LEFT JOIN transaction t ON t.account_id = a.id
WHERE t.id IS NULL
  AND c.active = TRUE;

-- ── 2.4 Movimentação mensal por cliente (total débito e crédito)
SELECT
    c.first_name || ' ' || c.last_name     AS cliente,
    TO_CHAR(t.date, 'YYYY-MM')             AS mes,       -- PostgreSQL
    -- TO_CHAR(t.date, 'YYYY-MM')          AS mes,       -- DB2 (mesma sintaxe)
    SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount ELSE 0 END) AS total_credito,
    SUM(CASE WHEN t.type = 'DEBIT'  THEN t.amount ELSE 0 END) AS total_debito,
    SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount
             WHEN t.type = 'DEBIT'  THEN -t.amount ELSE 0 END) AS saldo_periodo
FROM transaction t
JOIN account a  ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
GROUP BY c.first_name, c.last_name, TO_CHAR(t.date, 'YYYY-MM')
ORDER BY cliente, mes;

-- ── 2.5 Clientes inadimplentes: têm empréstimo e não pagaram parcela no último mês
SELECT DISTINCT
    c.id,
    c.first_name || ' ' || c.last_name AS cliente,
    a.balance                           AS saldo_emprestimo
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE a.type = 'LOAN'
  AND NOT EXISTS (
      SELECT 1
      FROM transaction t2
      JOIN account a2 ON t2.account_id = a2.id
      WHERE a2.customer_id = c.id
        AND t2.description LIKE '%empréstimo%'
        AND t2.date >= (CURRENT_DATE - INTERVAL '30 days')  -- PostgreSQL
        -- AND t2.date >= CURRENT_DATE - 30 DAYS            -- DB2
  );

-- ── 2.6 Contas sem movimentação nos últimos 90 dias (contas dormentes)
SELECT
    a.id          AS conta_id,
    c.first_name || ' ' || c.last_name AS titular,
    a.type,
    a.balance,
    MAX(t.date)   AS ultima_movimentacao
FROM account a
JOIN customer c ON a.customer_id = c.id
LEFT JOIN transaction t ON t.account_id = a.id
WHERE a.active = TRUE
GROUP BY a.id, c.first_name, c.last_name, a.type, a.balance
HAVING MAX(t.date) < (CURRENT_DATE - INTERVAL '90 days')  -- PostgreSQL
    OR MAX(t.date) IS NULL
ORDER BY ultima_movimentacao NULLS FIRST;
-- DB2: HAVING MAX(t.date) < CURRENT_DATE - 90 DAYS OR MAX(t.date) IS NULL

-- ── 2.7 Conciliação de transferências: cada Funds Transfer Sent deve ter um Received
SELECT
    t_deb.account_id  AS conta_origem,
    t_cred.account_id AS conta_destino,
    t_deb.amount,
    t_deb.date,
    CASE WHEN t_cred.id IS NULL THEN 'SEM PAR — ERRO' ELSE 'OK' END AS status
FROM transaction t_deb
LEFT JOIN transaction t_cred
    ON  t_deb.amount = t_cred.amount
    AND t_deb.date   = t_cred.date
    AND t_cred.type  = 'CREDIT'
    AND t_cred.description LIKE '%Transfer Received%'
WHERE t_deb.type = 'DEBIT'
  AND t_deb.description LIKE '%Transfer Sent%'
ORDER BY t_deb.date;

-- ── 2.8 Resumo financeiro por cliente (visão gerencial)
SELECT
    c.first_name || ' ' || c.last_name  AS cliente,
    c.city,
    COUNT(DISTINCT a.id)                AS qtd_contas,
    SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END) AS ativo_total,
    SUM(CASE WHEN a.balance < 0 THEN a.balance ELSE 0 END) AS passivo_total,
    SUM(a.balance)                      AS patrimonio_liquido
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE c.active = TRUE
GROUP BY c.id, c.first_name, c.last_name, c.city
ORDER BY patrimonio_liquido DESC;


-- ════════════════════════════════════════════════════════════
-- NÍVEL 3 — AVANÇADO: Window Functions, CTE, EXISTS, SELF JOIN
-- ════════════════════════════════════════════════════════════

-- ── 3.1 Ranking de clientes por saldo total (RANK / DENSE_RANK)
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    SUM(a.balance)                      AS saldo_total,
    RANK()       OVER (ORDER BY SUM(a.balance) DESC) AS ranking,
    DENSE_RANK() OVER (ORDER BY SUM(a.balance) DESC) AS ranking_denso
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE c.active = TRUE
GROUP BY c.id, c.first_name, c.last_name;

-- ── 3.2 Saldo corrente acumulado ao longo do tempo (running balance)
--    Mostra como o saldo evolui transação a transação na conta do João (id=1)
SELECT
    t.date,
    t.type,
    t.amount,
    t.description,
    SUM(CASE WHEN t.type = 'CREDIT' THEN t.amount ELSE -t.amount END)
        OVER (ORDER BY t.date, t.id) AS saldo_acumulado
FROM transaction t
WHERE t.account_id = 1
ORDER BY t.date, t.id;

-- ── 3.3 Comparação mês a mês: volume de transações atual vs mês anterior (LAG)
SELECT
    mes,
    total_transacoes,
    volume_total,
    LAG(total_transacoes) OVER (ORDER BY mes) AS transacoes_mes_anterior,
    total_transacoes - LAG(total_transacoes) OVER (ORDER BY mes) AS variacao_qtd,
    ROUND(
        (total_transacoes - LAG(total_transacoes) OVER (ORDER BY mes))::NUMERIC
        / NULLIF(LAG(total_transacoes) OVER (ORDER BY mes), 0) * 100, 2
    ) AS variacao_pct
FROM (
    SELECT
        TO_CHAR(date, 'YYYY-MM') AS mes,
        COUNT(*)                  AS total_transacoes,
        SUM(amount)               AS volume_total
    FROM transaction
    GROUP BY TO_CHAR(date, 'YYYY-MM')
) sub
ORDER BY mes;

-- ── 3.4 TOP 3 maiores transações por cliente (ROW_NUMBER por partição)
SELECT *
FROM (
    SELECT
        c.first_name || ' ' || c.last_name AS cliente,
        t.type,
        t.amount,
        t.description,
        t.date,
        ROW_NUMBER() OVER (
            PARTITION BY c.id
            ORDER BY t.amount DESC
        ) AS posicao
    FROM transaction t
    JOIN account a  ON t.account_id  = a.id
    JOIN customer c ON a.customer_id = c.id
) ranked
WHERE posicao <= 3
ORDER BY cliente, posicao;

-- ── 3.5 CTE: clientes com patrimônio acima da média geral
WITH patrimonio AS (
    SELECT
        c.id,
        c.first_name || ' ' || c.last_name AS cliente,
        SUM(a.balance)                      AS total
    FROM customer c
    JOIN account a ON a.customer_id = c.id
    WHERE c.active = TRUE
    GROUP BY c.id, c.first_name, c.last_name
),
media AS (
    SELECT AVG(total) AS media_geral FROM patrimonio
)
SELECT
    p.cliente,
    p.total,
    m.media_geral,
    ROUND(p.total - m.media_geral, 2) AS diferenca_da_media
FROM patrimonio p, media m
WHERE p.total > m.media_geral
ORDER BY p.total DESC;

-- ── 3.6 CTE encadeada: clientes de alto valor com empréstimo ativo
WITH alto_valor AS (
    SELECT c.id, c.first_name || ' ' || c.last_name AS cliente, SUM(a.balance) AS ativo
    FROM customer c
    JOIN account a ON a.customer_id = c.id
    WHERE a.type NOT IN ('LOAN', 'CREDIT', 'OVERDRAFT')
    GROUP BY c.id, c.first_name, c.last_name
    HAVING SUM(a.balance) > 10000
),
com_emprestimo AS (
    SELECT a.customer_id, SUM(ABS(a.balance)) AS divida_total
    FROM account a
    WHERE a.type IN ('LOAN', 'CREDIT', 'OVERDRAFT')
    GROUP BY a.customer_id
)
SELECT
    av.cliente,
    av.ativo        AS patrimonio_ativo,
    ce.divida_total,
    ROUND(ce.divida_total / NULLIF(av.ativo, 0) * 100, 1) AS comprometimento_pct
FROM alto_valor av
JOIN com_emprestimo ce ON ce.customer_id = av.id
ORDER BY comprometimento_pct DESC;


-- ════════════════════════════════════════════════════════════
-- NÍVEL 4 — CONFORMIDADE BANCÁRIA: COAF, AUDITORIA, CONTROLES
-- (Cenários reais de QA em ambiente bancário)
-- ════════════════════════════════════════════════════════════

-- ── 4.1 COAF: transações individuais acima de R$10.000 (obrigação de reporte)
SELECT
    t.id          AS transacao_id,
    c.first_name || ' ' || c.last_name AS cliente,
    c.ssn         AS cpf,
    a.type        AS tipo_conta,
    t.type        AS tipo_transacao,
    t.amount,
    t.description,
    t.date
FROM transaction t
JOIN account a  ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.amount > 10000.00
ORDER BY t.amount DESC;

-- ── 4.2 COAF: estruturação suspeita (smurfing)
--    Múltiplos depósitos em espécie abaixo de R$10k em sequência (mesmo cliente, mesma semana)
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    c.ssn                               AS cpf,
    COUNT(t.id)                         AS qtd_depositos,
    SUM(t.amount)                       AS total_depositado,
    MIN(t.date)                         AS primeira_data,
    MAX(t.date)                         AS ultima_data
FROM transaction t
JOIN account a  ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.type = 'CREDIT'
  AND t.amount BETWEEN 5000 AND 9999.99
  AND t.description ILIKE '%espécie%'
GROUP BY c.id, c.first_name, c.last_name, c.ssn
HAVING COUNT(t.id) >= 3
   AND MAX(t.date) - MIN(t.date) <= 7     -- PostgreSQL (intervalo em dias)
   -- AND DAYS(MAX(t.date)) - DAYS(MIN(t.date)) <= 7  -- DB2
ORDER BY total_depositado DESC;

-- ── 4.3 Integridade referencial completa (validação de QA)
SELECT 'contas_sem_cliente'    AS check_name, COUNT(*) AS violacoes
FROM account a LEFT JOIN customer c ON a.customer_id = c.id WHERE c.id IS NULL
UNION ALL
SELECT 'transacoes_sem_conta', COUNT(*)
FROM transaction t LEFT JOIN account a ON t.account_id = a.id WHERE a.id IS NULL
UNION ALL
SELECT 'transacoes_sem_auditoria', COUNT(*)
FROM transaction t LEFT JOIN audit_log al ON al.transaction_id = t.id WHERE al.id IS NULL
UNION ALL
SELECT 'saldo_negativo_indevido', COUNT(*)
FROM account WHERE balance < 0 AND type NOT IN ('LOAN', 'CREDIT', 'OVERDRAFT')
UNION ALL
SELECT 'cpf_duplicado', COUNT(*)
FROM (SELECT ssn FROM customer WHERE ssn IS NOT NULL GROUP BY ssn HAVING COUNT(*) > 1) dup;
-- Resultado esperado: TODAS as linhas com violacoes = 0

-- ── 4.4 Contas de clientes inativos que ainda possuem saldo
SELECT
    c.first_name || ' ' || c.last_name AS cliente_inativo,
    a.id          AS conta_id,
    a.type,
    a.balance,
    a.created_at  AS data_abertura
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE c.active = FALSE
  AND a.balance <> 0
ORDER BY a.balance DESC;
-- Esperado: Bruno Santos com R$750 na conta (dado de teste deliberado)

-- ── 4.5 Auditoria: log das últimas operações com detalhes do cliente
SELECT
    al.id           AS log_id,
    al.transaction_id,
    al.action,
    c.first_name || ' ' || c.last_name AS cliente,
    t.amount,
    t.type          AS tipo_transacao,
    al.new_value    AS descricao,
    al.performed_by AS operador,
    al.performed_at AS data_hora
FROM audit_log al
JOIN transaction t  ON al.transaction_id = t.id
JOIN account a      ON t.account_id = a.id
JOIN customer c     ON a.customer_id = c.id
ORDER BY al.performed_at DESC
LIMIT 20;
-- DB2: FETCH FIRST 20 ROWS ONLY

-- ── 4.6 Validação de transferências pareadas (conciliação)
--    Toda transferência saída DEVE ter uma entrada correspondente de mesmo valor e data
SELECT
    'par_invalido'            AS alerta,
    t_deb.id                  AS transacao_id,
    t_deb.account_id          AS conta_origem,
    t_deb.amount,
    t_deb.date
FROM transaction t_deb
WHERE t_deb.type = 'DEBIT'
  AND t_deb.description LIKE '%Transfer Sent%'
  AND NOT EXISTS (
      SELECT 1
      FROM transaction t_cred
      WHERE t_cred.type   = 'CREDIT'
        AND t_cred.amount = t_deb.amount
        AND t_cred.date   = t_deb.date
        AND t_cred.description LIKE '%Transfer Received%'
  );
-- Resultado esperado: 0 linhas (todas as transferências têm par)

-- ── 4.7 Concentração de risco: clientes com mais de 40% do patrimônio em empréstimos
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END)  AS ativo,
    SUM(CASE WHEN a.balance < 0 THEN ABS(a.balance) ELSE 0 END) AS passivo,
    ROUND(
        SUM(CASE WHEN a.balance < 0 THEN ABS(a.balance) ELSE 0 END)
        / NULLIF(SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END), 0)
        * 100, 1
    ) AS comprometimento_pct
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE c.active = TRUE
GROUP BY c.id, c.first_name, c.last_name
HAVING SUM(CASE WHEN a.balance < 0 THEN ABS(a.balance) ELSE 0 END)
       / NULLIF(SUM(CASE WHEN a.balance > 0 THEN a.balance ELSE 0 END), 0) > 0.40
ORDER BY comprometimento_pct DESC;


-- ════════════════════════════════════════════════════════════
-- PERGUNTAS DE ENTREVISTA — GABARITO
-- ════════════════════════════════════════════════════════════

-- ── P1: "Qual a diferença entre INNER JOIN, LEFT JOIN e FULL OUTER JOIN?"
-- Demonstração prática:

-- INNER JOIN — apenas clientes QUE TÊM contas (exclui quem não tem)
SELECT c.username, a.type, a.balance
FROM customer c INNER JOIN account a ON a.customer_id = c.id;

-- LEFT JOIN — TODOS os clientes, mesmo sem conta (coluna da direita vira NULL)
SELECT c.username, a.type, a.balance
FROM customer c LEFT JOIN account a ON a.customer_id = c.id;

-- FULL OUTER JOIN — todos de ambos os lados, NULLs dos dois lados
SELECT c.username, a.type, a.balance
FROM customer c FULL OUTER JOIN account a ON a.customer_id = c.id;

-- ── P2: "Qual a diferença entre WHERE e HAVING?"
-- WHERE filtra ANTES de agregar (linha a linha)
-- HAVING filtra DEPOIS de agregar (sobre o resultado do GROUP BY)
SELECT type, COUNT(*), SUM(balance)
FROM account
WHERE balance > 0           -- filtra antes do GROUP BY
GROUP BY type
HAVING COUNT(*) > 1;        -- filtra o resultado agregado

-- ── P3: "O que é uma subquery correlacionada? Dê um exemplo bancário."
-- Subquery correlacionada: referencia a tabela externa — executada para cada linha
-- Aqui: para cada conta, busca a transação mais recente
SELECT
    a.id,
    a.type,
    a.balance,
    (SELECT MAX(t.date)
     FROM transaction t
     WHERE t.account_id = a.id) AS ultima_movimentacao   -- correlaciona com a.id
FROM account a
ORDER BY ultima_movimentacao NULLS LAST;

-- ── P4: "Como você usaria EXISTS vs IN? Quando um é melhor?"
-- EXISTS: mais eficiente quando a subquery retorna muitas linhas
--         para no primeiro match encontrado
-- IN: mais simples para listas pequenas e estáticas

-- EXISTS (preferido em bancos com grandes volumes):
SELECT c.first_name, c.last_name
FROM customer c
WHERE EXISTS (
    SELECT 1 FROM account a
    WHERE a.customer_id = c.id AND a.type = 'LOAN'
);

-- IN equivalente (mesmo resultado, potencialmente menos eficiente):
SELECT first_name, last_name
FROM customer
WHERE id IN (SELECT customer_id FROM account WHERE type = 'LOAN');

-- ── P5: "Escreva uma query para encontrar duplicatas"
-- Duplicatas de CPF (violação de unicidade — crítico em banco)
SELECT ssn, COUNT(*) AS ocorrencias, STRING_AGG(username, ', ') AS usuarios
FROM customer
WHERE ssn IS NOT NULL
GROUP BY ssn
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 linhas (dado de teste está correto)

-- ── P6: "Como funciona COALESCE? Use em contexto bancário."
-- COALESCE retorna o primeiro valor não-NULL da lista
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    COALESCE(c.phone, 'Não informado')    AS telefone,
    COALESCE(c.address, 'Não cadastrado') AS endereco,
    COALESCE(MAX(t.date)::TEXT, 'Nunca movimentou') AS ultima_transacao
FROM customer c
LEFT JOIN account a    ON a.customer_id = c.id
LEFT JOIN transaction t ON t.account_id = a.id
GROUP BY c.id, c.first_name, c.last_name, c.phone, c.address;

-- ── P7: "O que é NULLIF e quando usar?"
-- NULLIF(a, b): retorna NULL se a = b; caso contrário, retorna a
-- Uso: evitar divisão por zero
SELECT
    type,
    SUM(balance) AS total,
    COUNT(*)     AS qtd,
    SUM(balance) / NULLIF(COUNT(*), 0) AS media_segura  -- sem NULLIF daria erro se COUNT=0
FROM account
GROUP BY type;

-- ── P8: "Explique CASE WHEN com exemplo de categorização de risco"
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    SUM(a.balance)                      AS patrimonio_total,
    CASE
        WHEN SUM(a.balance) > 50000  THEN 'ALTO VALOR'
        WHEN SUM(a.balance) > 10000  THEN 'MÉDIO VALOR'
        WHEN SUM(a.balance) > 0      THEN 'BAIXO VALOR'
        WHEN SUM(a.balance) = 0      THEN 'SEM SALDO'
        ELSE                              'NEGATIVO (RISCO)'
    END AS categoria_cliente
FROM customer c
JOIN account a ON a.customer_id = c.id
WHERE c.active = TRUE
GROUP BY c.id, c.first_name, c.last_name
ORDER BY patrimonio_total DESC;

-- ── P9: "Qual a diferença entre DELETE, TRUNCATE e DROP?"
-- DELETE: remove linhas específicas, pode ter WHERE, ativado em auditoria/trigger, pode fazer rollback
-- TRUNCATE: remove TODAS as linhas, mais rápido, NÃO aciona triggers, pode fazer rollback (em PG)
-- DROP: remove a tabela INTEIRA (estrutura + dados), irreversível

-- Em banco real, QA nunca usa DROP ou TRUNCATE em produção sem backup e aprovação.

-- ── P10: "Como funciona uma transação ACID? Dê exemplo com transferência bancária."
-- ACID: Atomicidade, Consistência, Isolamento, Durabilidade
-- Exemplo: TED entre contas deve debitar E creditar em uma única transação atômica

-- Pseudocódigo SQL:
-- BEGIN;
--   UPDATE account SET balance = balance - 1000 WHERE id = 1;  -- débito origem
--   UPDATE account SET balance = balance + 1000 WHERE id = 3;  -- crédito destino
--   INSERT INTO transaction (account_id, type, amount, description, date)
--     VALUES (1, 'DEBIT', 1000, 'TED Enviado', CURRENT_DATE);
--   INSERT INTO transaction (account_id, type, amount, description, date)
--     VALUES (3, 'CREDIT', 1000, 'TED Recebido', CURRENT_DATE);
-- COMMIT;
-- Se qualquer etapa falhar → ROLLBACK (nenhuma das operações persiste)
