const express    = require('express');
const path       = require('path');
const { Pool }   = require('pg');
const app        = express();
const PORT       = 3000;

// ── Pool PostgreSQL ───────────────────────────────────────────────────────────

const pool = new Pool({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB       || 'banking_db',
  user:     process.env.PG_USER     || 'qa_user',
  password: process.env.PG_PASSWORD || 'qa_password',
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Token (base64 simples, sem dependência externa) ───────────────────────────

const createToken = (username, role) =>
  Buffer.from(JSON.stringify({ username, role, exp: Date.now() + 86_400_000 })).toString('base64');

const decodeToken = (token) => {
  try { return JSON.parse(Buffer.from(token, 'base64').toString()); }
  catch { return null; }
};

// ── Estado em memória ─────────────────────────────────────────────────────────

const DAILY_LIMIT = 10_000;
const MIN_BET     = 1.00;
const MAX_BET     = 10_000.00;

const users = {
  player01: { password: 'Senha@123',    role: 'player' },
  admin_qa: { password: 'Admin@Seguro1', role: 'admin'  },
};

const wallets = {
  'player01:operadora-a': { balance: 1000.00, currency: 'BRL' },
  'player01:operadora-b': { balance:  500.00, currency: 'BRL' },
};

const events = [
  { id: 'evt-001', name: 'Flamengo x Palmeiras',    sport: 'Futebol',  odds: 2.50, status: 'OPEN',   starts_at: '2026-07-15T20:00:00Z' },
  { id: 'evt-002', name: 'Real Madrid x Barcelona', sport: 'Futebol',  odds: 1.80, status: 'OPEN',   starts_at: '2026-07-16T18:00:00Z' },
  { id: 'evt-003', name: 'Manchester City x PSG',   sport: 'Futebol',  odds: 2.10, status: 'OPEN',   starts_at: '2026-07-17T20:00:00Z' },
  { id: 'evt-004', name: 'Brasil x Argentina',      sport: 'Futebol',  odds: 2.20, status: 'OPEN',   starts_at: '2026-07-18T21:00:00Z' },
  { id: 'evt-005', name: 'NBA Finals G7',           sport: 'Basquete', odds: 1.95, status: 'OPEN',   starts_at: '2026-07-20T23:00:00Z' },
  { id: 'evt-999', name: 'EVENTO_ENCERRADO_QA',     sport: 'Futebol',  odds: 1.50, status: 'CLOSED', starts_at: '2026-06-01T20:00:00Z' },
];

const bets = [];

// 25 transações seed por tenant (suporta paginação no HT-10)
const buildSeed = (tenantId) => {
  const types = ['Depósito', 'Saque', 'Aposta'];
  const rows  = [];
  for (let i = 1; i <= 25; i++) {
    const day = String(i).padStart(2, '0');
    rows.push({
      id:       `seed-${tenantId}-${i}`,
      type:     types[i % 3],
      amount:   50 + i * 10,
      date:     `2026-06-${day}T10:00:00Z`,
      status:   'Concluído',
      username: 'player01',
    });
  }
  return rows.reverse(); // mais recente primeiro
};

const transactions = {
  'operadora-a': buildSeed('operadora-a'),
  'operadora-b': buildSeed('operadora-b'),
};

const tenants = {
  'operadora-a': { name: 'Operadora A', userCount: 42, totalBalance: 52000.00 },
  'operadora-b': { name: 'Operadora B', userCount: 18, totalBalance: 25000.00 },
};

// ── Middlewares ───────────────────────────────────────────────────────────────

// Auth obrigatório (para endpoints admin)
const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user  = decodeToken(token);
  if (!user || Date.now() > user.exp)
    return res.status(401).json({ error: 'Token inválido ou ausente' });
  req.user = user;
  next();
};

// Auth opcional — se não houver token, assume player01 (permite cy.request sem header)
const optionalAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user  = decodeToken(token);
  req.user = (user && Date.now() <= user.exp) ? user : { username: 'player01', role: 'player' };
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acesso negado' });
  next();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getWallet = (username, tenantId) => {
  const key = `${username}:${tenantId}`;
  if (!wallets[key]) wallets[key] = { balance: 0, currency: 'BRL' };
  return wallets[key];
};

// Aceita DD/MM/YYYY ou YYYY-MM-DD
const parseDate = (str) => {
  if (!str) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  }
  return new Date(str);
};

// ── Páginas ───────────────────────────────────────────────────────────────────

const pages = {
  '/login':               'login.html',
  '/account/wallet':      'wallet.html',
  '/account/transactions':'transactions.html',
  '/sportsbook':          'sportsbook.html',
  '/admin/tenants':       'admin-tenants.html',
  '/spinwheel':           'spinwheel.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (_, res) => res.sendFile(path.join(__dirname, 'public', file)));
});

app.get('/', (_, res) => res.redirect('/login'));

// ── API: Auth ─────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password)
    return res.status(401).json({ error: 'Credenciais inválidas' });
  res.json({ access_token: createToken(username, user.role), role: user.role });
});

// ── API: Wallet ───────────────────────────────────────────────────────────────

app.get('/api/wallet/balance', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  res.json(getWallet(req.user.username, tenantId));
});

app.post('/api/wallet/deposit', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const amount   = parseFloat(req.body.amount);

  if (!amount || amount <= 0)
    return res.status(400).json({ error: 'Valor inválido informado' });

  if (amount > DAILY_LIMIT)
    return res.status(400).json({ error: 'Limite diário de depósito excedido' });

  const wallet = getWallet(req.user.username, tenantId);
  wallet.balance = +(wallet.balance + amount).toFixed(2);

  if (!transactions[tenantId]) transactions[tenantId] = [];
  transactions[tenantId].unshift({
    id:       `dep-${Date.now()}`,
    type:     'Depósito',
    amount,
    date:     new Date().toISOString(),
    status:   'Concluído',
    username: req.user.username,
  });

  // Latência mínima simulada: garante que o botão fique enabled durante testes de idempotência (CT-W10)
  const payload = { message: 'Depósito realizado com sucesso', balance: wallet.balance };
  setTimeout(() => res.status(201).json(payload), 150);
});

app.post('/api/wallet/withdrawal', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const amount   = parseFloat(req.body.amount);

  if (!amount || amount <= 0)
    return res.status(400).json({ error: 'Valor inválido informado' });

  const wallet = getWallet(req.user.username, tenantId);

  // Valida saldo antes do limite: CT-W05 testa saldo insuficiente com valor acima do limite diário
  if (wallet.balance < amount)
    return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });

  if (amount > DAILY_LIMIT)
    return res.status(400).json({ error: 'Limite diário de saque excedido' });

  wallet.balance = +(wallet.balance - amount).toFixed(2);

  if (!transactions[tenantId]) transactions[tenantId] = [];
  transactions[tenantId].unshift({
    id:       `saq-${Date.now()}`,
    type:     'Saque',
    amount,
    date:     new Date().toISOString(),
    status:   'Concluído',
    username: req.user.username,
  });

  res.json({ message: 'Saque realizado com sucesso', balance: wallet.balance });
});

// ── API: Sportsbook ───────────────────────────────────────────────────────────

app.get('/api/sportsbook/events', optionalAuth, (req, res) => {
  const q        = (req.query.q || '').toLowerCase();
  const filtered = q ? events.filter(e => e.name.toLowerCase().includes(q)) : events;
  res.json({ events: filtered });
});

app.get('/api/sportsbook/events/:id', optionalAuth, (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Evento não encontrado' });
  res.json({ ...event, odds_changed: false });
});

app.get('/api/sportsbook/bets', optionalAuth, (req, res) => {
  const userBets = bets.filter(b => b.username === req.user.username && b.status === 'OPEN');
  res.json({ bets: userBets });
});

app.post('/api/sportsbook/bets', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const amount   = parseFloat(req.body.amount);
  const { event_id } = req.body;

  if (amount < MIN_BET)
    return res.status(400).json({ error: 'Valor abaixo do mínimo permitido para apostas' });
  if (amount > MAX_BET)
    return res.status(400).json({ error: 'Valor acima do máximo permitido para apostas' });

  const wallet = getWallet(req.user.username, tenantId);
  if (wallet.balance < amount)
    return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });

  wallet.balance = +(wallet.balance - amount).toFixed(2);

  const bet = {
    bet_id:     `BET-${Date.now()}`,
    event_id,
    amount,
    status:     'OPEN',
    created_at: new Date().toISOString(),
    username:   req.user.username,
    tenantId,
  };
  bets.push(bet);

  if (!transactions[tenantId]) transactions[tenantId] = [];
  transactions[tenantId].unshift({
    id:       `bet-${Date.now()}`,
    type:     'Aposta',
    amount,
    date:     new Date().toISOString(),
    status:   'Aberta',
    username: req.user.username,
  });

  res.status(201).json(bet);
});

app.delete('/api/sportsbook/bets/:betId', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const bet = bets.find(b => b.bet_id === req.params.betId && b.username === req.user.username);

  if (!bet)               return res.status(404).json({ error: 'Aposta não encontrada' });
  if (bet.status !== 'OPEN') return res.status(400).json({ error: 'Aposta não pode ser cancelada' });

  bet.status = 'CANCELLED';
  const wallet = getWallet(req.user.username, tenantId);
  wallet.balance = +(wallet.balance + bet.amount).toFixed(2);

  res.json({ message: 'Aposta cancelada com sucesso', bet_id: bet.bet_id });
});

// ── API: Transactions ─────────────────────────────────────────────────────────

app.get('/api/transactions/export', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const txs      = (transactions[tenantId] || []).filter(t => t.username === req.user.username);
  const header   = 'id,type,amount,date,status';
  const rows     = txs.map(t => `${t.id},${t.type},${t.amount},${t.date},${t.status}`).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.status(200).send(`${header}\n${rows}`);
});

app.get('/api/transactions', optionalAuth, (req, res) => {
  const tenantId                                         = req.headers['x-tenant-id'] || 'operadora-a';
  const { type, date_from, date_to, amount_min, amount_max } = req.query;
  const page  = parseInt(req.query.page  || '1');
  const limit = parseInt(req.query.limit || '10');

  let txs = (transactions[tenantId] || []).filter(t => t.username === req.user.username);

  if (type)       txs = txs.filter(t => t.type === type);
  if (date_from)  txs = txs.filter(t => new Date(t.date) >= parseDate(date_from));
  if (date_to)    txs = txs.filter(t => new Date(t.date) <= parseDate(date_to));
  if (amount_min) txs = txs.filter(t => t.amount >= parseFloat(amount_min));
  if (amount_max) txs = txs.filter(t => t.amount <= parseFloat(amount_max));

  const total = txs.length;
  const paged = txs.slice((page - 1) * limit, page * limit);

  res.json({ transactions: paged, total, page });
});

// ── API: Admin / Multi-tenant ─────────────────────────────────────────────────

app.get('/api/admin/tenants', auth, adminOnly, (req, res) => {
  res.json({ tenants: Object.entries(tenants).map(([id, t]) => ({ id, ...t })) });
});

app.post('/api/admin/tenants/switch', auth, adminOnly, (req, res) => {
  const { tenant_id } = req.body;
  if (!tenants[tenant_id])
    return res.status(403).json({ error: 'Você não tem permissão para acessar este tenant' });
  res.json({ message: 'Tenant alternado com sucesso', tenant: tenants[tenant_id] });
});

app.get('/api/admin/tenants/:tenantId/data', auth, (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acesso negado' });
  const tenant = tenants[req.params.tenantId];
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });
  res.json({ id: req.params.tenantId, ...tenant });
});

// ── API: SpinWheel ────────────────────────────────────────────────────────────

// GET /api/spinwheel/prizes — sem auth
app.get('/api/spinwheel/prizes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, type, value, product_name, product_sku, weight, color, icon,
             ROUND(weight::numeric / 10, 1) AS probability_pct
      FROM sw_prizes
      WHERE active = TRUE
      ORDER BY weight DESC
    `);
    res.json({
      prizes: result.rows.map((p) => ({
        ...p,
        value:           parseFloat(p.value),
        weight:          parseInt(p.weight),
        probability_pct: parseFloat(p.probability_pct),
      })),
    });
  } catch (err) {
    console.error('[SpinWheel] GET /prizes:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/spinwheel/tickets — optionalAuth
app.get('/api/spinwheel/tickets', optionalAuth, async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  try {
    const result = await pool.query(
      'SELECT username, tenant_id, balance, updated_at FROM sw_tickets WHERE username=$1 AND tenant_id=$2',
      [username, tenantId]
    );
    if (result.rows.length === 0) {
      return res.json({ username, tenant_id: tenantId, balance: 0, updated_at: null });
    }
    const row = result.rows[0];
    res.json({ ...row, balance: parseInt(row.balance) });
  } catch (err) {
    console.error('[SpinWheel] GET /tickets:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/spinwheel/goals — optionalAuth
app.get('/api/spinwheel/goals', optionalAuth, async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  try {
    const result = await pool.query(`
      WITH week AS (SELECT date_trunc('week', CURRENT_DATE)::DATE AS w)
      SELECT g.id, g.code, g.name, g.description, g.goal_type, g.target_value,
             g.tickets_reward, g.icon,
             COALESCE(ug.current_value, 0)        AS current_value,
             COALESCE(ug.completed, FALSE)         AS completed,
             ug.completed_at,
             COALESCE(ug.tickets_granted, FALSE)   AS tickets_granted,
             ROUND(LEAST(COALESCE(ug.current_value,0) / g.target_value * 100, 100), 1) AS progress_pct
      FROM sw_goals g
      LEFT JOIN sw_user_goals ug
        ON ug.goal_id = g.id AND ug.username = $1 AND ug.tenant_id = $2
        AND ug.week_start = (SELECT w FROM week)
      WHERE g.active = TRUE
      ORDER BY g.id
    `, [username, tenantId]);

    // Calcular week_start para retornar no response
    const weekResult = await pool.query(`SELECT date_trunc('week', CURRENT_DATE)::DATE AS w`);
    const weekStart  = weekResult.rows[0].w;
    const formatted  = weekStart instanceof Date
      ? weekStart.toISOString().slice(0, 10)
      : String(weekStart).slice(0, 10);

    res.json({
      goals: result.rows.map((g) => ({
        ...g,
        target_value:   parseFloat(g.target_value),
        current_value:  parseFloat(g.current_value),
        progress_pct:   parseFloat(g.progress_pct),
        tickets_reward: parseInt(g.tickets_reward),
      })),
      week_start: formatted,
    });
  } catch (err) {
    console.error('[SpinWheel] GET /goals:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/spinwheel/spin — optionalAuth
app.post('/api/spinwheel/spin', optionalAuth, async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar e bloquear saldo de tickets
    const ticketRes = await client.query(
      'SELECT balance FROM sw_tickets WHERE username=$1 AND tenant_id=$2 FOR UPDATE',
      [username, tenantId]
    );
    const balance = ticketRes.rows.length > 0 ? ticketRes.rows[0].balance : 0;

    // 2. Verificar saldo suficiente
    if (balance < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sem tickets disponíveis para girar a roleta' });
    }

    // 3. Buscar prêmios ativos com pesos e sortear
    const prizesRes = await client.query(
      'SELECT id, name, type, value, product_name, product_sku, weight, color, icon FROM sw_prizes WHERE active = TRUE ORDER BY id'
    );
    const prizes = prizesRes.rows;
    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    const rand_value  = Math.random();
    let rand  = rand_value * totalWeight;
    let prize = prizes[prizes.length - 1];
    for (const p of prizes) { rand -= p.weight; if (rand <= 0) { prize = p; break; } }

    // 4. Decrementar ticket
    await client.query(
      'UPDATE sw_tickets SET balance = balance - 1, updated_at = NOW() WHERE username=$1 AND tenant_id=$2',
      [username, tenantId]
    );

    // 5. Se prize.type === 'ticket', incrementar balance de volta
    if (prize.type === 'ticket') {
      await client.query(
        'UPDATE sw_tickets SET balance = balance + $1 WHERE username=$2 AND tenant_id=$3',
        [parseInt(prize.value), username, tenantId]
      );
    }

    // 6. Inserir registro em sw_spins
    const nonce        = Date.now();
    const seed_hash    = Buffer.from(`${username}:${nonce}:${rand_value}`).toString('base64');
    const spinInsert   = await client.query(
      `INSERT INTO sw_spins (username, tenant_id, prize_id, prize_name, prize_type, prize_value, seed_hash, nonce, spun_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [username, tenantId, prize.id, prize.name, prize.type, prize.value, seed_hash, nonce]
    );
    const spin_id = spinInsert.rows[0].id;

    // Buscar saldo atualizado
    const balanceRes = await client.query(
      'SELECT balance FROM sw_tickets WHERE username=$1 AND tenant_id=$2',
      [username, tenantId]
    );
    const ticket_balance = balanceRes.rows.length > 0 ? balanceRes.rows[0].balance : 0;

    await client.query('COMMIT');

    res.json({
      spin_id,
      prize: {
        id:           prize.id,
        name:         prize.name,
        type:         prize.type,
        value:        parseFloat(prize.value),
        product_name: prize.product_name,
        product_sku:  prize.product_sku,
        icon:         prize.icon,
        color:        prize.color,
      },
      ticket_balance: parseInt(ticket_balance),
      seed_hash,
      nonce,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SpinWheel] POST /spin:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    client.release();
  }
});

// GET /api/spinwheel/history — optionalAuth
app.get('/api/spinwheel/history', optionalAuth, async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  const page  = parseInt(req.query.page  || '1');
  const limit = parseInt(req.query.limit || '10');
  const offset = (page - 1) * limit;
  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(`
        SELECT s.id, s.prize_name, s.prize_type, s.prize_value, s.spun_at, s.redeemed, s.redeemed_at,
               p.icon, p.color
        FROM sw_spins s
        JOIN sw_prizes p ON p.id = s.prize_id
        WHERE s.username = $1 AND s.tenant_id = $2
        ORDER BY s.spun_at DESC
        LIMIT $3 OFFSET $4
      `, [username, tenantId, limit, offset]),
      pool.query(
        'SELECT COUNT(*) AS total FROM sw_spins WHERE username=$1 AND tenant_id=$2',
        [username, tenantId]
      ),
    ]);
    res.json({
      spins: dataRes.rows.map((s) => ({
        ...s,
        prize_value: s.prize_value != null ? parseFloat(s.prize_value) : null,
      })),
      total: parseInt(countRes.rows[0].total),
      page,
    });
  } catch (err) {
    console.error('[SpinWheel] GET /history:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/spinwheel/history/:spinId/redeem — optionalAuth
app.post('/api/spinwheel/history/:spinId/redeem', optionalAuth, async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  const spinId = parseInt(req.params.spinId);
  try {
    const spinRes = await pool.query(
      'SELECT id, username, prize_name, redeemed FROM sw_spins WHERE id=$1 AND tenant_id=$2',
      [spinId, tenantId]
    );
    // 1. Verificar existência e ownership
    if (spinRes.rows.length === 0 || spinRes.rows[0].username !== username) {
      return res.status(404).json({ error: 'Giro não encontrado' });
    }
    const spin = spinRes.rows[0];
    // 2. Verificar se já foi resgatado
    if (spin.redeemed) {
      return res.status(400).json({ error: 'Este prêmio já foi resgatado' });
    }
    // 3. Marcar como resgatado
    await pool.query(
      'UPDATE sw_spins SET redeemed = TRUE, redeemed_at = NOW() WHERE id=$1',
      [spinId]
    );
    res.json({
      message:    'Prêmio resgatado com sucesso!',
      spin_id:    spinId,
      prize_name: spin.prize_name,
    });
  } catch (err) {
    console.error('[SpinWheel] POST /history/:spinId/redeem:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/spinwheel/goals/:goalCode/progress — auth + adminOnly
app.post('/api/spinwheel/goals/:goalCode/progress', auth, adminOnly, async (req, res) => {
  const { goalCode } = req.params;
  const { username, increment, tenant_id } = req.body;
  const tenantId = tenant_id || 'operadora-a';
  const client = await pool.connect();
  try {
    // 1. Buscar goal por code
    const goalRes = await client.query(
      'SELECT id, code, name, target_value, tickets_reward FROM sw_goals WHERE code=$1 AND active=TRUE',
      [goalCode]
    );
    if (goalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    const goal = goalRes.rows[0];

    await client.query('BEGIN');

    // 2. Calcular week_start
    const weekRes  = await client.query(`SELECT date_trunc('week', CURRENT_DATE)::DATE AS w`);
    const weekStart = weekRes.rows[0].w;

    // Upsert em sw_user_goals
    const upsertRes = await client.query(`
      INSERT INTO sw_user_goals (goal_id, username, tenant_id, week_start, current_value, completed, tickets_granted)
      VALUES ($1, $2, $3, $4, $5, FALSE, FALSE)
      ON CONFLICT (goal_id, username, tenant_id, week_start)
      DO UPDATE SET current_value = sw_user_goals.current_value + $5
      RETURNING current_value, completed, tickets_granted
    `, [goal.id, username, tenantId, weekStart, increment]);

    let { current_value, completed, tickets_granted } = upsertRes.rows[0];
    let tickets_granted_now = false;

    // 3. Se atingiu a meta e ainda não concedeu tickets
    if (current_value >= goal.target_value && !tickets_granted) {
      completed           = true;
      tickets_granted     = true;
      tickets_granted_now = true;

      await client.query(`
        UPDATE sw_user_goals
        SET completed = TRUE, completed_at = NOW(), tickets_granted = TRUE
        WHERE goal_id=$1 AND username=$2 AND tenant_id=$3 AND week_start=$4
      `, [goal.id, username, tenantId, weekStart]);

      // Garantir linha em sw_tickets antes de incrementar
      await client.query(`
        INSERT INTO sw_tickets (username, tenant_id, balance, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (username, tenant_id)
        DO UPDATE SET balance = sw_tickets.balance + $3, updated_at = NOW()
      `, [username, tenantId, goal.tickets_reward]);
    }

    await client.query('COMMIT');

    res.json({
      goal_code:          goalCode,
      username,
      current_value:      parseFloat(current_value),
      target_value:       parseFloat(goal.target_value),
      completed,
      tickets_granted,
      tickets_granted_now,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SpinWheel] POST /goals/:goalCode/progress:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  } finally {
    client.release();
  }
});

// ── API: RNG / Slot Games ─────────────────────────────────────────────────────

const RNG_GAMES = [
  { id: 'slot_classic', name: 'Classic Slots',   rtp: 96.5, min_bet: 1.00,  max_bet: 500.00,  win_prob: 0.965 },
  { id: 'blackjack',   name: 'Blackjack Básico', rtp: 99.5, min_bet: 5.00,  max_bet: 5000.00, win_prob: 0.995 },
  { id: 'roulette',    name: 'Roleta Europeia',   rtp: 97.3, min_bet: 0.50,  max_bet: 1000.00, win_prob: 0.973 },
];

app.get('/api/rtp/config', (req, res) => {
  res.json({
    games: RNG_GAMES.map(({ id, name, rtp, min_bet, max_bet }) => ({ id, name, rtp, min_bet, max_bet })),
    jackpot_trigger_probability: 0.001,
    global_max_win_multiplier: 1000,
  });
});

app.post('/api/rng/spin', optionalAuth, (req, res) => {
  const tenantId = req.headers['x-tenant-id'] || 'operadora-a';
  const { username } = req.user;
  const { game_id } = req.body;
  const bet = parseFloat(req.body.bet);

  const game = RNG_GAMES.find((g) => g.id === game_id);
  if (!game)
    return res.status(404).json({ error: `Jogo '${game_id}' não encontrado` });

  if (!bet || bet < game.min_bet)
    return res.status(400).json({ error: `Aposta mínima é R$${game.min_bet.toFixed(2)}` });

  if (bet > game.max_bet)
    return res.status(400).json({ error: `Aposta máxima é R$${game.max_bet.toFixed(2)}` });

  const wallet = getWallet(username, tenantId);
  if (wallet.balance < bet)
    return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });

  const randValue = Math.random();
  const isWin     = randValue < game.win_prob;
  const multiplier = isWin ? 1 : 0;
  const payout     = +(bet * multiplier).toFixed(2);

  wallet.balance = +(wallet.balance - bet + payout).toFixed(2);

  const nonce     = Date.now();
  const seed_hash = Buffer.from(`${username}:${nonce}:${randValue}`).toString('base64');

  if (!transactions[tenantId]) transactions[tenantId] = [];
  transactions[tenantId].unshift({
    id:       `rng-${nonce}`,
    type:     'Aposta',
    amount:   bet,
    date:     new Date().toISOString(),
    status:   'Concluído',
    username,
  });

  res.json({
    result:      isWin ? 'win' : 'loss',
    payout,
    multiplier,
    new_balance: wallet.balance,
    seed_hash,
    nonce,
    game_id,
  });
});

// ── Test-only reset (não disponível em produção) ──────────────────────────────

app.post('/api/_test/spinwheel-reset', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Repõe saldo de tickets com margem para todos os testes (spinwheel + motor)
    await client.query(`
      INSERT INTO sw_tickets (username, tenant_id, balance, updated_at)
      VALUES
        ('player01', 'operadora-a', 300, NOW()),
        ('player01', 'operadora-b', 1,   NOW()),
        ('admin_qa', 'operadora-a', 5,   NOW())
      ON CONFLICT (username, tenant_id)
      DO UPDATE SET balance = EXCLUDED.balance, updated_at = NOW()
    `);

    // Limpa progresso semanal de player01 para a semana corrente e recria com seed
    const weekRes  = await client.query(`SELECT date_trunc('week', CURRENT_DATE)::DATE AS w`);
    const weekStart = weekRes.rows[0].w;

    await client.query(
      `DELETE FROM sw_user_goals WHERE username = 'player01' AND tenant_id = 'operadora-a' AND week_start = $1`,
      [weekStart]
    );

    await client.query(`
      INSERT INTO sw_user_goals (username, tenant_id, goal_id, week_start, current_value, completed, tickets_granted)
      SELECT 'player01', 'operadora-a', g.id, $1,
        CASE g.code
          WHEN 'WEEKLY_BETS_5'      THEN 3
          WHEN 'WEEKLY_DEPOSIT_500' THEN 350
          WHEN 'WEEKLY_SPORTS_3'    THEN 2
          WHEN 'WEEKLY_LOGIN_7'     THEN 4
          WHEN 'WEEKLY_REFERRAL'    THEN 0
          ELSE 0
        END,
        FALSE, FALSE
      FROM sw_goals g
      WHERE g.active = TRUE
    `, [weekStart]);

    await client.query('COMMIT');

    // Reseta também as carteiras em memória para o estado inicial
    wallets['player01:operadora-a'] = { balance: 1000.00, currency: 'BRL' };
    wallets['player01:operadora-b'] = { balance:  500.00, currency: 'BRL' };

    res.json({ ok: true, tickets: 300, week_start: weekStart, wallet_reset: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SpinWheel] POST /_test/spinwheel-reset:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Demo iGaming → http://localhost:${PORT}\n`);
  console.log('  player01 / Senha@123');
  console.log('  admin_qa / Admin@Seguro1\n');
});
