-- ============================================================
-- SCHEMA: Sistema Bancário - QA Sicoob Demo
-- Compatível com PostgreSQL e IBM DB2 (SQL padrão ANSI)
-- ============================================================

-- Clientes
CREATE TABLE customer (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    ssn         VARCHAR(20)  UNIQUE,           -- CPF/CNPJ
    address     VARCHAR(200),
    city        VARCHAR(50),
    state       VARCHAR(50),
    zip_code    VARCHAR(10),
    phone       VARCHAR(20),
    email       VARCHAR(100) UNIQUE NOT NULL,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    active      BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tipos de conta
CREATE TYPE account_type AS ENUM (
    'CHECKING',     -- Conta Corrente
    'SAVINGS',      -- Conta Poupança
    'LOAN',         -- Empréstimo
    'CREDIT',       -- Crédito
    'OVERDRAFT'     -- Conta Especial
);

-- Contas
CREATE TABLE account (
    id          SERIAL PRIMARY KEY,
    customer_id INTEGER      NOT NULL REFERENCES customer(id),
    type        account_type NOT NULL DEFAULT 'CHECKING',
    balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    active      BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance CHECK (
        balance >= 0 OR type IN ('LOAN', 'CREDIT', 'OVERDRAFT')
    )
);

-- Tipos de transação
CREATE TYPE transaction_type AS ENUM (
    'DEBIT',        -- Débito
    'CREDIT'        -- Crédito
);

-- Transações
CREATE TABLE transaction (
    id              SERIAL PRIMARY KEY,
    account_id      INTEGER          NOT NULL REFERENCES account(id),
    type            transaction_type NOT NULL,
    amount          DECIMAL(15,2)    NOT NULL CHECK (amount > 0),
    description     VARCHAR(255),
    date            DATE             NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP
);

-- Log de Auditoria (rastreabilidade — requisito bancário crítico)
CREATE TABLE audit_log (
    id              SERIAL PRIMARY KEY,
    transaction_id  INTEGER      REFERENCES transaction(id),
    action          VARCHAR(50)  NOT NULL,   -- INSERT, UPDATE, DELETE
    table_name      VARCHAR(50)  NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    performed_by    VARCHAR(50),
    performed_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance em consultas frequentes
CREATE INDEX idx_account_customer   ON account(customer_id);
CREATE INDEX idx_transaction_account ON transaction(account_id);
CREATE INDEX idx_transaction_date    ON transaction(date);
CREATE INDEX idx_customer_ssn        ON customer(ssn);
CREATE INDEX idx_customer_username   ON customer(username);
