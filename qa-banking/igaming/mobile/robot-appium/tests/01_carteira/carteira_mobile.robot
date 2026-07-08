*** Settings ***
Resource    ../../resources/appium_keywords.robot
Resource    ../../resources/appium_variables.robot
Suite Setup     Abrir App Android
Suite Teardown  Fechar App
Test Setup      Fazer Login

*** Test Cases ***
CT-MOB-001 Depósito válido atualiza saldo corretamente
    [Tags]    carteira    financeiro    P1    android
    ${saldo_antes}    Obter Saldo Atual
    Realizar Deposito    ${DEPOSITO_VALIDO}
    Verificar Mensagem De Sucesso    ${MSG_DEPOSITO_OK}
    ${saldo_depois}    Obter Saldo Atual
    ${esperado}    Evaluate    ${saldo_antes} + ${DEPOSITO_VALIDO}
    Should Be Equal As Numbers    ${saldo_depois}    ${esperado}

CT-MOB-002 Saque válido debita saldo corretamente
    [Tags]    carteira    financeiro    P1    android
    Realizar Deposito    200
    ${saldo_antes}    Obter Saldo Atual
    Realizar Saque    ${SAQUE_VALIDO}
    Verificar Mensagem De Sucesso    ${MSG_SAQUE_OK}
    ${saldo_depois}    Obter Saldo Atual
    ${esperado}    Evaluate    ${saldo_antes} - ${SAQUE_VALIDO}
    Should Be Equal As Numbers    ${saldo_depois}    ${esperado}

CT-MOB-003 Saque maior que saldo exibe erro de saldo insuficiente
    [Tags]    carteira    financeiro    negativo    P1    android
    Realizar Saque    ${SALDO_INSUFICIENTE}
    Verificar Mensagem De Erro    ${MSG_SALDO_INSUF}

CT-MOB-004 Depósito com valor zero não executa
    [Tags]    carteira    negativo    P2    android
    Click Element    accessibility_id=input-deposit
    Input Text       accessibility_id=input-deposit    0
    Element Should Be Disabled    accessibility_id=btn-deposit

CT-MOB-005 Registrar aposta debita saldo e confirma aposta
    [Tags]    sportsbook    financeiro    P1    android
    Realizar Deposito    200
    ${saldo_antes}    Obter Saldo Atual
    Realizar Aposta    Final Champions    ${VALOR_APOSTA}
    Verificar Mensagem De Sucesso    ${MSG_APOSTA_OK}
    ${saldo_depois}    Obter Saldo Atual
    Should Be True    ${saldo_depois} < ${saldo_antes}
