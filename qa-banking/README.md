# QA Banking Project

Projeto de QA estruturado para validar os requisitos da vaga de **Analista de Testes** em ambiente bancário.

**Resultado atual:** 22 cenários passando + 2 bugs documentados — 0 falhas não intencionais.

---

## Arquitetura do Projeto

```
qa-banking/
├── src/
│   ├── main/java/com/banking/qa/
│   │   ├── config/
│   │   │   └── ConfigManager          → URLs, browser, conexão DB
│   │   ├── pages/                     → Page Object Model (POM)
│   │   │   ├── BasePage               → wait, click, type, helpers
│   │   │   ├── LoginPage
│   │   │   ├── RegisterPage
│   │   │   ├── AccountOverviewPage
│   │   │   ├── AccountActivityPage
│   │   │   ├── TransferFundsPage
│   │   │   ├── OpenAccountPage
│   │   │   ├── BillPayPage
│   │   │   └── NavigationBar
│   │   └── utils/
│   │       ├── DriverFactory          → Selenium WebDriver (Chrome/Firefox)
│   │       ├── DatabaseUtils          → JDBC (PostgreSQL / DB2)
│   │       └── TestDataGenerator      → Java Faker para massa de dados
│   └── test/
│       ├── java/com/banking/qa/
│       │   ├── steps/
│       │   │   ├── login/             → LoginSteps
│       │   │   ├── transferencia/     → TransferenciaSteps
│       │   │   ├── extrato/           → ExtratoSteps
│       │   │   ├── database/          → DatabaseSteps
│       │   │   └── e2e/               → E2ESteps (jornada completa)
│       │   ├── runners/
│       │   │   ├── LoginRunner        → mvn test -Dtest=LoginRunner
│       │   │   ├── TransferenciaRunner
│       │   │   ├── ExtratoRunner
│       │   │   ├── BancoDadosRunner
│       │   │   ├── E2ERunner
│       │   │   └── AllTestsRunner     → suite completa
│       │   └── hooks/
│       │       └── Hooks              → screenshot em falha, teardown
│       └── resources/
│           ├── features/
│           │   ├── login/             → login.feature
│           │   ├── transferencia/     → transferencia.feature
│           │   ├── extrato/           → extrato.feature
│           │   ├── banco_de_dados/    → banco_de_dados.feature
│           │   └── e2e/               → jornada_completa.feature
│           └── config.properties
├── database/
│   ├── schema.sql                     → Tabelas: customer, account, transaction, audit_log
│   ├── seed.sql                       → Massa de dados inicial
│   └── queries/
│       └── validacoes_qa.sql          → Queries de validação (SQL/DB2)
├── docs/
│   ├── test-cases/
│   │   ├── CT001-login.md             → 10 casos com técnicas documentadas
│   │   └── CT002-transferencia.md     → 10 casos + validação SQL
│   └── analysis-techniques/
│       └── tecnicas-de-teste.md       → EP, BVA, Tabela de Decisão, Transição de Estado
├── docker-compose.yml                 → PostgreSQL + pgAdmin
├── .github/workflows/ci.yml           → Pipeline CI/CD
└── pom.xml
```

---

## Stack Tecnológica

| Componente     | Tecnologia                    | Justificativa                             |
|----------------|-------------------------------|-------------------------------------------|
| Linguagem      | Java 17                       | Padrão enterprise/bancário no Brasil      |
| Automação UI   | Selenium 4 + WebDriverManager | Amplamente usado em bancos                |
| BDD            | Cucumber 7 + Gherkin (pt-BR)  | Aproxima negócio de TI                    |
| Banco de Dados | PostgreSQL (Docker)           | Simula DB2 — mesma API JDBC               |
| Relatórios     | Allure Reports                | Relatórios visuais profissionais          |
| Build          | Maven 3.9                     | Gerenciamento de dependências             |
| CI/CD          | GitHub Actions                | Execução automática toda manhã útil       |
| Dados de teste | Java Faker                    | Geração de dados realistas                |

---

## Como Executar

### Pré-requisitos
- Java 17+
- Maven 3.8+
- Docker Desktop
- Google Chrome

### 1. Subir o banco de dados
```bash
docker-compose up -d
```
- PostgreSQL: `localhost:5432`
- pgAdmin (interface visual): `http://localhost:5050` — login: `qa@banking.com` / `qa_admin`

### 2. Executar por módulo (recomendado)

```bash
# Apenas login
mvn test -Dtest=LoginRunner

# Apenas transferência
mvn test -Dtest=TransferenciaRunner

# Apenas extrato
mvn test -Dtest=ExtratoRunner

# Apenas banco de dados (SQL/DB2)
mvn test -Dtest=BancoDadosRunner

# Jornada E2E completa (registro → login → conta → transferência → extrato → boleto → logout)
mvn test -Dtest=E2ERunner

# Suite completa
mvn test -Dtest=AllTestsRunner
```

### 3. Headless (sem abrir browser — ideal para CI)
```bash
mvn test -Dheadless=true
```

### 4. Filtrar por tag Cucumber
```bash
# Apenas smoke tests
mvn test -Dcucumber.filter.tags="@smoke"

# Apenas testes de banco de dados
mvn test -Dcucumber.filter.tags="@banco_de_dados"

# Ignorar bugs conhecidos
mvn test -Dcucumber.filter.tags="not @bug"
```

### 5. Gerar relatório Allure
```bash
mvn allure:serve
```

Relatórios por módulo em: `target/reports/{login,transferencia,extrato,banco_de_dados,e2e}/`

---

## Cobertura de Testes

| Runner             | Cenários | Resultado       |
|--------------------|----------|-----------------|
| BancoDadosRunner   | 6        | 6 PASSOU        |
| LoginRunner        | 7        | 7 PASSOU        |
| ExtratoRunner      | 5        | 5 PASSOU        |
| TransferenciaRunner| 5        | 3 passou + 2 @bug |
| E2ERunner          | 1        | 1 PASSOU        |
| **Total**          | **24**   | **22 passou, 2 bugs documentados** |

### Bugs documentados (`@bug`)
| ID       | Descrição                                              | Severidade |
|----------|--------------------------------------------------------|------------|
| BUG-001  | Transferência de valor R$0,00 processada sem erro      | Alta       |
| BUG-002  | Campo valor vazio na transferência não valida antes de submeter | Média |

---

## Jornada E2E — Fluxo Completo

O `E2ERunner` executa a jornada de ponta a ponta em uma única sessão de browser:

```
1. Registro          → Novo usuário com dados gerados pelo Faker
2. Login automático  → Parabank autentica após registro
3. Visão geral       → Confirma contas visíveis no painel
4. Abrir conta       → Cria conta poupança (SAVINGS)
5. Transferência     → R$50,00 entre contas disponíveis
6. Extrato           → Consulta movimentações da conta
7. Pagar boleto      → Bill Pay para beneficiário fictício
8. Logout            → Valida encerramento de sessão
9. Acesso negado     → Confirma que páginas protegidas bloqueiam sem sessão
```

---

## Aplicação Alvo para Treino

### Parabank — https://parabank.parasoft.com

Sistema bancário **público e gratuito** criado pela Parasoft para praticar QA.

**Credenciais de teste:** `john` / `demo`

**Funcionalidades disponíveis:**
- Login / Logout / Registro
- Visão geral de contas
- Transferência entre contas
- Pagamento de boletos (Bill Pay)
- Extrato e histórico de transações
- Abertura de nova conta
- Solicitação de empréstimo

---

## Cobertura dos Requisitos da Vaga

| Requisito da Vaga                       | Implementado em                                          |
|-----------------------------------------|----------------------------------------------------------|
| Testes manuais                          | `docs/test-cases/CT001-login.md`, `CT002-transferencia.md` |
| Elaboração e execução de casos de teste | `docs/test-cases/` + 4 feature files BDD                |
| Técnicas de análise de testes           | `docs/analysis-techniques/tecnicas-de-teste.md`         |
| Experiência em SQL e DB2                | `database/queries/validacoes_qa.sql` + `DatabaseUtils`  |
| Interpretar requisitos de negócio       | Features Gherkin escritas em português                   |
| **Diferencial:** Automação de testes    | Selenium 4 + Cucumber + Page Object Model + CI/CD        |
| **Diferencial:** Ambiente bancário      | Parabank + schema bancário real (account, transaction, audit_log) |

---

## Queries SQL de Validação (DB2/PostgreSQL)

```sql
-- Verificar saldo de uma conta específica
SELECT balance FROM account WHERE id = 1;

-- Últimas transações de um cliente
SELECT t.*, a.type AS tipo_conta
FROM transaction t
JOIN account  a ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE c.username = 'john'
ORDER BY t.created_at DESC
FETCH FIRST 10 ROWS ONLY;   -- DB2
-- LIMIT 10;                -- PostgreSQL

-- Resumo financeiro por tipo de conta
SELECT type, COUNT(*) AS qtd, SUM(balance) AS total
FROM account
GROUP BY type;

-- Verificar integridade: contas sem cliente
SELECT a.id FROM account a
LEFT JOIN customer c ON a.customer_id = c.id
WHERE c.id IS NULL;

-- Auditoria: transações sem log
SELECT t.id, t.description FROM transaction t
LEFT JOIN audit_log al ON al.transaction_id = t.id
WHERE al.id IS NULL;
```

---

## Sites de Treinamento para QA Bancário

| Site | URL | Foco |
|------|-----|------|
| **Parabank** | https://parabank.parasoft.com | Sistema bancário completo para testes |
| **SQLZoo** | https://sqlzoo.net | SQL interativo — compatível com DB2 |
| **W3Schools SQL** | https://w3schools.com/sql | SQL padrão ANSI |
| **Test Automation University** | https://testautomationu.applitools.com | Selenium, Cucumber, API (gratuito) |
| **ISTQB / BSTQB** | https://bstqb.org.br | Certificação CTFL — padrão bancário |
