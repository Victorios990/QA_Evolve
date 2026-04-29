-- ============================================================
-- SEED: Massa de dados para testes
-- ============================================================

-- Clientes
INSERT INTO customer (first_name, last_name, ssn, email, username, password, phone, city, state)
VALUES
    ('João',   'Silva',     '123.456.789-00', 'joao.silva@email.com',   'john',  'demo',   '61-99999-0001', 'Brasília', 'DF'),
    ('Maria',  'Santos',    '987.654.321-00', 'maria.santos@email.com', 'maria', 'senha2', '61-99999-0002', 'Brasília', 'DF'),
    ('Carlos', 'Oliveira',  '111.222.333-44', 'carlos.oli@email.com',   'carlo', 'senha3', '61-99999-0003', 'Goiânia',  'GO'),
    ('Ana',    'Costa',     '555.666.777-88', 'ana.costa@email.com',    'ana',   'senha4', '61-99999-0004', 'Brasília', 'DF');

-- Contas
INSERT INTO account (customer_id, type, balance)
VALUES
    (1, 'CHECKING', 1500.00),   -- conta corrente do João
    (1, 'SAVINGS',  5000.00),   -- poupança do João
    (2, 'CHECKING', 2300.50),
    (3, 'CHECKING',  800.00),
    (3, 'LOAN',    -15000.00),  -- empréstimo (saldo negativo permitido)
    (4, 'CHECKING',  100.00);

-- Transações históricas
INSERT INTO transaction (account_id, type, amount, description, date)
VALUES
    (1, 'CREDIT', 1000.00, 'Depósito inicial',           '2024-01-05'),
    (1, 'CREDIT',  500.00, 'Salário',                    '2024-02-01'),
    (1, 'DEBIT',   200.00, 'Pagamento de boleto',        '2024-02-10'),
    (1, 'DEBIT',    50.00, 'Funds Transfer Sent',        '2024-02-15'),
    (2, 'CREDIT',   50.00, 'Funds Transfer Received',    '2024-02-15'),
    (2, 'CREDIT', 5000.00, 'Aplicação poupança',         '2024-01-10'),
    (3, 'CREDIT', 2300.50, 'Saldo inicial',              '2024-01-01'),
    (4, 'CREDIT',  800.00, 'Saldo inicial',              '2024-01-01');

-- Audit log correspondente às transações
INSERT INTO audit_log (transaction_id, action, table_name, new_value, performed_by)
SELECT id, 'INSERT', 'transaction', description, 'system'
FROM transaction;
