-- ============================================================
-- SEED v3 — Banco de Dados QA Sicoob
-- 40 clientes | 54 contas | ~190 transações
--
-- Cenários cobertos:
--   ✔ Cliente inativo com saldo (risco compliance)
--   ✔ Inadimplência — LOAN sem pagamento há +90 dias
--   ✔ Contas dormentes — sem movimentação há +90 dias
--   ✔ COAF — depósito único > R$10.000
--   ✔ Smurfing — 4 depósitos em espécie R$5k-9.9k em 7 dias
--   ✔ Transferências pareadas (TED/PIX débito e crédito)
--   ✔ Saldo zero — salário entra e sai totalmente
--   ✔ Concentração de risco — passivo > 40% do ativo
--   ✔ CPF único em toda a base (sem duplicatas)
--   ✔ Integridade referencial completa
-- ============================================================

TRUNCATE audit_log, transaction, account, customer RESTART IDENTITY CASCADE;

-- ════════════════════════════════════════════════════════════
-- CLIENTES (40)
-- IDs  1-30: ativos
-- IDs 31-40: inativos
-- ════════════════════════════════════════════════════════════
INSERT INTO customer
    (first_name, last_name, ssn, address, city, state, zip_code, phone, email, username, password, active)
VALUES
-- ── BRASÍLIA – DF (10 ativos) ────────────────────────────────
('João',      'Silva',      '111.111.111-11', 'SQS 308 Bloco A Ap 101',   'Brasília',       'DF', '70353-010', '61-99999-0001', 'joao.silva@email.com',       'joaosilva',     'hash_senha', TRUE),
('Maria',     'Santos',     '222.222.222-22', 'SQN 210 Bloco B Ap 302',   'Brasília',       'DF', '70852-020', '61-99999-0002', 'maria.santos@email.com',     'mariasantos',   'hash_senha', TRUE),
('Ana',       'Costa',      '333.333.333-33', 'SHIS QI 11 Bloco C Ap 5',  'Brasília',       'DF', '71625-030', '61-99999-0004', 'ana.costa@email.com',        'anacosta',      'hash_senha', TRUE),
('Fernanda',  'Lima',       '444.444.444-44', 'SQS 412 Bloco D Ap 201',   'Brasília',       'DF', '70297-040', '61-99999-0006', 'fernanda.lima@email.com',    'fernandalima',  'hash_senha', TRUE),
('Beatriz',   'Ramos',      '555.555.555-55', 'CLN 405 Bloco A Sala 10',  'Brasília',       'DF', '70840-510', '61-99999-0010', 'beatriz.ramos@email.com',    'beatrizramos',  'hash_senha', TRUE),
('André',     'Monteiro',   '666.666.666-66', 'SQS 102 Bloco E Ap 405',   'Brasília',       'DF', '70354-050', '61-99999-0013', 'andre.monteiro@email.com',   'andremonteiro', 'hash_senha', TRUE),
('Eduardo',   'Carvalho',   '777.777.777-77', 'SHN Q2 Bloco H Ap 1101',   'Brasília',       'DF', '70702-060', '61-99999-0015', 'eduardo.carvalho@email.com', 'eduardocarv',   'hash_senha', TRUE),
('Isadora',   'Ribeiro',    '888.888.888-88', 'SQSW 304 Bloco G Ap 203',  'Brasília',       'DF', '70673-070', '61-99999-0017', 'isadora.ribeiro@email.com',  'isadorah',      'hash_senha', TRUE),
('Priscila',  'Lopes',      '900.900.900-90', 'SQN 316 Bloco F Ap 101',   'Brasília',       'DF', '70774-060', '61-99999-0021', 'priscila.lopes@email.com',   'priscilal',     'hash_senha', TRUE),
('Camila',    'Rodrigues',  '910.910.910-91', 'SQS 204 Bloco B Ap 501',   'Brasília',       'DF', '70234-020', '61-99999-0024', 'camila.rodrigues@email.com', 'camilarodri',   'hash_senha', TRUE),
-- ── GOIÂNIA – GO (6 ativos) ──────────────────────────────────
('Carlos',    'Oliveira',   '121.121.121-21', 'Rua 10 Q5 L2',             'Goiânia',        'GO', '74810-100', '62-99999-0003', 'carlos.oliveira@email.com',  'carlosoliv',    'hash_senha', TRUE),
('Patrícia',  'Nunes',      '131.131.131-31', 'Rua T-63 Q901 L12',        'Goiânia',        'GO', '74255-110', '62-99999-0009', 'patricia.nunes@email.com',   'patrician',     'hash_senha', TRUE),
('Gabriela',  'Pinto',      '141.141.141-41', 'Avenida 136 Q F37 L8',     'Goiânia',        'GO', '74170-120', '62-99999-0014', 'gabriela.pinto@email.com',   'gabrielap',     'hash_senha', TRUE),
('Natalia',   'Correia',    '151.151.151-51', 'Rua 9 Q46 L5 Setor Sul',   'Goiânia',        'GO', '74090-130', '62-99999-0016', 'natalia.correia@email.com',  'nataliacorr',   'hash_senha', TRUE),
('Viviane',   'Sousa',      '161.161.161-61', 'Rua 1021 Q84 L3',          'Goiânia',        'GO', '74673-140', '62-99999-0020', 'viviane.sousa@email.com',    'vivianes',      'hash_senha', TRUE),
('Roberto',   'Ferreira',   '171.171.171-71', 'Rua 88 Q115 L22',          'Goiânia',        'GO', '74495-150', '62-99999-0026', 'roberto.ferreira@email.com', 'robertof',      'hash_senha', TRUE),
-- ── SÃO PAULO – SP (6 ativos) ────────────────────────────────
('Pedro',     'Almeida',    '181.181.181-81', 'Av. Paulista 1578 Ap 82',  'São Paulo',      'SP', '01310-200', '11-99999-0005', 'pedro.almeida@email.com',    'pedroalm',      'hash_senha', TRUE),
('Felipe',    'Cardoso',    '191.191.191-91', 'Rua Oscar Freire 900',     'São Paulo',      'SP', '01426-001', '11-99999-0012', 'felipe.cardoso@email.com',   'felipecardoso', 'hash_senha', TRUE),
('Rafael',    'Barbosa',    '201.201.201-20', 'Rua Consolação 2134',      'São Paulo',      'SP', '01301-100', '11-99999-0018', 'rafael.barbosa@email.com',   'rafaelb',       'hash_senha', TRUE),
('Vanessa',   'Freitas',    '211.211.211-21', 'Av. Brig. Faria Lima 2',   'São Paulo',      'SP', '04538-133', '11-99999-0019', 'vanessa.freitas@email.com',  'vanessaf',      'hash_senha', TRUE),
('Marcos',    'Pereira',    '221.221.221-22', 'Rua Haddock Lobo 595',     'São Paulo',      'SP', '01414-001', '11-99999-0025', 'marcos.pereira@email.com',   'marcosp',       'hash_senha', TRUE),
('Larissa',   'Teixeira',   '231.231.231-23', 'Av. das Nações Unidas 14', 'São Paulo',      'SP', '04794-000', '11-99999-0027', 'larissa.teixeira@email.com', 'larissat',      'hash_senha', TRUE),
-- ── BELO HORIZONTE – MG (4 ativos) ───────────────────────────
('Juliana',   'Souza',      '241.241.241-24', 'Rua A. Albuquerque 400',   'Belo Horizonte', 'MG', '30112-010', '31-99999-0008', 'juliana.souza@email.com',    'julianasouza',  'hash_senha', TRUE),
('Diego',     'Araújo',     '251.251.251-25', 'Av. Getúlio Vargas 1500',  'Belo Horizonte', 'MG', '30112-020', '31-99999-0011', 'diego.araujo@email.com',     'diegoaraujo',   'hash_senha', TRUE),
('Henrique',  'Dias',       '261.261.261-26', 'Rua da Bahia 868',         'Belo Horizonte', 'MG', '30160-030', '31-99999-0022', 'henrique.dias@email.com',    'henriqued',     'hash_senha', TRUE),
('Amanda',    'Gomes',      '271.271.271-27', 'Rua Espírito Santo 1200',  'Belo Horizonte', 'MG', '30160-040', '31-99999-0028', 'amanda.gomes@email.com',     'amandag',       'hash_senha', TRUE),
-- ── CURITIBA – PR (2 ativos) ─────────────────────────────────
('Lucas',     'Martins',    '281.281.281-28', 'Rua XV de Novembro 700',   'Curitiba',       'PR', '80020-310', '41-99999-0007', 'lucas.martins@email.com',    'lucasmartins',  'hash_senha', TRUE),
('Gustavo',   'Mendes',     '291.291.291-29', 'Av. Batel 1490',           'Curitiba',       'PR', '80420-090', '41-99999-0023', 'gustavo.mendes@email.com',   'gustavom',      'hash_senha', TRUE),
-- ── PORTO ALEGRE – RS (2 ativos) ─────────────────────────────
('Thiago',    'Castro',     '301.301.301-30', 'Av. Ipiranga 5811',        'Porto Alegre',   'RS', '90610-001', '51-99999-0029', 'thiago.castro@email.com',    'thiagoc',       'hash_senha', TRUE),
('Bruno',     'Machado',    '311.311.311-31', 'Rua Fernandes Vieira 344', 'Porto Alegre',   'RS', '90035-091', '51-99999-0030', 'bruno.machado@email.com',    'brunomachado',  'hash_senha', TRUE),
-- ── INATIVOS (10) ─────────────────────────────────────────────
('Bruno',     'Santos',     '321.321.321-32', 'SQS 108 Bloco B Ap 203',   'Brasília',       'DF', '70353-020', '61-99999-0031', 'bruno.santos@email.com',     'brunosantos',   'hash_senha', FALSE),
('Sônia',     'Nascimento', '331.331.331-33', 'SQN 312 Bloco A Ap 404',   'Brasília',       'DF', '70852-030', '61-99999-0032', 'sonia.nascimento@email.com', 'sonianascim',   'hash_senha', FALSE),
('Fábio',     'Cavalcanti', '341.341.341-34', 'Av. Paulista 900 Ap 151',  'São Paulo',      'SP', '01310-100', '11-99999-0033', 'fabio.cavalcanti@email.com', 'fabiocavalc',   'hash_senha', FALSE),
('Rogério',   'Campos',     '351.351.351-35', 'Rua 44 Q200 L8',           'Goiânia',        'GO', '74135-160', '62-99999-0034', 'rogerio.campos@email.com',   'rogeriocampos', 'hash_senha', FALSE),
('Claudia',   'Vieira',     '361.361.361-36', 'Rua Augusta 1200 Ap 3',    'São Paulo',      'SP', '01305-100', '11-99999-0035', 'claudia.vieira@email.com',   'claudiav',      'hash_senha', FALSE),
('Antônio',   'Moreira',    '371.371.371-37', 'Av. Afonso Pena 2000',     'Belo Horizonte', 'MG', '30130-009', '31-99999-0036', 'antonio.moreira@email.com',  'antoniom',      'hash_senha', FALSE),
('Cristiane', 'Borges',     '381.381.381-38', 'Rua João Negrão 590',      'Curitiba',       'PR', '80010-200', '41-99999-0037', 'cristiane.borges@email.com', 'cristianeb',    'hash_senha', FALSE),
('Denise',    'Rocha',      '391.391.391-39', 'SQS 310 Bloco C Ap 102',   'Brasília',       'DF', '70363-030', '61-99999-0038', 'denise.rocha@email.com',     'deniserocha',   'hash_senha', FALSE),
('Mauro',     'Azevedo',    '401.401.401-40', 'Rua 85 Q15 L9',            'Goiânia',        'GO', '74810-200', '62-99999-0039', 'mauro.azevedo@email.com',    'mauroazevedo',  'hash_senha', FALSE),
('Patricia',  'Esteves',    '411.411.411-41', 'Av. Ipiranga 2800 Ap 11',  'Porto Alegre',   'RS', '90610-002', '51-99999-0040', 'patricia.esteves@email.com', 'patriciaestev', 'hash_senha', FALSE);


-- ════════════════════════════════════════════════════════════
-- CONTAS (54)
-- Mapeamento: customer_id referencia IDs da tabela customer acima
-- Tipos: CHECKING=corrente | SAVINGS=poupança | LOAN=empréstimo
--        CREDIT=crédito    | OVERDRAFT=especial
-- ════════════════════════════════════════════════════════════
INSERT INTO account (customer_id, type, balance, active) VALUES
-- ── Brasília ──────────────────────────────────────────────────
( 1, 'CHECKING',  12500.00, TRUE),   -- acc  1: João Silva — corrente
( 1, 'SAVINGS',   45200.00, TRUE),   -- acc  2: João Silva — poupança
( 2, 'CHECKING',   3250.75, TRUE),   -- acc  3: Maria Santos — corrente
( 3, 'CHECKING',   8100.00, TRUE),   -- acc  4: Ana Costa — corrente
( 3, 'SAVINGS',   16500.00, TRUE),   -- acc  5: Ana Costa — poupança
( 4, 'CHECKING',   2350.00, TRUE),   -- acc  6: Fernanda Lima — corrente
( 5, 'CHECKING',   1890.50, TRUE),   -- acc  7: Beatriz Ramos — corrente (DORMENTE)
( 6, 'CHECKING',   4100.00, TRUE),   -- acc  8: André Monteiro — corrente
( 6, 'CREDIT',    -3200.00, TRUE),   -- acc  9: André Monteiro — crédito (negativo)
( 7, 'CHECKING',      0.00, TRUE),   -- acc 10: Eduardo Carvalho — corrente (SALDO ZERO)
( 8, 'CHECKING',   9200.00, TRUE),   -- acc 11: Isadora Ribeiro — corrente
( 8, 'SAVINGS',   28000.00, TRUE),   -- acc 12: Isadora Ribeiro — poupança
( 9, 'CHECKING',   2780.00, TRUE),   -- acc 13: Priscila Lopes — corrente
(10, 'CHECKING',   4250.00, TRUE),   -- acc 14: Camila Rodrigues — corrente
(10, 'CREDIT',    -1850.00, TRUE),   -- acc 15: Camila Rodrigues — crédito
-- ── Goiânia ───────────────────────────────────────────────────
(11, 'CHECKING',    890.00, TRUE),   -- acc 16: Carlos Oliveira — corrente
(11, 'LOAN',     -18500.00, TRUE),   -- acc 17: Carlos Oliveira — empréstimo (pagando)
(12, 'CHECKING',   6750.00, TRUE),   -- acc 18: Patrícia Nunes — corrente
(13, 'CHECKING',    980.00, TRUE),   -- acc 19: Gabriela Pinto — corrente
(14, 'CHECKING',   4500.00, TRUE),   -- acc 20: Natalia Correia — corrente
(15, 'CHECKING',   3900.00, TRUE),   -- acc 21: Viviane Sousa — corrente
(16, 'CHECKING',    450.00, TRUE),   -- acc 22: Roberto Ferreira — corrente (INADIMPLENTE)
(16, 'LOAN',     -22000.00, TRUE),   -- acc 23: Roberto Ferreira — empréstimo sem pagamento +90d
-- ── São Paulo ─────────────────────────────────────────────────
(17, 'CHECKING',  87300.00, TRUE),   -- acc 24: Pedro Almeida — corrente (ALTO VALOR)
(17, 'SAVINGS',  125000.00, TRUE),   -- acc 25: Pedro Almeida — poupança (ALTO VALOR)
(18, 'CHECKING',  55000.00, TRUE),   -- acc 26: Felipe Cardoso — corrente (SMURFING)
(19, 'CHECKING',    650.00, TRUE),   -- acc 27: Rafael Barbosa — corrente
(19, 'LOAN',      -9800.00, TRUE),   -- acc 28: Rafael Barbosa — empréstimo (pagando)
(20, 'CHECKING',    750.00, TRUE),   -- acc 29: Vanessa Freitas — corrente (DORMENTE)
(21, 'CHECKING',  61000.00, TRUE),   -- acc 30: Marcos Pereira — corrente (COAF)
(22, 'CHECKING',   2400.00, TRUE),   -- acc 31: Larissa Teixeira — corrente
-- ── Belo Horizonte ────────────────────────────────────────────
(23, 'CHECKING',   5800.00, TRUE),   -- acc 32: Juliana Souza — corrente
(23, 'SAVINGS',    8900.00, TRUE),   -- acc 33: Juliana Souza — poupança
(24, 'CHECKING',   1550.00, TRUE),   -- acc 34: Diego Araújo — corrente (RISCO CONCENTRAÇÃO)
(24, 'LOAN',     -14000.00, TRUE),   -- acc 35: Diego Araújo — empréstimo (pagando)
(25, 'CHECKING',   6200.00, TRUE),   -- acc 36: Henrique Dias — corrente
(25, 'SAVINGS',   18500.00, TRUE),   -- acc 37: Henrique Dias — poupança
(26, 'SAVINGS',    3500.00, TRUE),   -- acc 38: Amanda Gomes — poupança
-- ── Curitiba ──────────────────────────────────────────────────
(27, 'CHECKING',   1200.00, TRUE),   -- acc 39: Lucas Martins — corrente (DORMENTE)
(28, 'CHECKING',   3100.00, TRUE),   -- acc 40: Gustavo Mendes — corrente
-- ── Porto Alegre ──────────────────────────────────────────────
(29, 'CHECKING',   3300.00, TRUE),   -- acc 41: Thiago Castro — corrente
(29, 'SAVINGS',   12000.00, TRUE),   -- acc 42: Thiago Castro — poupança
(30, 'CHECKING',   1650.00, TRUE),   -- acc 43: Bruno Machado — corrente
-- ── Inativos (contas ativas = risco compliance) ───────────────
(31, 'CHECKING',   4200.00, TRUE),   -- acc 44: Bruno Santos — inativo com saldo (compliance!)
(32, 'CHECKING',  12800.00, TRUE),   -- acc 45: Sônia Nascimento — inativa com saldo alto
(33, 'CHECKING',  89000.00, TRUE),   -- acc 46: Fábio Cavalcanti — inativo com saldo suspeito
(34, 'CHECKING',    200.00, TRUE),   -- acc 47: Rogério Campos — inativo, corrente
(34, 'LOAN',      -6500.00, TRUE),   -- acc 48: Rogério Campos — empréstimo em aberto (inativo!)
(35, 'CHECKING',      0.00, FALSE),  -- acc 49: Claudia Vieira — conta encerrada
(36, 'CHECKING',    150.00, FALSE),  -- acc 50: Antônio Moreira — conta encerrada
(37, 'SAVINGS',    1200.00, FALSE),  -- acc 51: Cristiane Borges — poupança encerrada
(38, 'CHECKING',      0.00, FALSE),  -- acc 52: Denise Rocha — conta zerada encerrada
(39, 'CHECKING',    350.00, FALSE),  -- acc 53: Mauro Azevedo — conta encerrada
(40, 'CHECKING',      0.00, FALSE);  -- acc 54: Patricia Esteves — conta encerrada


-- ════════════════════════════════════════════════════════════
-- TRANSAÇÕES (~190)
-- account_id referencia os IDs da tabela account acima
-- ════════════════════════════════════════════════════════════
INSERT INTO transaction (account_id, type, amount, description, date) VALUES

-- ── JOÃO SILVA (acc 1 corrente, acc 2 poupança) ───────────────
-- Salário mensal R$8.500
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2025-10-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2025-11-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2025-12-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2026-01-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2026-02-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2026-03-05'),
(1, 'CREDIT',  8500.00, 'Crédito salário — Empresa XYZ',          '2026-04-05'),
-- Despesas fixas
(1, 'DEBIT',   2800.00, 'Débito aluguel — Imobiliária Norte',      '2026-01-10'),
(1, 'DEBIT',    950.00, 'Supermercado Atacadão',                   '2026-01-20'),
(1, 'DEBIT',    480.00, 'Conta de luz e água — CEB/CAESB',         '2026-01-25'),
(1, 'DEBIT',   2800.00, 'Débito aluguel — Imobiliária Norte',      '2026-02-10'),
(1, 'DEBIT',    820.00, 'Supermercado Atacadão',                   '2026-02-18'),
(1, 'DEBIT',   2800.00, 'Débito aluguel — Imobiliária Norte',      '2026-03-10'),
(1, 'DEBIT',    970.00, 'Supermercado Atacadão',                   '2026-03-20'),
(1, 'DEBIT',   2800.00, 'Débito aluguel — Imobiliária Norte',      '2026-04-10'),
(1, 'DEBIT',    890.00, 'Supermercado Atacadão',                   '2026-04-18'),
-- Transferências enviadas (pareadas — João → Maria)
(1, 'DEBIT',   1500.00, 'Funds Transfer Sent',                     '2026-03-15'),
(1, 'DEBIT',    500.00, 'Funds Transfer Sent',                     '2026-04-01'),
-- Rendimento poupança
(2, 'CREDIT',   180.00, 'Rendimento poupança — abril/2026',        '2026-04-30'),

-- ── MARIA SANTOS (acc 3) — recebe transferências do João ──────
(3, 'CREDIT',  4200.00, 'Crédito salário — Cooperativa Sicoob',   '2026-01-05'),
(3, 'CREDIT',  4200.00, 'Crédito salário — Cooperativa Sicoob',   '2026-02-05'),
(3, 'CREDIT',  4200.00, 'Crédito salário — Cooperativa Sicoob',   '2026-03-05'),
(3, 'CREDIT',  4200.00, 'Crédito salário — Cooperativa Sicoob',   '2026-04-05'),
(3, 'DEBIT',   1500.00, 'Débito aluguel',                          '2026-01-10'),
(3, 'DEBIT',   1500.00, 'Débito aluguel',                          '2026-02-10'),
(3, 'DEBIT',   1500.00, 'Débito aluguel',                          '2026-03-10'),
(3, 'DEBIT',   1500.00, 'Débito aluguel',                          '2026-04-10'),
(3, 'CREDIT',  1500.00, 'Funds Transfer Received',                 '2026-03-15'),  -- par do João
(3, 'CREDIT',   500.00, 'Funds Transfer Received',                 '2026-04-01'),  -- par do João

-- ── ANA COSTA (acc 4 corrente, acc 5 poupança) ────────────────
(4, 'CREDIT',  6800.00, 'Crédito salário — GDF',                   '2026-01-05'),
(4, 'CREDIT',  6800.00, 'Crédito salário — GDF',                   '2026-02-05'),
(4, 'CREDIT',  6800.00, 'Crédito salário — GDF',                   '2026-03-05'),
(4, 'CREDIT',  6800.00, 'Crédito salário — GDF',                   '2026-04-05'),
(4, 'DEBIT',   2200.00, 'Débito financiamento imóvel',              '2026-01-15'),
(4, 'DEBIT',    650.00, 'Supermercado Extra',                       '2026-01-22'),
(4, 'DEBIT',   2200.00, 'Débito financiamento imóvel',              '2026-02-15'),
(4, 'DEBIT',   2200.00, 'Débito financiamento imóvel',              '2026-03-15'),
(4, 'DEBIT',   2200.00, 'Débito financiamento imóvel',              '2026-04-15'),
(4, 'DEBIT',   2000.00, 'Funds Transfer Sent',                      '2026-04-20'),  -- → Fernanda
(5, 'CREDIT',   220.00, 'Rendimento poupança — abril/2026',         '2026-04-30'),

-- ── FERNANDA LIMA (acc 6) — recebe de Ana ────────────────────
(6, 'CREDIT',  3500.00, 'Crédito salário — UnB',                   '2026-04-05'),
(6, 'CREDIT',  2000.00, 'Funds Transfer Received',                  '2026-04-20'),  -- par da Ana
(6, 'DEBIT',   1200.00, 'Débito aluguel',                           '2026-04-10'),
(6, 'DEBIT',    450.00, 'Farmácia Brasília',                        '2026-04-25'),

-- ── BEATRIZ RAMOS (acc 7) — CONTA DORMENTE (última mov. nov/2024) ──
(7, 'CREDIT',  2500.00, 'Crédito salário',                         '2024-10-05'),
(7, 'DEBIT',    800.00, 'Supermercado',                             '2024-10-18'),
(7, 'CREDIT',  2500.00, 'Crédito salário',                         '2024-11-05'),
(7, 'DEBIT',    750.00, 'Supermercado',                             '2024-11-20'),
-- Sem movimentação desde novembro/2024 → conta dormente

-- ── ANDRÉ MONTEIRO (acc 8 corrente, acc 9 crédito) ───────────
(8, 'CREDIT',  4500.00, 'Crédito salário',                         '2026-03-05'),
(8, 'CREDIT',  4500.00, 'Crédito salário',                         '2026-04-05'),
(8, 'DEBIT',   1500.00, 'Débito aluguel',                           '2026-03-10'),
(8, 'DEBIT',   1500.00, 'Débito aluguel',                           '2026-04-10'),
(8, 'DEBIT',   3200.00, 'Pagamento fatura cartão de crédito',       '2026-04-20'),

-- ── EDUARDO CARVALHO (acc 10) — SALDO ZERO INTENCIONAL ────────
-- Salário entra e sai completamente no mesmo mês
(10, 'CREDIT', 3200.00, 'Crédito salário — Empresa ABC',            '2026-04-05'),
(10, 'DEBIT',  1400.00, 'Débito aluguel',                           '2026-04-10'),
(10, 'DEBIT',   800.00, 'Supermercado',                             '2026-04-15'),
(10, 'DEBIT',   600.00, 'Plano de saúde',                           '2026-04-20'),
(10, 'DEBIT',   400.00, 'Conta de luz e água',                      '2026-04-22'),
-- saldo: 3200 - 1400 - 800 - 600 - 400 = 0,00 ✓

-- ── ISADORA RIBEIRO (acc 11 corrente, acc 12 poupança) ────────
(11, 'CREDIT', 7500.00, 'Crédito salário — Tribunal Regional',      '2026-01-05'),
(11, 'CREDIT', 7500.00, 'Crédito salário — Tribunal Regional',      '2026-02-05'),
(11, 'CREDIT', 7500.00, 'Crédito salário — Tribunal Regional',      '2026-03-05'),
(11, 'CREDIT', 7500.00, 'Crédito salário — Tribunal Regional',      '2026-04-05'),
(11, 'DEBIT',  1800.00, 'Débito financiamento',                     '2026-01-12'),
(11, 'DEBIT',  1800.00, 'Débito financiamento',                     '2026-02-12'),
(11, 'DEBIT',  1800.00, 'Débito financiamento',                     '2026-03-12'),
(11, 'DEBIT',  1800.00, 'Débito financiamento',                     '2026-04-12'),
(11, 'DEBIT',  1000.00, 'Funds Transfer Sent',                      '2026-04-15'),  -- → Priscila
(12, 'CREDIT',  280.00, 'Rendimento poupança — abril/2026',         '2026-04-30'),

-- ── PRISCILA LOPES (acc 13) — recebe de Isadora ──────────────
(13, 'CREDIT', 3500.00, 'Crédito salário',                         '2026-04-05'),
(13, 'CREDIT', 1000.00, 'Funds Transfer Received',                  '2026-04-15'),  -- par da Isadora
(13, 'DEBIT',  1200.00, 'Débito aluguel',                           '2026-04-10'),

-- ── CAMILA RODRIGUES (acc 14 corrente, acc 15 crédito) ────────
(14, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-03-05'),
(14, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-04-05'),
(14, 'DEBIT',  1100.00, 'Débito aluguel',                           '2026-03-10'),
(14, 'DEBIT',  1100.00, 'Débito aluguel',                           '2026-04-10'),
(14, 'DEBIT',  1850.00, 'Pagamento fatura cartão de crédito',       '2026-04-22'),

-- ── CARLOS OLIVEIRA (acc 16 corrente, acc 17 loan) ────────────
-- Empréstimo em dia — pagando parcelas regularmente
(16, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-01-05'),
(16, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-02-05'),
(16, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-03-05'),
(16, 'CREDIT', 3800.00, 'Crédito salário',                         '2026-04-05'),
(16, 'DEBIT',  1200.00, 'Débito parcela empréstimo',                '2026-01-10'),
(16, 'DEBIT',  1200.00, 'Débito parcela empréstimo',                '2026-02-10'),
(16, 'DEBIT',  1200.00, 'Débito parcela empréstimo',                '2026-03-10'),
(16, 'DEBIT',  1200.00, 'Débito parcela empréstimo',                '2026-04-10'),
(17, 'CREDIT', 1200.00, 'Pagamento parcela empréstimo',             '2026-01-10'),
(17, 'CREDIT', 1200.00, 'Pagamento parcela empréstimo',             '2026-02-10'),
(17, 'CREDIT', 1200.00, 'Pagamento parcela empréstimo',             '2026-03-10'),
(17, 'CREDIT', 1200.00, 'Pagamento parcela empréstimo',             '2026-04-10'),

-- ── ROBERTO FERREIRA (acc 22 corrente, acc 23 loan) — INADIMPLENTE ─
-- Último pagamento: fevereiro/2026 (há +90 dias)
-- Após março: sem salário e sem pagamento → inadimplência
(22, 'CREDIT', 2900.00, 'Crédito salário',                         '2025-12-05'),
(22, 'CREDIT', 2900.00, 'Crédito salário',                         '2026-01-05'),
(22, 'CREDIT', 2900.00, 'Crédito salário',                         '2026-02-05'),
(23, 'CREDIT', 1500.00, 'Pagamento parcela empréstimo',             '2025-12-10'),
(23, 'CREDIT', 1500.00, 'Pagamento parcela empréstimo',             '2026-01-10'),
(23, 'CREDIT', 1500.00, 'Pagamento parcela empréstimo',             '2026-02-10'),
-- Após fevereiro: NENHUM pagamento do empréstimo (INADIMPLENTE)
(22, 'DEBIT',  2500.00, 'Saque emergencial — desemprego',           '2026-03-20'),
-- Conta quase zerada, salário não veio mais

-- ── PEDRO ALMEIDA (acc 24 corrente, acc 25 poupança) — ALTO VALOR ─
(24, 'CREDIT', 25000.00, 'Crédito salário — Diretor Geral',         '2026-01-05'),
(24, 'CREDIT', 25000.00, 'Crédito salário — Diretor Geral',         '2026-02-05'),
(24, 'CREDIT', 25000.00, 'Crédito salário — Diretor Geral',         '2026-03-05'),
(24, 'CREDIT', 25000.00, 'Crédito salário — Diretor Geral',         '2026-04-05'),
(24, 'DEBIT',   8000.00, 'Débito financiamento veículo BMW',        '2026-01-20'),
(24, 'DEBIT',   8000.00, 'Débito financiamento veículo BMW',        '2026-02-20'),
(24, 'DEBIT',   8000.00, 'Débito financiamento veículo BMW',        '2026-03-20'),
(24, 'DEBIT',   8000.00, 'Débito financiamento veículo BMW',        '2026-04-20'),
(24, 'DEBIT',   5000.00, 'Funds Transfer Sent',                     '2026-01-15'),  -- → própria poupança
(25, 'CREDIT',  5000.00, 'Funds Transfer Received',                 '2026-01-15'),
(25, 'CREDIT',  1250.00, 'Rendimento poupança — abril/2026',        '2026-04-30'),

-- ── FELIPE CARDOSO (acc 26) — SMURFING ───────────────────────
-- 4 depósitos em espécie entre R$5k e R$9.999k em 7 dias (abr/2026)
-- Padrão clássico de fracionamento para fugir do limite COAF
(26, 'CREDIT',  4500.00, 'Crédito salário — Empresa FGH',           '2026-04-05'),
(26, 'CREDIT',  8500.00, 'Depósito em espécie — agência 0042',      '2026-04-20'),  -- smurfing 1
(26, 'CREDIT',  9200.00, 'Depósito em espécie — agência 0042',      '2026-04-22'),  -- smurfing 2
(26, 'CREDIT',  7800.00, 'Depósito em espécie — agência 0098',      '2026-04-24'),  -- smurfing 3
(26, 'CREDIT',  9100.00, 'Depósito em espécie — agência 0042',      '2026-04-25'),  -- smurfing 4
-- Logo após os depósitos: transferência e saque (movimentação suspeita)
(26, 'DEBIT',  15000.00, 'Funds Transfer Sent',                     '2026-04-26'),  -- → Marcos
(26, 'DEBIT',  10000.00, 'Saque — balcão agência',                  '2026-04-28'),

-- ── MARCOS PEREIRA (acc 30) — COAF depósito único > R$10k ────
(30, 'CREDIT',  5200.00, 'Crédito salário — Consultoria MKP',       '2026-01-05'),
(30, 'CREDIT',  5200.00, 'Crédito salário — Consultoria MKP',       '2026-02-05'),
(30, 'CREDIT',  5200.00, 'Crédito salário — Consultoria MKP',       '2026-03-05'),
(30, 'CREDIT', 45000.00, 'Depósito em espécie — agência 0001',      '2026-03-12'),  -- COAF! > R$10k
(30, 'CREDIT', 15000.00, 'Funds Transfer Received',                 '2026-04-26'),  -- par do Felipe
(30, 'CREDIT',  5200.00, 'Crédito salário — Consultoria MKP',       '2026-04-05'),
(30, 'DEBIT',   2800.00, 'Débito aluguel',                           '2026-01-10'),
(30, 'DEBIT',   2800.00, 'Débito aluguel',                           '2026-02-10'),
(30, 'DEBIT',   2800.00, 'Débito aluguel',                           '2026-03-10'),
(30, 'DEBIT',   2800.00, 'Débito aluguel',                           '2026-04-10'),

-- ── RAFAEL BARBOSA (acc 27 corrente, acc 28 loan) ────────────
(27, 'CREDIT',  2800.00, 'Crédito salário',                         '2026-01-05'),
(27, 'CREDIT',  2800.00, 'Crédito salário',                         '2026-02-05'),
(27, 'CREDIT',  2800.00, 'Crédito salário',                         '2026-03-05'),
(27, 'CREDIT',  2800.00, 'Crédito salário',                         '2026-04-05'),
(27, 'DEBIT',    800.00, 'Débito parcela empréstimo',                '2026-01-15'),
(27, 'DEBIT',    800.00, 'Débito parcela empréstimo',                '2026-02-15'),
(27, 'DEBIT',    800.00, 'Débito parcela empréstimo',                '2026-03-15'),
(27, 'DEBIT',    800.00, 'Débito parcela empréstimo',                '2026-04-15'),
(28, 'CREDIT',   800.00, 'Pagamento parcela empréstimo',             '2026-01-15'),
(28, 'CREDIT',   800.00, 'Pagamento parcela empréstimo',             '2026-02-15'),
(28, 'CREDIT',   800.00, 'Pagamento parcela empréstimo',             '2026-03-15'),
(28, 'CREDIT',   800.00, 'Pagamento parcela empréstimo',             '2026-04-15'),

-- ── VANESSA FREITAS (acc 29) — CONTA DORMENTE (última jan/2025) ──
(29, 'CREDIT',  1800.00, 'Crédito salário',                         '2025-01-05'),
(29, 'DEBIT',    600.00, 'Compras online',                           '2025-01-20'),
(29, 'DEBIT',    450.00, 'Supermercado',                             '2025-01-28'),

-- ── JULIANA SOUZA (acc 32 corrente, acc 33 poupança) ─────────
(32, 'CREDIT',  5500.00, 'Crédito salário — UFMG',                  '2026-02-05'),
(32, 'CREDIT',  5500.00, 'Crédito salário — UFMG',                  '2026-03-05'),
(32, 'CREDIT',  5500.00, 'Crédito salário — UFMG',                  '2026-04-05'),
(32, 'CREDIT',  2500.00, 'Funds Transfer Received',                  '2026-03-20'),  -- par do Henrique
(32, 'DEBIT',   1900.00, 'Débito financiamento',                     '2026-02-15'),
(32, 'DEBIT',   1900.00, 'Débito financiamento',                     '2026-03-15'),
(32, 'DEBIT',   1900.00, 'Débito financiamento',                     '2026-04-15'),
(33, 'CREDIT',   89.00,  'Rendimento poupança — abril/2026',         '2026-04-30'),

-- ── DIEGO ARAÚJO (acc 34 corrente, acc 35 loan) — RISCO CONCENTRAÇÃO ─
-- Passivo (R$14.000) vs ativo (R$1.550) = 90% comprometimento
(34, 'CREDIT',  3200.00, 'Crédito salário',                         '2026-02-05'),
(34, 'CREDIT',  3200.00, 'Crédito salário',                         '2026-03-05'),
(34, 'CREDIT',  3200.00, 'Crédito salário',                         '2026-04-05'),
(34, 'DEBIT',    900.00, 'Débito parcela empréstimo',                '2026-02-10'),
(34, 'DEBIT',    900.00, 'Débito parcela empréstimo',                '2026-03-10'),
(34, 'DEBIT',    900.00, 'Débito parcela empréstimo',                '2026-04-10'),
(35, 'CREDIT',   900.00, 'Pagamento parcela empréstimo',             '2026-02-10'),
(35, 'CREDIT',   900.00, 'Pagamento parcela empréstimo',             '2026-03-10'),
(35, 'CREDIT',   900.00, 'Pagamento parcela empréstimo',             '2026-04-10'),

-- ── HENRIQUE DIAS (acc 36 corrente, acc 37 poupança) ─────────
(36, 'CREDIT',  5800.00, 'Crédito salário — UFMG',                  '2026-01-05'),
(36, 'CREDIT',  5800.00, 'Crédito salário — UFMG',                  '2026-02-05'),
(36, 'CREDIT',  5800.00, 'Crédito salário — UFMG',                  '2026-03-05'),
(36, 'CREDIT',  5800.00, 'Crédito salário — UFMG',                  '2026-04-05'),
(36, 'DEBIT',   2100.00, 'Débito financiamento',                     '2026-01-15'),
(36, 'DEBIT',   2100.00, 'Débito financiamento',                     '2026-02-15'),
(36, 'DEBIT',   2100.00, 'Débito financiamento',                     '2026-03-15'),
(36, 'DEBIT',   2100.00, 'Débito financiamento',                     '2026-04-15'),
(36, 'DEBIT',   2500.00, 'Funds Transfer Sent',                      '2026-03-20'),  -- → Juliana
(37, 'CREDIT',   185.00, 'Rendimento poupança — abril/2026',         '2026-04-30'),

-- ── LUCAS MARTINS (acc 39) — CONTA DORMENTE (última set/2024) ──
(39, 'CREDIT',  2200.00, 'Crédito salário',                         '2024-09-05'),
(39, 'DEBIT',    700.00, 'Débito aluguel',                           '2024-09-10'),
(39, 'DEBIT',    300.00, 'Supermercado',                             '2024-09-22'),

-- ── THIAGO CASTRO (acc 41 corrente, acc 42 poupança) ─────────
(41, 'CREDIT',  4500.00, 'Crédito salário',                         '2026-02-05'),
(41, 'CREDIT',  4500.00, 'Crédito salário',                         '2026-03-05'),
(41, 'CREDIT',  4500.00, 'Crédito salário',                         '2026-04-05'),
(41, 'DEBIT',   1600.00, 'Débito aluguel',                           '2026-02-10'),
(41, 'DEBIT',   1600.00, 'Débito aluguel',                           '2026-03-10'),
(41, 'DEBIT',   1600.00, 'Débito aluguel',                           '2026-04-10'),
(42, 'CREDIT',   120.00, 'Rendimento poupança — abril/2026',         '2026-04-30'),

-- ── DEMAIS ATIVOS (movimentação recente mínima) ───────────────
(18, 'CREDIT',  5500.00, 'Crédito salário',                         '2026-04-05'),
(18, 'DEBIT',   2000.00, 'Débito aluguel',                           '2026-04-10'),
(19, 'CREDIT',  2200.00, 'Crédito salário',                         '2026-04-05'),
(19, 'DEBIT',    680.00, 'Supermercado',                             '2026-04-18'),
(20, 'CREDIT',  4000.00, 'Crédito salário',                         '2026-04-05'),
(20, 'DEBIT',   1200.00, 'Débito aluguel',                           '2026-04-10'),
(21, 'CREDIT',  3500.00, 'Crédito salário',                         '2026-04-05'),
(21, 'DEBIT',   1100.00, 'Débito aluguel',                           '2026-04-10'),
(31, 'CREDIT',  3000.00, 'Crédito salário',                         '2026-04-05'),
(31, 'DEBIT',    950.00, 'Supermercado',                             '2026-04-18'),
(38, 'CREDIT',   160.00, 'Rendimento poupança — abril/2026',         '2026-04-30'),
(40, 'CREDIT',  3800.00, 'Crédito salário',                         '2026-04-05'),
(40, 'DEBIT',   1300.00, 'Débito aluguel',                           '2026-04-10'),
(43, 'CREDIT',  2600.00, 'Crédito salário',                         '2026-04-05'),
(43, 'DEBIT',    780.00, 'Supermercado',                             '2026-04-18'),

-- ── CLIENTES INATIVOS — histórico antigo ─────────────────────
-- Bruno Santos (acc 44) — inativo com saldo R$4.200 (compliance risk)
(44, 'CREDIT',  5000.00, 'Crédito salário',                         '2023-08-05'),
(44, 'DEBIT',    800.00, 'Supermercado',                             '2023-08-20'),

-- Sônia Nascimento (acc 45) — inativa com saldo R$12.800
(45, 'CREDIT', 15000.00, 'Venda de imóvel — depósito judicial',     '2023-05-15'),
(45, 'DEBIT',   2200.00, 'Despesas diversas',                        '2023-06-01'),

-- Fábio Cavalcanti (acc 46) — inativo saldo R$89.000 (SUSPEITO — COAF)
(46, 'CREDIT', 95000.00, 'Depósito em espécie — origem não declarada','2022-11-30'),
(46, 'DEBIT',   6000.00, 'Saque parcial',                            '2022-12-10'),

-- Rogério Campos (acc 47 + acc 48 loan) — inativo com empréstimo em aberto
(47, 'CREDIT',  3000.00, 'Crédito salário',                         '2023-03-05'),
(47, 'DEBIT',   1000.00, 'Débito parcela empréstimo',                '2023-03-15'),
(48, 'CREDIT',  1000.00, 'Pagamento parcela empréstimo',             '2023-03-15');
-- Empréstimo parou — inativo e inadimplente


-- ════════════════════════════════════════════════════════════
-- AUDIT LOG
-- Gerado automaticamente para todas as transações
-- Simula o rastreamento de operações exigido pelo BACEN
-- ════════════════════════════════════════════════════════════
INSERT INTO audit_log (transaction_id, action, table_name, new_value, performed_by, performed_at)
SELECT
    t.id,
    'INSERT',
    'transaction',
    'account_id=' || t.account_id
        || ' | type='   || t.type
        || ' | amount=' || t.amount
        || ' | desc='   || t.description,
    CASE
        WHEN t.account_id IN (26, 30, 46) THEN 'sistema_alerta_coaf'
        WHEN t.amount >= 10000             THEN 'sistema_alerta_coaf'
        ELSE 'sistema_bancario'
    END,
    t.created_at
FROM transaction t;
