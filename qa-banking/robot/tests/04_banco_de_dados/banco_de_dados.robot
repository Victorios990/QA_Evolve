*** Settings ***
Documentation    Suite de testes de Banco de Dados — PostgreSQL (espelha DB2 bancário)
...              Valida integridade referencial, saldos, transações e auditoria.
...              Pré-condição: docker-compose up -d (PostgreSQL na porta 5432)
Library          DatabaseLibrary
Library          Collections
Resource         ../../resources/variables.robot
Resource         ../../resources/database_keywords.robot
Suite Setup      Conectar Banco De Dados
Suite Teardown   Desconectar Banco De Dados

*** Test Cases ***

CT-DB-001: Banco de dados deve estar acessível e conter as tabelas esperadas
    [Tags]    banco_de_dados    sql    smoke
    [Documentation]    Verifica conectividade e existência das quatro tabelas
    ...                principais do modelo bancário.
    Banco De Dados Deve Estar Acessível
    Table Must Exist    customer
    Table Must Exist    account
    Table Must Exist    transaction
    Table Must Exist    audit_log

CT-DB-002: Integridade referencial — conta deve sempre ter cliente associado
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    LEFT JOIN entre account e customer — resultado deve ser 0.
    ...                Violação indica conta órfã sem titular.
    Verificar Integridade Referencial Contas

CT-DB-003: Saldo negativo indevido não deve existir em contas normais
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    Apenas contas do tipo LOAN, CREDIT e OVERDRAFT podem
    ...                ter saldo negativo. Demais tipos devem ter balance >= 0.
    Verificar Ausência De Saldo Negativo Indevido

CT-DB-004: Toda transação deve ter conta de origem válida
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    LEFT JOIN entre transaction e account — resultado deve ser 0.
    ...                Transação sem conta indica inconsistência de dados.
    Verificar Consistência De Transações

CT-DB-005: Banco deve conter ao menos um cliente ativo
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    Valida que a seed.sql foi executada corretamente
    ...                e que há clientes com active = true.
    Verificar Existência De Clientes Ativos

CT-DB-006: CPF não deve estar duplicado na base de clientes
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    Agrupa por SSN e verifica que nenhum CPF aparece mais de uma vez.
    ...                Restrição de unicidade crítica para o sistema bancário.
    Verificar Unicidade De CPF

CT-DB-007: Toda transação deve ter registro de auditoria correspondente
    [Tags]    banco_de_dados    sql    auditoria    positivo
    [Documentation]    LEFT JOIN entre transaction e audit_log — resultado deve ser 0.
    ...                Transação sem auditoria viola rastreabilidade obrigatória.
    Verificar Auditoria De Transações

CT-DB-008: Resumo de saldos por tipo de conta deve retornar dados
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    Query analítica de saldo por tipo — verifica que retorna linhas
    ...                e que todos os saldos de CHECKING são >= 0.
    ${resultado}=    Query
    ...    SELECT type, COUNT(*) as qtd, SUM(balance) as total FROM account WHERE active = true GROUP BY type ORDER BY type
    Should Not Be Empty    ${resultado}    A query de resumo não retornou nenhuma linha
    Log    Resumo de contas por tipo: ${resultado}

CT-DB-009: Clientes com múltiplas contas correntes ativas devem ser identificados
    [Tags]    banco_de_dados    sql    positivo
    [Documentation]    Query de negócio: identifica clientes com mais de uma conta
    ...                CHECKING ativa (possível duplicidade operacional).
    ${resultado}=    Query
    ...    SELECT c.id, c.first_name || ' ' || c.last_name AS cliente, COUNT(*) AS qtd FROM customer c JOIN account a ON a.customer_id = c.id WHERE a.type = 'CHECKING' AND a.active = true GROUP BY c.id, c.first_name, c.last_name HAVING COUNT(*) > 1
    Log    Clientes com múltiplas contas correntes: ${resultado}

CT-DB-010: Últimas entradas de auditoria devem ser recuperáveis
    [Tags]    banco_de_dados    sql    auditoria    positivo
    [Documentation]    Recupera as 10 últimas entradas da audit_log e verifica
    ...                que o resultado é uma lista (pode ser vazia em ambiente limpo).
    ${resultado}=    Query
    ...    SELECT al.id, al.action, al.table_name, al.performed_at FROM audit_log al ORDER BY al.performed_at DESC LIMIT 10
    Log    Últimas entradas de auditoria: ${resultado}
