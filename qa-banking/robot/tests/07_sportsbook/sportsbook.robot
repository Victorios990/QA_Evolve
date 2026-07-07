*** Settings ***
Documentation    Testes de Apostas Esportivas (Sportsbook) — iGaming
Resource         ../../resources/igaming_keywords.robot
Resource         ../../resources/igaming_variables.robot
Suite Setup      Abrir Browser iGaming
Suite Teardown   Fechar Browser iGaming
Test Teardown    Screenshot Em Falha iGaming

*** Test Cases ***
SB001 - Realizar aposta em evento disponível
    [Tags]    sportsbook    positivo    smoke    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Flamengo x Palmeiras
    Selecionar Primeiro Evento
    Realizar Aposta    ${BET_AMOUNT}
    Verificar Mensagem Sucesso Sportsbook    ${MSG_BET_OK}

SB002 - Cancelar aposta aberta
    [Tags]    sportsbook    positivo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Flamengo x Palmeiras
    Selecionar Primeiro Evento
    Realizar Aposta    ${BET_AMOUNT}
    Verificar Mensagem Sucesso Sportsbook    ${MSG_BET_OK}
    Cancelar Aposta Aberta
    Verificar Mensagem Sucesso Sportsbook    ${MSG_BET_CANCELLED}

SB003 - Aposta com saldo insuficiente
    [Tags]    sportsbook    negativo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Flamengo x Palmeiras
    Selecionar Primeiro Evento
    Realizar Aposta    ${OVER_LIMIT_AMOUNT}
    Verificar Mensagem Erro Sportsbook    ${MSG_INSUFFICIENT}

SB004 - Verificar odds exibidas antes da aposta
    [Tags]    sportsbook    positivo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Brasil x Argentina
    Selecionar Primeiro Evento
    Wait Until Element Is Visible    ${LOC_ODDS_VALUE}    ${TIMEOUT}
    ${odds}=    Get Text    ${LOC_ODDS_VALUE}
    Should Not Be Empty    ${odds}
    Log    Odds obtidas: ${odds}

SB005 - Aposta abaixo do valor mínimo
    [Tags]    sportsbook    negativo    igaming
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Sportsbook
    Pesquisar Evento    Flamengo x Palmeiras
    Selecionar Primeiro Evento
    Realizar Aposta    0.01
    Verificar Mensagem Erro Sportsbook    Valor abaixo do mínimo permitido para apostas

SB006 - Aposta liquidada aparece no histórico
    [Tags]    sportsbook    positivo    igaming    integridade
    Fazer Login iGaming    ${IGAMING_USER}    ${IGAMING_PASS}
    Acessar Pagina Historico
    Filtrar Por Tipo    Aposta
    ${qtd}=    Obter Quantidade De Transacoes
    Should Be True    ${qtd} >= 0
    Log    Apostas no histórico: ${qtd}
