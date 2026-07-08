*** Settings ***
Resource    ../../resources/appium_keywords.robot
Resource    ../../resources/appium_variables.robot

*** Test Cases ***
CT-CROSS-001 Depósito funciona em Android
    [Tags]    cross-platform    android    financeiro    P1
    Abrir App Android
    Fazer Login
    Realizar Deposito    ${DEPOSITO_VALIDO}
    Verificar Mensagem De Sucesso    ${MSG_DEPOSITO_OK}
    [Teardown]    Fechar App

CT-CROSS-002 Depósito funciona em iOS
    [Tags]    cross-platform    ios    financeiro    P1
    Abrir App iOS
    Fazer Login
    Realizar Deposito    ${DEPOSITO_VALIDO}
    Verificar Mensagem De Sucesso    ${MSG_DEPOSITO_OK}
    [Teardown]    Fechar App

CT-CROSS-003 Aposta funciona em Android
    [Tags]    cross-platform    android    sportsbook    P1
    Abrir App Android
    Fazer Login
    Realizar Deposito    200
    Realizar Aposta    Final Champions    ${VALOR_APOSTA}
    Verificar Mensagem De Sucesso    ${MSG_APOSTA_OK}
    [Teardown]    Fechar App

CT-CROSS-004 Aposta funciona em iOS
    [Tags]    cross-platform    ios    sportsbook    P1
    Abrir App iOS
    Fazer Login
    Realizar Deposito    200
    Realizar Aposta    Final Champions    ${VALOR_APOSTA}
    Verificar Mensagem De Sucesso    ${MSG_APOSTA_OK}
    [Teardown]    Fechar App

CT-CROSS-005 Isolamento de tenant mantido em Android e iOS
    [Tags]    cross-platform    multi-tenant    P0
    Abrir App Android
    Fazer Login    operator-b    ${USER_TENANT_B}    ${PASS_TENANT_B}
    Element Text Should Be    accessibility_id=tenant-badge    operator-b
    Fechar App
    Abrir App iOS
    Fazer Login    operator-b    ${USER_TENANT_B}    ${PASS_TENANT_B}
    Element Text Should Be    accessibility_id=tenant-badge    operator-b
    [Teardown]    Fechar App
