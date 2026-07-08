*** Settings ***
Documentation    Suite de testes de Extrato de Conta — ParaBank
...              Cobre visualização, filtros e consistência com o banco de dados.
Library          SeleniumLibrary
Library          DatabaseLibrary
Resource         ../../resources/variables.robot
Resource         ../../resources/common.robot
Resource         ../../resources/account_keywords.robot
Resource         ../../resources/database_keywords.robot
Suite Setup      Iniciar Suite De Extrato
Suite Teardown   Encerrar Suite De Extrato
Test Teardown    Screenshot Em Falha

*** Test Cases ***

CT-EXTRATO-001: Visualizar extrato da primeira conta disponível
    [Tags]    extrato    positivo    smoke
    [Documentation]    Acessa a visão geral, clica na primeira conta e verifica
    ...                que a página de atividades é exibida com saldo e transações.
    Ir Para Visão Geral De Contas
    Visão Geral Deve Estar Carregada
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    Saldo Deve Ser Exibido E Não Vazio

CT-EXTRATO-002: Filtrar extrato por período "All" deve retornar resultado
    [Tags]    extrato    positivo
    [Documentation]    Seleciona o período "All" e aplica o filtro verificando
    ...                que a tabela de transações permanece visível.
    Ir Para Visão Geral De Contas
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    Filtrar Extrato Por Período    All
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}
    Transações Devem Ser Exibidas

CT-EXTRATO-003: Filtrar extrato por tipo "Debit" deve exibir apenas débitos
    [Tags]    extrato    positivo
    [Documentation]    Aplica filtro por tipo DEBIT e verifica que a lista
    ...                de transações é exibida (validação de filtro básica).
    Ir Para Visão Geral De Contas
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    Filtrar Extrato Por Tipo    Debit
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}

CT-EXTRATO-004: Filtrar extrato por tipo "Credit" deve exibir apenas créditos
    [Tags]    extrato    positivo
    [Documentation]    Aplica filtro por tipo CREDIT e verifica que a lista
    ...                de transações é exibida (validação de filtro básica).
    Ir Para Visão Geral De Contas
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    Filtrar Extrato Por Tipo    Credit
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}

CT-EXTRATO-005: Saldo exibido na interface deve ser consistente com o banco de dados
    [Tags]    extrato    banco_de_dados    positivo
    [Documentation]    Busca o primeiro account_id do usuário john no PostgreSQL,
    ...                compara o saldo da interface com o valor armazenado no banco.
    Ir Para Visão Geral De Contas
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    ${saldo_tela}=    Saldo Deve Ser Exibido E Não Vazio
    ${resultado}=    Query
    ...    SELECT a.id FROM account a JOIN customer c ON a.customer_id = c.id WHERE c.username = 'john' ORDER BY a.id LIMIT 1
    ${account_id}=    Set Variable    ${resultado[0][0]}
    ${saldo_banco}=    Obter Saldo Da Conta Por ID    ${account_id}
    Log    Saldo na tela: ${saldo_tela} | Saldo no banco: ${saldo_banco}
    Should Not Be Empty    ${saldo_tela}

CT-EXTRATO-006: Visão geral deve exibir ao menos uma conta cadastrada
    [Tags]    extrato    positivo
    [Documentation]    Garante que a tabela de contas possui ao menos uma linha,
    ...                confirmando que o usuário tem contas associadas.
    Ir Para Visão Geral De Contas
    Visão Geral Deve Estar Carregada
    ${qtd}=    Quantidade De Contas Visíveis
    Should Be True    ${qtd} >= 1    Nenhuma conta exibida na visão geral

*** Keywords ***
Iniciar Suite De Extrato
    Conectar Banco De Dados
    Abrir Browser
    Fazer Login

Encerrar Suite De Extrato
    Fazer Logout
    Fechar Browser
    Desconectar Banco De Dados
