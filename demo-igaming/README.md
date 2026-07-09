# iGaming QA Demo — Servidor Local

Ambiente de mock para automação de testes do portfólio QA iGaming.  
Substitui dependência de sites externos (anti-bot, instabilidade) com um servidor Express totalmente controlável.

---

## Pré-requisitos

- Node.js 18+
- (Opcional) Docker

---

## Executar localmente

```bash
cd demo-igaming
npm install
node server.js
```

Servidor disponível em: **http://localhost:3000**

---

## Credenciais de teste

| Usuário     | Senha           | Papel  |
|-------------|-----------------|--------|
| player01    | Senha@123       | player |
| admin_qa    | Admin@Seguro1   | admin  |

---

## Endpoints principais

| Método | Rota                              | Autenticação | Descrição                     |
|--------|-----------------------------------|--------------|-------------------------------|
| POST   | /api/auth/login                   | –            | Login, retorna JWT             |
| GET    | /api/wallet/balance               | opcional     | Saldo do tenant               |
| POST   | /api/wallet/deposit               | opcional     | Realizar depósito             |
| POST   | /api/wallet/withdrawal            | opcional     | Realizar saque                |
| GET    | /api/sportsbook/events            | opcional     | Lista de eventos OPEN         |
| GET    | /api/sportsbook/events/:id        | opcional     | Evento por ID                 |
| POST   | /api/sportsbook/bets              | opcional     | Registrar aposta              |
| DELETE | /api/sportsbook/bets/:betId       | opcional     | Cancelar aposta               |
| GET    | /api/transactions                 | opcional     | Histórico com filtros e paginação |
| GET    | /api/transactions/export          | opcional     | Exportar CSV                  |
| GET    | /api/admin/tenants                | admin        | Listar tenants                |
| POST   | /api/admin/tenants/switch         | admin        | Trocar tenant ativo           |

### Multi-tenant

Todas as rotas de wallet e transações aceitam o header `X-Tenant-Id: operadora-a` (default) ou `X-Tenant-Id: operadora-b`.

### Autenticação

```
Authorization: Bearer <token_base64>
```

O token é um JSON base64 com `{ username, role, exp }`. Sem dependência de JWT externo.

---

## Executar via Docker (opcional)

```bash
# Build
docker build -t igaming-qa-demo .

# Run
docker run -p 3000:3000 igaming-qa-demo
```

---

## Rodar os testes Cypress

```bash
# Com o servidor rodando em http://localhost:3000
cd ../qa-banking
npx cypress run --spec "cypress/e2e/igaming/**/*.cy.js"

# Modo interativo
npx cypress open
```

Resultado esperado: **41/42 passando**.  
O único teste com falha conhecida (CT-W09) é um **design issue documentado**: os testes CT-W05 e CT-W09 compartilham o mesmo fixture `acimaDiario=50000` esperando mensagens de erro diferentes, o que é estruturalmente impossível de satisfazer simultaneamente.

---

## Rodar o Robot Framework

```bash
cd ../qa-banking
robot --outputdir robot/results robot/tests/igaming/
```

---

## Estado em memória

O servidor usa estado em memória (sem banco de dados). Ao reiniciar, os saldos e apostas são resetados:

| Carteira                      | Saldo inicial |
|-------------------------------|---------------|
| player01 — operadora-a        | R$ 1.000,00   |
| player01 — operadora-b        | R$ 500,00     |

Cada tenant tem 25 transações seed para suportar testes de paginação.

---

## Estrutura de páginas

| Rota                    | Arquivo                  |
|-------------------------|--------------------------|
| /login                  | public/login.html        |
| /account/wallet         | public/wallet.html       |
| /account/transactions   | public/transactions.html |
| /sportsbook             | public/sportsbook.html   |
| /admin/tenants          | public/admin-tenants.html|
