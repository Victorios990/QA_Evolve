*** Settings ***
Library    SeleniumLibrary
Resource   variables.robot

*** Keywords ***
Navegar Para Transferência
    Go To    ${PARABANK_URL}/transfer.htm
    Wait Until Element Is Visible    ${LOC_AMOUNT}    ${TIMEOUT}

Aguardar Contas Carregarem
    [Documentation]    Parabank carrega as contas via AJAX — aguarda opções nos selects
    Wait Until Element Is Visible    css:#fromAccountId option    ${TIMEOUT}
    Wait Until Element Is Visible    css:#toAccountId option      ${TIMEOUT}

Informar Valor
    [Arguments]    ${valor}
    Clear Element Text    ${LOC_AMOUNT}
    Input Text    ${LOC_AMOUNT}    ${valor}

Selecionar Conta Origem Por Índice
    [Arguments]    ${indice}=0
    Select From List By Index    ${LOC_FROM_ACCOUNT}    ${indice}

Selecionar Conta Destino Por Índice
    [Arguments]    ${indice}=1
    Select From List By Index    ${LOC_TO_ACCOUNT}    ${indice}

Clicar Em Transferir
    Click Element    ${LOC_BTN_TRANSFER}

Realizar Transferência
    [Arguments]    ${valor}    ${idx_origem}=0    ${idx_destino}=1
    Navegar Para Transferência
    Aguardar Contas Carregarem
    Informar Valor    ${valor}
    Selecionar Conta Origem Por Índice    ${idx_origem}
    Selecionar Conta Destino Por Índice   ${idx_destino}
    Clicar Em Transferir

Transferência Deve Ter Sucesso
    Wait Until Page Contains    Transfer Complete    ${TIMEOUT}
    Page Should Contain    Transfer Complete

Transferência Não Deve Ter Sido Concluída
    Page Should Not Contain    Transfer Complete

Erro De Transferência Deve Ser Exibido
    Wait Until Element Is Visible    ${LOC_ERROR_MSG}    ${SHORT_TIMEOUT}
    Element Should Be Visible    ${LOC_ERROR_MSG}
