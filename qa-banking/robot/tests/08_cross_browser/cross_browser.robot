*** Settings ***
Documentation    Testes Cross-Browser — iGaming
...              Valida que os fluxos críticos funcionam em Chrome, Firefox e Edge
Resource         ../../resources/igaming_keywords.robot
Resource         ../../resources/igaming_variables.robot
Test Teardown    Fechar Browser iGaming E Capturar Falha

*** Keywords ***
Fechar Browser iGaming E Capturar Falha
    Screenshot Em Falha iGaming
    Fechar Browser iGaming

Executar Fluxo Deposito Em Browser
    [Arguments]    ${browser}
    Abrir Browser iGaming    ${browser}    ${IGAMING_BASE_URL}
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Deposito    100.00    PIX
    Verificar Mensagem Sucesso Wallet    ${MSG_DEPOSIT_OK}
    Log    PASS: Depósito funcionando em ${browser}

Executar Fluxo Login Em Browser
    [Arguments]    ${browser}
    Abrir Browser iGaming    ${browser}    ${IGAMING_BASE_URL}
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Page Should Contain Element    ${LOC_WALLET_BALANCE}
    Log    PASS: Login funcionando em ${browser}

Executar Fluxo Aposta Em Browser
    [Arguments]    ${browser}
    Abrir Browser iGaming    ${browser}    ${IGAMING_BASE_URL}
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Flamengo x Palmeiras
    Selecionar Primeiro Evento
    Realizar Aposta    ${BET_AMOUNT}
    Verificar Mensagem Sucesso Sportsbook    ${MSG_BET_OK}
    Log    PASS: Aposta funcionando em ${browser}

*** Test Cases ***
CB001 - Login funciona no Chrome
    [Tags]    cross-browser    chrome    smoke    igaming
    Executar Fluxo Login Em Browser    chrome

CB002 - Login funciona no Firefox
    [Tags]    cross-browser    firefox    igaming
    Executar Fluxo Login Em Browser    firefox

CB003 - Login funciona no Edge
    [Tags]    cross-browser    edge    igaming
    Executar Fluxo Login Em Browser    edge

CB004 - Depósito funciona no Chrome
    [Tags]    cross-browser    chrome    carteira    smoke    igaming
    Executar Fluxo Deposito Em Browser    chrome

CB005 - Depósito funciona no Firefox
    [Tags]    cross-browser    firefox    carteira    igaming
    Executar Fluxo Deposito Em Browser    firefox

CB006 - Depósito funciona no Edge
    [Tags]    cross-browser    edge    carteira    igaming
    Executar Fluxo Deposito Em Browser    edge

CB007 - Aposta funciona no Chrome
    [Tags]    cross-browser    chrome    sportsbook    igaming
    Executar Fluxo Aposta Em Browser    chrome

CB008 - Aposta funciona no Firefox
    [Tags]    cross-browser    firefox    sportsbook    igaming
    Executar Fluxo Aposta Em Browser    firefox

CB009 - Aposta funciona no Edge
    [Tags]    cross-browser    edge    sportsbook    igaming
    Executar Fluxo Aposta Em Browser    edge

CB010 - Histórico de transações acessível no Chrome
    [Tags]    cross-browser    chrome    historico    igaming
    Abrir Browser iGaming    chrome
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Historico
    Page Should Contain Element    ${LOC_TRANS_TABLE}
    ${qtd}=    Obter Quantidade De Transacoes
    Should Be True    ${qtd} >= 0
    Log    Transações no Chrome: ${qtd}

CB011 - Histórico de transações acessível no Firefox
    [Tags]    cross-browser    firefox    historico    igaming
    Abrir Browser iGaming    firefox
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Historico
    Page Should Contain Element    ${LOC_TRANS_TABLE}
    ${qtd}=    Obter Quantidade De Transacoes
    Should Be True    ${qtd} >= 0
    Log    Transações no Firefox: ${qtd}

CB012 - Histórico de transações acessível no Edge
    [Tags]    cross-browser    edge    historico    igaming
    Abrir Browser iGaming    edge
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Historico
    Page Should Contain Element    ${LOC_TRANS_TABLE}
    ${qtd}=    Obter Quantidade De Transacoes
    Should Be True    ${qtd} >= 0
    Log    Transações no Edge: ${qtd}
