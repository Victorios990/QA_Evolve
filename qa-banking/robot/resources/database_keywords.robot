*** Settings ***
Library    DatabaseLibrary
Library    Collections
Resource   variables.robot

*** Keywords ***
Banco De Dados Deve Estar Acessível
    [Documentation]    Verifica se a conexão com o PostgreSQL está ativa
    Table Must Exist    customer

Verificar Integridade Referencial Contas
    [Documentation]    Contas sem cliente associado (deve retornar 0)
    ${total}=    Row Count
    ...    SELECT COUNT(*) FROM account a LEFT JOIN customer c ON a.customer_id = c.id WHERE c.id IS NULL
    Should Be Equal As Numbers    ${total}    0
    ...    Existem ${total} conta(s) sem cliente associado — violação de integridade referencial

Verificar Ausência De Saldo Negativo Indevido
    [Documentation]    Saldo < 0 somente permitido para LOAN, CREDIT e OVERDRAFT
    ${total}=    Row Count
    ...    SELECT * FROM account WHERE balance < 0 AND type NOT IN ('LOAN','CREDIT','OVERDRAFT')
    Should Be Equal As Numbers    ${total}    0
    ...    Existem ${total} conta(s) com saldo negativo indevido

Verificar Consistência De Transações
    [Documentation]    Toda transação deve ter conta de origem válida
    ${total}=    Row Count
    ...    SELECT * FROM transaction t LEFT JOIN account a ON t.account_id = a.id WHERE a.id IS NULL
    Should Be Equal As Numbers    ${total}    0
    ...    Existem ${total} transação(ões) sem conta de origem válida

Verificar Existência De Clientes Ativos
    [Documentation]    O banco deve conter ao menos 1 cliente ativo
    ${total}=    Row Count    SELECT * FROM customer WHERE active = true
    Should Be True    ${total} > 0    Nenhum cliente ativo encontrado no banco

Verificar Unicidade De CPF
    [Documentation]    CPF (SSN) não pode se repetir na base de clientes
    ${total}=    Row Count
    ...    SELECT ssn FROM customer WHERE ssn IS NOT NULL GROUP BY ssn HAVING COUNT(*) > 1
    Should Be Equal As Numbers    ${total}    0
    ...    Existem ${total} CPF(s) duplicado(s) na base de clientes

Verificar Auditoria De Transações
    [Documentation]    Toda transação deve ter ao menos um registro de auditoria
    ${total}=    Row Count
    ...    SELECT * FROM transaction t LEFT JOIN audit_log al ON al.transaction_id = t.id WHERE al.id IS NULL
    Should Be Equal As Numbers    ${total}    0
    ...    Existem ${total} transação(ões) sem registro de auditoria

Obter Saldo Da Conta Por ID
    [Arguments]    ${account_id}
    ${resultado}=    Query    SELECT balance FROM account WHERE id = ${account_id}
    [Return]    ${resultado[0][0]}

Obter Última Transação Da Conta
    [Arguments]    ${account_id}
    ${resultado}=    Query
    ...    SELECT id, type, amount, description FROM transaction WHERE account_id = ${account_id} ORDER BY created_at DESC LIMIT 1
    [Return]    ${resultado[0]}

Número De Transações Na Conta
    [Arguments]    ${account_id}
    ${total}=    Row Count    SELECT * FROM transaction WHERE account_id = ${account_id}
    [Return]    ${total}

Verificar Transação Registrada Na Tabela
    [Arguments]    ${tabela}    ${tipo}
    ${total}=    Row Count
    ...    SELECT * FROM ${tabela} WHERE type ILIKE '%${tipo}%'
    Should Be True    ${total} > 0
    ...    Nenhuma transação do tipo '${tipo}' encontrada em ${tabela}
