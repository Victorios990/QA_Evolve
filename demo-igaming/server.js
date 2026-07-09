const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = 3000;

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

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Demo iGaming → http://localhost:${PORT}\n`);
  console.log('  player01 / Senha@123');
  console.log('  admin_qa / Admin@Seguro1\n');
});
