-- ─────────────────────────────────────────────────────────────────────────────
-- SpinWheel — Schema e Seed para demo-igaming
-- Banco: banking_db (PostgreSQL 15)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Catálogo de prêmios ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sw_prizes (
  id           SERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  description  TEXT,
  type         TEXT        NOT NULL CHECK (type IN ('coins','discount','product','ticket','jackpot')),
  value        NUMERIC(12,2) NOT NULL DEFAULT 0,
  product_name TEXT,
  product_sku  TEXT,
  weight       INTEGER     NOT NULL CHECK (weight > 0),  -- soma total = 1000 → 0.1% por unidade
  color        TEXT        NOT NULL DEFAULT '#6c757d',
  icon         TEXT        NOT NULL DEFAULT '🎁',
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  max_per_day  INTEGER,                                  -- NULL = ilimitado
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Saldo de tickets por usuário/tenant ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS sw_tickets (
  id         SERIAL PRIMARY KEY,
  username   TEXT    NOT NULL,
  tenant_id  TEXT    NOT NULL DEFAULT 'operadora-a',
  balance    INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (username, tenant_id)
);

-- ── Catálogo de metas semanais ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sw_goals (
  id              SERIAL PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  goal_type       TEXT NOT NULL CHECK (goal_type IN ('bets_count','deposit_amount','sports_variety','login_streak','referral')),
  target_value    NUMERIC(12,2) NOT NULL,
  tickets_reward  INTEGER NOT NULL DEFAULT 1,
  icon            TEXT NOT NULL DEFAULT '🎯',
  active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Progresso semanal do usuário nas metas ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sw_user_goals (
  id               SERIAL PRIMARY KEY,
  username         TEXT  NOT NULL,
  tenant_id        TEXT  NOT NULL DEFAULT 'operadora-a',
  goal_id          INTEGER NOT NULL REFERENCES sw_goals(id),
  week_start       DATE  NOT NULL,    -- segunda-feira da semana corrente
  current_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  tickets_granted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (username, tenant_id, goal_id, week_start)
);

-- ── Histórico de giros ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sw_spins (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL,
  tenant_id   TEXT NOT NULL DEFAULT 'operadora-a',
  prize_id    INTEGER NOT NULL REFERENCES sw_prizes(id),
  prize_name  TEXT NOT NULL,
  prize_type  TEXT NOT NULL,
  prize_value NUMERIC(12,2),
  seed_hash   TEXT NOT NULL,
  nonce       BIGINT NOT NULL,
  spun_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed    BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sw_tickets_user     ON sw_tickets(username, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sw_user_goals_user  ON sw_user_goals(username, tenant_id, week_start);
CREATE INDEX IF NOT EXISTS idx_sw_spins_user       ON sw_spins(username, tenant_id, spun_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED — Prêmios (total weight = 1000 → cada unidade = 0.1%)
-- ─────────────────────────────────────────────────────────────────────────────
TRUNCATE sw_prizes RESTART IDENTITY CASCADE;

INSERT INTO sw_prizes (name, description, type, value, product_name, product_sku, weight, color, icon) VALUES
  ('50 Moedas',              'Crédito de 50 moedas na sua carteira',              'coins',    50,    NULL,                    NULL,       300, '#f4c430', '🪙'),
  ('100 Moedas',             'Crédito de 100 moedas na sua carteira',             'coins',   100,    NULL,                    NULL,       200, '#ffd700', '🪙'),
  ('200 Moedas',             'Crédito de 200 moedas na sua carteira',             'coins',   200,    NULL,                    NULL,       150, '#ff8c00', '🪙'),
  ('Desconto R$10',          'R$10 de desconto no próximo depósito',              'discount',  10,    NULL,                    NULL,       150, '#28a745', '💰'),
  ('Desconto R$25',          'R$25 de desconto no próximo depósito',              'discount',  25,    NULL,                    NULL,       100, '#20c997', '💰'),
  ('Garmin FR55 – 30% OFF',  '30% de desconto no Garmin Forerunner 55',           'product',   30,    'Garmin Forerunner 55',  'GM-FR55',   50, '#0d6efd', '⌚'),
  ('Garmin FR255 – 50% OFF', '50% de desconto no Garmin Forerunner 255',          'product',   50,    'Garmin Forerunner 255', 'GM-FR255',  30, '#6610f2', '⌚'),
  ('Ticket Bônus',           'Ganhe mais 1 ticket para girar a roleta',           'ticket',     1,    NULL,                    NULL,        19, '#dc3545', '🎟️'),
  ('🏆 JACKPOT – Garmin Fenix 8', 'Garmin Fenix 8 Solar GRÁTIS! Parabéns!',      'jackpot',  100,    'Garmin Fenix 8 Solar',  'GM-FNX8',    1, '#ff1493', '🏆');

-- ── Metas semanais ────────────────────────────────────────────────────────────
TRUNCATE sw_goals RESTART IDENTITY CASCADE;

INSERT INTO sw_goals (code, name, description, goal_type, target_value, tickets_reward, icon) VALUES
  ('WEEKLY_BETS_5',       'Apostador da Semana',    'Realize 5 apostas nesta semana',                     'bets_count',      5,   1, '🎯'),
  ('WEEKLY_DEPOSIT_500',  'Investidor',             'Deposite R$500 na plataforma nesta semana',           'deposit_amount',  500, 1, '💰'),
  ('WEEKLY_SPORTS_3',     'Multi-Esportista',       'Aposte em 3 esportes diferentes nesta semana',       'sports_variety',  3,   1, '🏆'),
  ('WEEKLY_LOGIN_7',      'Streaker',               'Faça login 7 dias consecutivos',                      'login_streak',    7,   2, '🔥'),
  ('WEEKLY_REFERRAL',     'Embaixador',             'Indique 1 amigo que faça o primeiro depósito',        'referral',        1,   2, '⭐');

-- ── Saldo inicial de tickets para player01 (para demo/testes) ─────────────────
INSERT INTO sw_tickets (username, tenant_id, balance) VALUES
  ('player01', 'operadora-a', 3),
  ('player01', 'operadora-b', 1),
  ('admin_qa', 'operadora-a', 5)
ON CONFLICT (username, tenant_id) DO UPDATE SET balance = EXCLUDED.balance;

-- ── Progresso seed para player01 na semana atual ─────────────────────────────
WITH week AS (SELECT date_trunc('week', CURRENT_DATE)::DATE AS w)
INSERT INTO sw_user_goals (username, tenant_id, goal_id, week_start, current_value, completed, tickets_granted)
SELECT 'player01', 'operadora-a', g.id, week.w,
  CASE g.code
    WHEN 'WEEKLY_BETS_5'      THEN 3      -- 3 de 5 apostas feitas
    WHEN 'WEEKLY_DEPOSIT_500' THEN 350    -- R$350 de R$500
    WHEN 'WEEKLY_SPORTS_3'    THEN 2      -- 2 de 3 esportes
    WHEN 'WEEKLY_LOGIN_7'     THEN 4      -- 4 de 7 dias
    WHEN 'WEEKLY_REFERRAL'    THEN 0      -- ainda não indicou
    ELSE 0
  END,
  FALSE, FALSE
FROM sw_goals g, week
ON CONFLICT (username, tenant_id, goal_id, week_start) DO NOTHING;
