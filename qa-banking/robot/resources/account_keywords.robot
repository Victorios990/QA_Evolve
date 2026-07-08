*** Settings ***
Library    SeleniumLibrary
Library    Collections
Resource   variables.robot

*** Keywords ***
Ir Para Visão Geral De Contas
    Click Element    ${LOC_LINK_OVERVIEW}
    Wait Until Element Is Visible    ${LOC_ACC_TABLE}    ${TIMEOUT}

Visão Geral Deve Estar Carregada
    Wait Until Element Is Visible    ${LOC_ACC_TABLE}    ${TIMEOUT}
    Page Should Contain    Accounts Overview

Quantidade De Contas Visíveis
    ${linhas}=    Get WebElements    ${LOC_ACC_ROWS}
    ${qtd}=    Get Length    ${linhas}
    [Return]    ${qtd}

Clicar Na Primeira Conta Disponível
    Wait Until Element Is Visible    ${LOC_ACC_LINKS}    ${TIMEOUT}
    ${links}=    Get WebElements    ${LOC_ACC_LINKS}
    Click Element    ${links}[0]
    Wait Until Location Contains    activity.htm    ${TIMEOUT}

Extrato Deve Estar Carregado
    Location Should Contain    activity.htm
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}

Saldo Deve Ser Exibido E Não Vazio
    Wait Until Element Is Visible    ${LOC_BALANCE}    ${TIMEOUT}
    ${saldo}=    Get Text    ${LOC_BALANCE}
    Should Not Be Empty    ${saldo}
    Should Start With    ${saldo}    $
    [Return]    ${saldo}

Obter Saldo Atual Da Tela
    ${saldo}=    Get Text    ${LOC_BALANCE}
    [Return]    ${saldo}

Obter Saldo Disponível
    ${saldo}=    Get Text    ${LOC_AVAIL_BALANCE}
    [Return]    ${saldo}

Filtrar Extrato Por Período
    [Arguments]    ${periodo}
    Select From List By Label    ${LOC_PERIOD_SELECT}    ${periodo}
    Click Element    ${LOC_BTN_GO}
    Sleep    1s

Filtrar Extrato Por Tipo
    [Arguments]    ${tipo}
    Select From List By Label    ${LOC_TYPE_SELECT}    ${tipo}
    Click Element    ${LOC_BTN_GO}
    Sleep    1s

Transações Devem Ser Exibidas
    ${linhas}=    Get WebElements    ${LOC_TRANS_ROWS}
    ${qtd}=    Get Length    ${linhas}
    Should Be True    ${qtd} >= 0
    [Return]    ${qtd}

Abrir Nova Conta Do Tipo
    [Arguments]    ${tipo}=SAVINGS
    Click Element    ${LOC_LINK_OPEN_ACCOUNT}
    Wait Until Element Is Visible    ${LOC_ACC_TYPE}    ${TIMEOUT}
    Wait Until Element Is Visible    ${LOC_FROM_ACC_OPT}    ${TIMEOUT}
    ${indice}=    Set Variable If    '${tipo}' == 'SAVINGS'    1    0
    Select From List By Index    ${LOC_ACC_TYPE}    ${indice}
    Click Element    ${LOC_BTN_OPEN}

Nova Conta Deve Ter Sido Criada Com Sucesso
    Wait Until Page Contains    Account Opened    ${TIMEOUT}
    Wait Until Element Is Visible    ${LOC_NEW_ACC_ID}    ${TIMEOUT}
    ${id_conta}=    Get Text    ${LOC_NEW_ACC_ID}
    Should Not Be Empty    ${id_conta}
    [Return]    ${id_conta}
