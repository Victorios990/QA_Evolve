*** Settings ***
Documentation    Testes da Carteira (Wallet) — iGaming
Resource         ../../resources/igaming_keywords.robot
Resource         ../../resources/igaming_variables.robot
Suite Setup      Abrir Browser iGaming
Suite Teardown   Fechar Browser iGaming
Test Teardown    Screenshot Em Falha iGaming

*** Test Cases ***
CT001 - Depósito via PIX com valor válido
    [Tags]    carteira    positivo    smoke    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Deposito    ${DEPOSIT_AMOUNT}    PIX
    Verificar Mensagem Sucesso Wallet    ${MSG_DEPOSIT_OK}

CT002 - Saque dentro do saldo disponível
    [Tags]    carteira    positivo    smoke    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Deposito    ${DEPOSIT_AMOUNT}    PIX
    Verificar Mensagem Sucesso Wallet    ${MSG_DEPOSIT_OK}
    ${saldo_antes}=    Obter Saldo Atual
    Realizar Saque    ${WITHDRAWAL_AMOUNT}
    Verificar Mensagem Sucesso Wallet    ${MSG_WITHDRAWAL_OK}

CT003 - Saque com saldo insuficiente
    [Tags]    carteira    negativo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Saque    ${OVER_LIMIT_AMOUNT}
    Verificar Mensagem Erro Wallet    ${MSG_INSUFFICIENT}

CT004 - Depósito com valor zerado
    [Tags]    carteira    negativo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Deposito    ${ZERO_AMOUNT}    PIX
    Verificar Mensagem Erro Wallet    ${MSG_INVALID_AMOUNT}

CT005 - Saque acima do limite diário
    [Tags]    carteira    negativo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    Realizar Saque    ${OVER_LIMIT_AMOUNT}
    Verificar Mensagem Erro Wallet    ${MSG_DAILY_LIMIT}

CT006 - Saldo é atualizado após depósito
    [Tags]    carteira    positivo    igaming    integridade
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Carteira
    ${saldo_antes}=    Obter Saldo Atual
    Realizar Deposito    100.00    PIX
    Verificar Mensagem Sucesso Wallet    ${MSG_DEPOSIT_OK}
    ${saldo_depois}=    Obter Saldo Atual
    Log    Saldo antes: ${saldo_antes} | Saldo depois: ${saldo_depois}
    Should Not Be Equal    ${saldo_antes}    ${saldo_depois}
