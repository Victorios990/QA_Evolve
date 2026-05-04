# Plano de Testes — BDD, Exploratório e Banco de Dados
**Sistema:** Parabank / Ambiente Bancário Sicoob  
**Analista:** Victor Almeida  
**Data:** 30/04/2026  
**Versão:** 1.0

> **Escopo deste documento:**  
> Cobre funcionalidades **não contempladas** nos feature files automatizados existentes  
> (login.feature, transferencia.feature, extrato.feature, banco_de_dados.feature).  
> Foco: Registro, Abertura de Conta, Bill Pay, Empréstimo, Segurança, Exploratório e SQL avançado.

---

## Sumário

1. [Cenários BDD — Registro de Usuário](#1-cenários-bdd--registro-de-usuário)
2. [Cenários BDD — Abertura de Conta](#2-cenários-bdd--abertura-de-conta)
3. [Cenários BDD — Pagamento de Boleto](#3-cenários-bdd--pagamento-de-boleto)
4. [Cenários BDD — Solicitação de Empréstimo](#4-cenários-bdd--solicitação-de-empréstimo)
5. [Cenários BDD — Segurança e Sessão](#5-cenários-bdd--segurança-e-sessão)
6. [Testes Exploratórios](#6-testes-exploratórios)
7. [Cenários de Banco de Dados](#7-cenários-de-banco-de-dados)
8. [Matriz de Cobertura](#8-matriz-de-cobertura)

---

## 1. Cenários BDD — Registro de Usuário

**Funcionalidade:** Cadastro de novo correntista no internet banking  
**Técnicas aplicadas:** Partição de Equivalência, Análise de Valor Limite, Tabela de Decisão

```gherkin
# language: pt
@registro @regressao
Funcionalidade: Registro de Novo Usuário
  Como um novo cliente do banco
  Quero me cadastrar no internet banking
  Para ter acesso aos serviços financeiros online

  @positivo @smoke
  Cenário: Registro com todos os dados válidos
    Dado que o usuário acessa a página de registro
    Quando preenche o primeiro nome "João"
    E preenche o sobrenome "Silva"
    E preenche o endereço "SQN 302 Bloco A"
    E preenche a cidade "Brasília"
    E preenche o estado "DF"
    E preenche o CEP "70736-520"
    E preenche o telefone "61-99999-0001"
    E preenche o SSN "123-45-6789"
    E preenche o usuário "novouser2026"
    E preenche a senha "Senha@123"
    E confirma a senha "Senha@123"
    E clica em "Register"
    Então o registro deve ser concluído com sucesso
    E o usuário deve ser autenticado automaticamente
    E deve ser redirecionado para o painel de contas

  @negativo
  Cenário: Registro com nome de usuário já existente
    Dado que o usuário acessa a página de registro
    Quando preenche todos os campos com dados válidos
    E informa o usuário "john"
    E clica em "Register"
    Então o sistema deve exibir a mensagem "This username already exists."

  @negativo
  Cenário: Registro com senhas que não conferem
    Dado que o usuário acessa a página de registro
    Quando preenche todos os campos com dados válidos
    E informa a senha "Senha@123"
    E confirma a senha "SenhaDiferente"
    E clica em "Register"
    Então o sistema deve exibir mensagem de erro de validação de senha

  @negativo
  Cenário: Registro com campo obrigatório em branco
    Dado que o usuário acessa a página de registro
    Quando preenche todos os campos exceto o primeiro nome
    E clica em "Register"
    Então o sistema deve exibir a mensagem "First name is required."

  @esquema @negativo
  Esquema do Cenário: Registro com campos obrigatórios ausentes
    Dado que o usuário acessa a página de registro
    Quando preenche todos os campos exceto "<campo>"
    E clica em "Register"
    Então o sistema deve exibir a mensagem "<mensagem_esperada>"

    Exemplos:
      | campo       | mensagem_esperada              |
      | First Name  | First name is required.        |
      | Last Name   | Last name is required.         |
      | Address     | Address is required.           |
      | City        | City is required.              |
      | State       | State is required.             |
      | Zip Code    | Zip Code is required.          |
      | SSN         | Social Security Number is required. |
      | Username    | Username is required.          |
      | Password    | Password is required.          |

  @positivo
  Cenário: Registro gera conta corrente automaticamente
    Dado que o usuário acessa a página de registro
    Quando preenche o formulário com dados válidos únicos
    E clica em "Register"
    Então o registro deve ser concluído com sucesso
    E o painel deve exibir pelo menos uma conta do tipo "CHECKING"
```

### Casos de Teste Manuais — Registro

| ID | Caso de Teste | Entrada | Resultado Esperado | Técnica |
|---|---|---|---|---|
| CT-R01 | Nome com 1 caractere | First Name = "A" | Aceito (limite inferior) | VLA |
| CT-R02 | Nome com 50 caracteres | First Name = "A" × 50 | Aceito (limite superior) | VLA |
| CT-R03 | Nome com 51 caracteres | First Name = "A" × 51 | Rejeitado ou truncado | VLA |
| CT-R04 | Nome com caracteres especiais | First Name = "João" | Aceito (suporte a acentos) | EP |
| CT-R05 | SSN com formato inválido | SSN = "abc-de-fghi" | Mensagem de erro | EP |
| CT-R06 | E-mail já cadastrado via SSN | SSN duplicado | Rejeitar ou alertar | RN |
| CT-R07 | Senha só com letras | Password = "somenteletras" | Aceito ou rejeitado (validar política) | EP |
| CT-R08 | Usuário com espaços | Username = "nome usuario" | Rejeitar — espaço inválido | EP |

---

## 2. Cenários BDD — Abertura de Conta

**Funcionalidade:** Criação de conta corrente ou poupança pelo correntista  
**Técnicas aplicadas:** Tabela de Decisão, Transição de Estado

```gherkin
# language: pt
@abertura_conta @regressao
Funcionalidade: Abertura de Nova Conta
  Como um correntista autenticado
  Quero abrir uma nova conta bancária
  Para diversificar meu portfólio financeiro

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"

  @positivo @smoke
  Cenário: Abrir conta poupança com sucesso
    Dado que o usuário acessa a página de abertura de conta
    Quando seleciona o tipo de conta "SAVINGS"
    E seleciona a conta de origem disponível
    E clica em "Open New Account"
    Então a conta deve ser criada com sucesso
    E o número da nova conta deve ser exibido
    E a nova conta deve aparecer no painel de contas

  @positivo
  Cenário: Abrir conta corrente com sucesso
    Dado que o usuário acessa a página de abertura de conta
    Quando seleciona o tipo de conta "CHECKING"
    E seleciona a conta de origem disponível
    E clica em "Open New Account"
    Então a conta deve ser criada com sucesso
    E o número da nova conta deve ser exibido

  @positivo
  Cenário: Nova conta aparece no extrato com saldo inicial
    Dado que o usuário acessa a página de abertura de conta
    Quando seleciona o tipo de conta "SAVINGS"
    E seleciona a conta de origem disponível
    E clica em "Open New Account"
    Então a conta deve ser criada com sucesso
    Quando o usuário acessa o extrato da nova conta
    Então deve exibir a transação de "Funds Transfer Received"

  @negativo
  Cenário: Abertura de conta sem conta de origem disponível
    Dado que o usuário possui apenas uma conta com saldo zero
    Quando acessa a página de abertura de conta
    Então o formulário de abertura não deve estar disponível
    Ou o sistema deve exibir mensagem explicativa
```

### Tabela de Decisão — Abertura de Conta

| Condição | CT-AC01 | CT-AC02 | CT-AC03 | CT-AC04 |
|---|:---:|:---:|:---:|:---:|
| Usuário autenticado | ✓ | ✓ | ✓ | ✗ |
| Tem conta de origem ativa | ✓ | ✓ | ✗ | - |
| Saldo suficiente na origem | ✓ | ✗ | - | - |
| Tipo de conta selecionado | ✓ | ✓ | - | - |
| **Resultado: Conta criada** | **SIM** | **NÃO** | **NÃO** | **NÃO** |
| Mensagem de erro exibida | NÃO | SIM | SIM | Redireciona login |

---

## 3. Cenários BDD — Pagamento de Boleto

**Funcionalidade:** Pagamento de boleto/bill pay para beneficiário  
**Técnicas aplicadas:** Partição de Equivalência, Análise de Valor Limite

```gherkin
# language: pt
@bill_pay @regressao
Funcionalidade: Pagamento de Boleto (Bill Pay)
  Como um correntista autenticado
  Quero pagar boletos para beneficiários
  Para quitar obrigações financeiras de forma digital

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    E acessa a página de pagamento de boleto

  @positivo @smoke
  Cenário: Pagamento de boleto com dados válidos
    Quando preenche o nome do beneficiário "Concessionária Energia"
    E preenche o endereço "Av. Principal, 100"
    E preenche a cidade "Brasília"
    E preenche o estado "DF"
    E preenche o CEP "70000-000"
    E preenche o telefone "61-3333-4444"
    E preenche o número da conta do beneficiário "12345678"
    E confirma o número da conta do beneficiário "12345678"
    E informa o valor "150.00"
    E seleciona a conta de débito
    E clica em "Send Payment"
    Então o pagamento deve ser confirmado com sucesso
    E a mensagem "Bill Payment Complete!" deve ser exibida

  @positivo
  Cenário: Pagamento de valor mínimo
    Quando preenche todos os dados do beneficiário com dados válidos
    E informa o valor "0.01"
    E clica em "Send Payment"
    Então o pagamento deve ser confirmado com sucesso

  @negativo
  Cenário: Pagamento com números de conta divergentes
    Quando preenche todos os dados do beneficiário com dados válidos
    E preenche o número da conta do beneficiário "12345678"
    E confirma o número da conta do beneficiário "87654321"
    E clica em "Send Payment"
    Então o sistema deve exibir mensagem de erro de validação

  @negativo
  Cenário: Pagamento sem informar nome do beneficiário
    Quando deixa o nome do beneficiário em branco
    E preenche os demais campos com dados válidos
    E clica em "Send Payment"
    Então o sistema deve exibir a mensagem "Payee name is required."

  @negativo
  Cenário: Pagamento com valor zerado
    Quando preenche todos os dados do beneficiário com dados válidos
    E informa o valor "0"
    E clica em "Send Payment"
    Então o sistema deve exibir mensagem de erro de valor inválido

  @esquema @negativo
  Esquema do Cenário: Campos obrigatórios do boleto
    Quando preenche todos os campos exceto "<campo>"
    E clica em "Send Payment"
    Então o sistema deve exibir a mensagem "<mensagem_esperada>"

    Exemplos:
      | campo       | mensagem_esperada              |
      | Payee Name  | Payee name is required.        |
      | Address     | Address is required.           |
      | City        | City is required.              |
      | State       | State is required.             |
      | Zip Code    | Zip code is required.          |
      | Phone       | Phone number is required.      |
      | Account     | Account number is required.    |
      | Amount      | Amount is required.            |
```

---

## 4. Cenários BDD — Solicitação de Empréstimo

**Funcionalidade:** Solicitação de empréstimo (Loan Request)  
**Técnicas aplicadas:** Tabela de Decisão, Análise de Valor Limite

```gherkin
# language: pt
@emprestimo @regressao
Funcionalidade: Solicitação de Empréstimo
  Como um correntista autenticado
  Quero solicitar um empréstimo
  Para financiar necessidades pessoais com taxas bancárias

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    E acessa a página de solicitação de empréstimo

  @positivo @smoke
  Cenário: Empréstimo aprovado com valores adequados
    Quando informa o valor do empréstimo "1000"
    E informa a renda mensal "5000"
    E clica em "Apply Now"
    Então o sistema deve exibir o resultado da análise
    E o status deve ser "Approved"

  @positivo
  Cenário: Empréstimo exibe detalhes após aprovação
    Quando informa o valor do empréstimo "500"
    E informa a renda mensal "3000"
    E clica em "Apply Now"
    Então o status deve ser "Approved"
    E o número da conta do empréstimo deve ser exibido
    E a nova conta deve aparecer no painel

  @negativo
  Cenário: Empréstimo negado por valor acima da capacidade
    Quando informa o valor do empréstimo "1000000"
    E informa a renda mensal "1000"
    E clica em "Apply Now"
    Então o status deve ser "Denied"
    E o motivo da negativa deve ser exibido

  @negativo
  Cenário: Solicitação com valor zerado
    Quando informa o valor do empréstimo "0"
    E informa a renda mensal "5000"
    E clica em "Apply Now"
    Então o sistema deve exibir mensagem de erro de validação

  @negativo
  Cenário: Solicitação com renda zerada
    Quando informa o valor do empréstimo "1000"
    E informa a renda mensal "0"
    E clica em "Apply Now"
    Então o sistema deve exibir mensagem de erro ou o status deve ser "Denied"
```

### Análise de Valor Limite — Empréstimo

| Variável | Classe Inválida (abaixo) | Limite Inferior | Classe Válida | Limite Superior | Classe Inválida (acima) |
|---|:---:|:---:|:---:|:---:|:---:|
| Valor do empréstimo | ≤ 0 | 0.01 | 0.01 – 99.999,99 | 100.000,00 | > 100.000,00 |
| Renda mensal | ≤ 0 | 0.01 | 0.01 – 999.999,99 | 1.000.000,00 | > 1.000.000,00 |
| Relação empréstimo/renda | - | - | ≤ 20× | - | > 20× (tende a Denied) |

---

## 5. Cenários BDD — Segurança e Sessão

**Funcionalidade:** Proteção de acesso e gerenciamento de sessão  
**Técnicas aplicadas:** Testes de Segurança (OWASP), Transição de Estado

```gherkin
# language: pt
@seguranca @regressao
Funcionalidade: Segurança e Controle de Sessão
  Como analista de QA com foco em segurança
  Quero validar os mecanismos de proteção do sistema
  Para garantir que dados financeiros estão protegidos

  @positivo @smoke
  Cenário: Logout encerra a sessão corretamente
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    Quando clica no link "Log Out"
    Então deve ser redirecionado para a página de login
    E o link "Log Out" não deve ser visível

  @negativo
  Cenário: Acesso direto à página protegida sem autenticação
    Dado que o usuário não está autenticado
    Quando acessa diretamente a URL "/parabank/overview.htm"
    Então deve ser redirecionado para a página de login
    Ou deve exibir mensagem de acesso negado

  @negativo
  Cenário: Botão voltar após logout não restaura sessão
    Dado que o usuário estava autenticado com usuário "john" e senha "demo"
    Quando realiza o logout
    E pressiona o botão "Voltar" do navegador
    Então não deve ter acesso ao painel de contas
    E deve estar na página de login ou sem sessão ativa

  @negativo
  Cenário: SQL Injection no campo de login
    Dado que o usuário está na página de login
    Quando informa o usuário "' OR '1'='1" e a senha "qualquer"
    E clica em "Log In"
    Então o sistema deve exibir mensagem de erro de autenticação
    E não deve fazer login indevido

  @negativo
  Cenário: SQL Injection no campo de senha
    Dado que o usuário está na página de login
    Quando informa o usuário "john" e a senha "' OR '1'='1' --"
    E clica em "Log In"
    Então o sistema deve exibir mensagem de erro de autenticação

  @negativo
  Cenário: XSS no campo de nome do beneficiário (Bill Pay)
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    E acessa a página de pagamento de boleto
    Quando preenche o nome do beneficiário com "<script>alert('XSS')</script>"
    E preenche os demais campos com dados válidos
    E clica em "Send Payment"
    Então o script não deve ser executado
    E o sistema deve tratar a entrada como texto simples ou exibir erro

  @positivo
  Cenário: Múltiplos acessos simultâneos com o mesmo usuário
    Dado que o usuário está autenticado com usuário "john" e senha "demo" na aba 1
    Quando abre uma nova aba e faz login com o mesmo usuário
    Então ambas as sessões devem funcionar independentemente
    Ou o sistema deve invalidar a sessão anterior (comportamento esperado — documentar)
```

---

## 6. Testes Exploratórios

### Metodologia: Session-Based Exploratory Testing (SBET)

Cada charter representa uma sessão de 45–90 minutos com missão definida.

---

### Charter 1 — Exploração de Limites de Transferência

| Campo | Detalhe |
|---|---|
| **Missão** | Investigar o comportamento do sistema em transferências com valores extremos e formatos inesperados |
| **Área de foco** | Página de transferência (`/parabank/transfer.htm`) |
| **Timebox** | 60 minutos |
| **Prioridade** | Alta |
| **Tester** | Victor Almeida |

**Roteiro de exploração:**

1. Transferir o valor exato do saldo disponível (limite superior)
2. Transferir valor acima do saldo → verificar se o sistema bloqueia
3. Transferir `0.001` (três casas decimais) → como o sistema trata?
4. Transferir usando vírgula como separador: `100,00`
5. Transferir com texto no campo de valor: `cem reais`
6. Transferir para a mesma conta (origem = destino) → é permitido?
7. Deixar o navegador aberto por 30 minutos e tentar transferir → sessão expirou?
8. Realizar duas transferências em sequência sem recarregar a página

**Heurísticas aplicadas:** SFDPOT (Structure, Function, Data, Platform, Operations, Time)

**Anotações esperadas:**
- [ ] BUG-001 (já documentado): valor R$0,00 é processado
- [ ] BUG-002 (já documentado): campo vazio não valida antes de submeter
- [ ] Verificar se saldo decrementado corresponde ao valor exibido
- [ ] Verificar se mensagem de erro é clara para o usuário

---

### Charter 2 — Exploração de Extrato e Histórico

| Campo | Detalhe |
|---|---|
| **Missão** | Verificar consistência, ordenação e filtros do extrato da conta |
| **Área de foco** | Activity page (`/parabank/activity.htm?id=XXXX`) |
| **Timebox** | 60 minutos |
| **Prioridade** | Média |

**Roteiro de exploração:**

1. Verificar se transações estão ordenadas por data (mais recente primeiro)
2. Aplicar filtro "Last 30 Days" → conferir se todas as datas estão no intervalo
3. Aplicar filtro "Debit" → verificar se aparecem apenas débitos na coluna correta
4. Aplicar filtros combinados (período + tipo) → resultado coerente?
5. Clicar em uma transação → página de detalhe exibe informações completas?
6. Verificar se o saldo exibido no extrato + transações = saldo na visão geral
7. Acessar extrato de conta com zero transações → como o sistema exibe?
8. Imprimir ou exportar extrato → funcionalidade disponível?

**Heurísticas aplicadas:** HICCUPPS (History, Image, Comparable products, Claims, User expectations, Product, Purpose, Standards)

---

### Charter 3 — Exploração de Segurança e Autorização

| Campo | Detalhe |
|---|---|
| **Missão** | Testar se usuário autenticado consegue acessar dados de outro usuário |
| **Área de foco** | URLs de contas e transações com parâmetros na URL |
| **Timebox** | 45 minutos |
| **Prioridade** | Crítica |

**Roteiro de exploração:**

1. Após login, identificar o `id` da conta própria na URL (`activity.htm?id=12345`)
2. Alterar o `id` na URL para um número aleatório → sistema exibe conta alheia?
3. Alterar o `id` para um número negativo → como o sistema responde?
4. Alterar o `id` para caracteres especiais: `?id=<script>` ou `?id=1 OR 1=1`
5. Tentar acessar `/parabank/transaction.htm?id=XXXX` sem autenticação
6. Verificar se cookies de sessão estão marcados como `HttpOnly` e `Secure`
7. Copiar a URL de uma página logada e abrir em aba anônima → sistema redireciona?

**Risco:** Exposição de dados financeiros de outros clientes (LGPD / Resolução BACEN nº 4.658)

---

### Charter 4 — Exploração de Usabilidade e Experiência

| Campo | Detalhe |
|---|---|
| **Missão** | Avaliar clareza das mensagens de erro e fluxo de navegação |
| **Área de foco** | Formulários de login, registro e transferência |
| **Timebox** | 45 minutos |
| **Prioridade** | Baixa |

**Roteiro de exploração:**

1. Preencher formulário de registro com Tab → ordem de foco está correta?
2. Submeter formulário com Enter ao invés de clicar no botão
3. Colar dados de senha com Ctrl+V → aceita texto da área de transferência?
4. Rolar a página durante carregamento de AJAX → a tela trava?
5. Usar o botão Voltar após uma transferência bem-sucedida → o que acontece?
6. Redimensionar a janela para 768px → layout quebra?
7. Verificar se mensagens de erro são claras e orientam a correção
8. Testar em Firefox → algum comportamento diferente do Chrome?

---

### Charter 5 — Exploração de Abertura de Conta + Empréstimo em Sequência

| Campo | Detalhe |
|---|---|
| **Missão** | Validar a jornada completa de um novo cliente: registro → conta → empréstimo |
| **Área de foco** | Fluxo E2E de novo correntista |
| **Timebox** | 90 minutos |
| **Prioridade** | Alta |

**Roteiro de exploração:**

1. Criar novo usuário com dados gerados (Faker)
2. Verificar conta criada automaticamente após registro
3. Abrir conta poupança → confirmar débito na conta corrente
4. Solicitar empréstimo → verificar se conta de empréstimo aparece no painel
5. Verificar se saldo do empréstimo é negativo (correto para tipo LOAN)
6. Fazer pagamento de parcela → saldo da conta corrente deve cair
7. Verificar extrato de cada conta ao final do fluxo
8. Fazer logout → tentar acessar cada página diretamente

---

## 7. Cenários de Banco de Dados

> Todos os scripts SQL executáveis estão em `database/queries/pratica_sql_bancario.sql`

### 7.1 Validações de Integridade (já automatizadas — referência)

| ID | Cenário | Query | Resultado Esperado |
|---|---|---|---|
| DB-01 | Contas sem cliente associado | `COUNT(*) FROM account LEFT JOIN customer ... WHERE c.id IS NULL` | 0 registros |
| DB-02 | Transações sem conta de origem | `COUNT(*) FROM transaction LEFT JOIN account ... WHERE a.id IS NULL` | 0 registros |
| DB-03 | Saldo negativo em conta não especial | `WHERE balance < 0 AND type NOT IN ('LOAN','CREDIT','OVERDRAFT')` | 0 registros |
| DB-04 | CPF duplicado | `GROUP BY ssn HAVING COUNT(*) > 1` | 0 registros |
| DB-05 | Transações sem auditoria | `LEFT JOIN audit_log ... WHERE al.id IS NULL` | 0 registros |
| DB-06 | Clientes ativos existentes | `COUNT(*) FROM customer WHERE active = TRUE` | > 0 registros |

---

### 7.2 Cenários de Negócio Bancário

```sql
-- ──────────────────────────────────────────────────
-- DB-07: Clientes com conta ativa mas sem movimentação há 90+ dias
-- Cenário: Conta dormente — obrigação de notificação (Resolução BCB nº 4.753)
-- Resultado esperado com nosso seed: Patrícia Rocha (saldo zero, sem tx) e outros
-- ──────────────────────────────────────────────────
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    a.id          AS conta_id,
    a.type,
    a.balance,
    MAX(t.date)   AS ultima_movimentacao
FROM account a
JOIN customer c ON a.customer_id = c.id
LEFT JOIN transaction t ON t.account_id = a.id
WHERE a.active = TRUE
GROUP BY a.id, c.first_name, c.last_name, a.type, a.balance
HAVING MAX(t.date) < CURRENT_DATE - INTERVAL '90 days' OR MAX(t.date) IS NULL;
-- Resultado esperado: deve incluir Patrícia (sem movimentação) e Bruno (inativo)
```

| ID | Cenário | Dado Plantado | Resultado Esperado |
|---|---|---|---|
| DB-07 | Contas dormentes (sem tx há 90+ dias) | Patrícia sem transações; Bruno inativo | ≥ 2 registros |
| DB-08 | Cliente inativo com saldo remanescente | Bruno Santos — R$750 na conta | 1 registro — requer tratamento regulatório |
| DB-09 | Clientes com empréstimo e sem pagamento no mês | Carlos e Elisa sem parcela em abr/2026 | ≥ 1 registro — inadimplência |
| DB-10 | Contas com saldo zero e ativas | Patrícia — R$0 | ≥ 1 registro |

---

### 7.3 Cenários de Conformidade — COAF / BACEN

```sql
-- ──────────────────────────────────────────────────
-- DB-11: Transações individuais acima de R$10.000 em espécie
-- Obrigação: Comunicação ao COAF em até 24h (Lei nº 9.613/1998)
-- ──────────────────────────────────────────────────
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    c.ssn, t.amount, t.description, t.date
FROM transaction t
JOIN account a  ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.amount > 10000.00
ORDER BY t.amount DESC;
-- Resultado esperado: Fernanda (R$12k) e Diego (R$15k) devem aparecer
```

```sql
-- ──────────────────────────────────────────────────
-- DB-12: Estruturação suspeita (Smurfing)
-- Múltiplos depósitos logo abaixo do limite COAF em sequência (mesma semana)
-- ──────────────────────────────────────────────────
SELECT
    c.first_name || ' ' || c.last_name AS cliente,
    COUNT(t.id)   AS qtd_depositos,
    SUM(t.amount) AS total_depositado,
    MIN(t.date)   AS primeira_data,
    MAX(t.date)   AS ultima_data,
    MAX(t.date) - MIN(t.date) AS intervalo_dias
FROM transaction t
JOIN account a  ON t.account_id  = a.id
JOIN customer c ON a.customer_id = c.id
WHERE t.type = 'CREDIT'
  AND t.amount BETWEEN 5000 AND 9999.99
  AND t.description ILIKE '%espécie%'
GROUP BY c.id, c.first_name, c.last_name, c.ssn
HAVING COUNT(t.id) >= 3
   AND MAX(t.date) - MIN(t.date) <= 7;
-- Resultado esperado: Fernanda Souza com 4 depósitos de ~R$9.500 em 4 dias
```

| ID | Cenário | Dado Plantado | Resultado Esperado | Norma |
|---|---|---|---|---|
| DB-11 | TED individual > R$10k | Fernanda R$12k, Diego R$15k | 2 registros | Lei 9.613/1998 |
| DB-12 | Estruturação (smurfing) | 4 depósitos ~R$9.5k em 4 dias | 1 cliente (Fernanda) | Circular BACEN 3.461 |
| DB-13 | Comprometimento de renda > 40% | Carlos, Elisa com empréstimos | ≥ 2 clientes | Política de crédito |
| DB-14 | Concentração de empréstimos em uma cidade | Brasília tem maioria dos empréstimos | Relatório gerencial | Risco sistêmico |

---

### 7.4 Cenários de Conciliação Financeira

```sql
-- ──────────────────────────────────────────────────
-- DB-15: Toda transferência enviada DEVE ter uma recebida correspondente
-- Par inválido = falha de conciliação = erro crítico em ambiente bancário
-- ──────────────────────────────────────────────────
SELECT
    CASE WHEN t_cred.id IS NULL THEN 'SEM PAR — FALHA DE CONCILIAÇÃO' ELSE 'OK' END AS status,
    t_deb.id AS transacao_debito,
    t_deb.account_id AS conta_origem,
    t_deb.amount,
    t_deb.date
FROM transaction t_deb
LEFT JOIN transaction t_cred
    ON  t_deb.amount = t_cred.amount
    AND t_deb.date   = t_cred.date
    AND t_cred.type  = 'CREDIT'
    AND t_cred.description LIKE '%Transfer Received%'
WHERE t_deb.type = 'DEBIT'
  AND t_deb.description LIKE '%Transfer Sent%';
-- Resultado esperado: TODAS as linhas com status = 'OK'
```

| ID | Cenário | Verificação | Resultado Esperado |
|---|---|---|---|
| DB-15 | Transferências com par correto (Debit + Credit) | Join por valor + data + descrição | Nenhum par inválido |
| DB-16 | Somatório de débitos = somatório de créditos por transferência | SUM(DEBIT) = SUM(CREDIT) por data/valor | Diferença = 0 |
| DB-17 | Saldo da conta = saldo inicial + créditos - débitos | Recalcular saldo via transações | Deve bater com a.balance |

---

### 7.5 Cenários de Qualidade de Dados

| ID | Cenário | SQL de Validação | Resultado Esperado |
|---|---|---|---|
| DB-18 | CPF em formato válido (`NNN.NNN.NNN-NN`) | `WHERE ssn NOT LIKE '___.___.___-__'` | 0 registros fora do padrão |
| DB-19 | E-mail com formato válido | `WHERE email NOT LIKE '%@%.%'` | 0 registros inválidos |
| DB-20 | Clientes sem e-mail cadastrado | `WHERE email IS NULL` | 0 registros (campo NOT NULL) |
| DB-21 | Transações com valor negativo ou zero | `WHERE amount <= 0` | 0 registros (constraint CHECK) |
| DB-22 | Datas de transação no futuro | `WHERE date > CURRENT_DATE` | 0 registros (inconsistência) |
| DB-23 | Contas criadas antes do cliente | `JOIN customer WHERE a.created_at < c.created_at` | 0 registros |

---

## 8. Matriz de Cobertura

### Cobertura por Funcionalidade

| Funcionalidade | BDD Automatizado | BDD Manual | Exploratório | Banco de Dados |
|---|:---:|:---:|:---:|:---:|
| Login | ✅ (7 cenários) | — | Charter 3 | — |
| Registro | ✅ E2E | ✅ CT-R01 a R08 | — | — |
| Abertura de Conta | ✅ E2E | ✅ CT-AC01 a AC04 | Charter 5 | DB-17 |
| Transferência | ✅ (5 cenários) | — | Charter 1 | DB-15, DB-16 |
| Extrato | ✅ (5 cenários) | — | Charter 2 | DB-07 |
| Bill Pay | ✅ E2E | ✅ Tabela EP | — | — |
| Empréstimo | ❌ Não automatizado | ✅ VLA | Charter 5 | DB-09, DB-13 |
| Segurança | ✅ E2E (parcial) | ✅ Cenários XSS/SQLi | Charter 3 | — |
| COAF / Conformidade | — | — | — | ✅ DB-11, DB-12 |
| Contas dormentes | — | — | — | ✅ DB-07, DB-08 |
| Conciliação | — | — | — | ✅ DB-15, DB-16 |

### Cobertura por Risco

| Risco | Severidade | Coberto em | Status |
|---|:---:|---|:---:|
| Login indevido (acesso não autorizado) | 🔴 Crítico | BDD Segurança + Charter 3 | ✅ |
| SQL Injection / XSS | 🔴 Crítico | BDD Segurança | ✅ |
| Saldo inconsistente após transferência | 🔴 Crítico | Charter 1 + DB-15, DB-16, DB-17 | ✅ |
| Transação sem auditoria | 🔴 Crítico | DB-05 (automatizado) | ✅ |
| Estruturação suspeita (COAF) | 🔴 Crítico | DB-11, DB-12 | ✅ |
| Conta dormente sem notificação | 🟠 Alto | DB-07, Charter 2 | ✅ |
| Empréstimo aprovado indevidamente | 🟠 Alto | BDD Empréstimo | ⚠️ Manual |
| CPF duplicado | 🟠 Alto | DB-04 (automatizado) | ✅ |
| Sessão não encerrada após logout | 🟠 Alto | BDD Segurança | ✅ |
| Transferência R$0 processada | 🟡 Médio | BUG-001 documentado | 🐛 Bug |
| Campo vazio sem validação | 🟡 Médio | BUG-002 documentado | 🐛 Bug |
| Usabilidade em dispositivos móveis | 🟢 Baixo | Charter 4 + Mobile Appium | ✅ |

---

*Documento gerado para preparação ao processo seletivo de Analista de Testes — Sicoob, Brasília/DF, 2026.*
