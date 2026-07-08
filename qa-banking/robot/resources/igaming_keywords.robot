*** Settings ***
Library    SeleniumLibrary
Library    Collections
Library    String
Resource   igaming_variables.robot

*** Keywords ***
# ── Browser ──────────────────────────────────────────────────────────────────
Abrir Browser iGaming
    [Arguments]    ${browser}=chrome    ${url}=${IGAMING_BASE_URL}
    ${options}=    Avaliar Opcoes Browser    ${browser}
    Open Browser    ${url}    ${browser}    options=${options}
    Set Selenium Timeout    ${TIMEOUT}
    Set Selenium Implicit Wait    2s
    Maximize Browser Window

Avaliar Opcoes Browser
    [Arguments]    ${browser}
    ${browser_lower}=    Convert To Lower Case    ${browser}
    IF    '${browser_lower}' == 'chrome'
        ${options}=    Evaluate    selenium.webdriver.ChromeOptions()    selenium.webdriver
        Call Method    ${options}    add_argument    --no-sandbox
        Call Method    ${options}    add_argument    --disable-dev-shm-usage
        Call Method    ${options}    add_argument    --window-size\=1920,1080
    ELSE IF    '${browser_lower}' == 'firefox'
        ${options}=    Evaluate    selenium.webdriver.FirefoxOptions()    selenium.webdriver
    ELSE IF    '${browser_lower}' == 'edge'
        ${options}=    Evaluate    selenium.webdriver.EdgeOptions()    selenium.webdriver
        Call Method    ${options}    add_argument    --no-sandbox
        Call Method    ${options}    add_argument    --disable-dev-shm-usage
    ELSE
        ${options}=    Evaluate    selenium.webdriver.ChromeOptions()    selenium.webdriver
    END
    [Return]    ${options}

Fechar Browser iGaming
    Close All Browsers

Screenshot Em Falha iGaming
    Run Keyword If Test Failed    Capture Page Screenshot    falha_igaming_{TEST NAME}.png

# ── Autenticação ─────────────────────────────────────────────────────────────
Fazer Login iGaming
    [Arguments]    ${usuario}=${IGAMING_USER}    ${senha}=${IGAMING_PASS}
    Go To    ${IGAMING_BASE_URL}/login
    Wait Until Element Is Visible    ${LOC_LOGIN_USERNAME}    ${TIMEOUT}
    Input Text    ${LOC_LOGIN_USERNAME}    ${usuario}
    Input Text    ${LOC_LOGIN_PASSWORD}    ${senha}
    Click Element    ${LOC_LOGIN_BTN}
    Wait Until Element Is Not Visible    ${LOC_LOGIN_BTN}    ${TIMEOUT}

Fazer Logout iGaming
    Go To    ${IGAMING_BASE_URL}/logout
    Wait Until Page Contains Element    ${LOC_LOGIN_BTN}    ${TIMEOUT}

# ── Wallet ────────────────────────────────────────────────────────────────────
Acessar Pagina Carteira
    Go To    ${IGAMING_WALLET_URL}
    Wait Until Element Is Visible    ${LOC_WALLET_BALANCE}    ${TIMEOUT}

Obter Saldo Atual
    ${saldo}=    Get Text    ${LOC_WALLET_BALANCE}
    [Return]    ${saldo}

Abrir Aba Deposito
    Click Element    ${LOC_DEPOSIT_TAB}
    Wait Until Element Is Visible    ${LOC_DEPOSIT_AMOUNT}    ${TIMEOUT}

Abrir Aba Saque
    Click Element    ${LOC_WITHDRAWAL_TAB}
    Wait Until Element Is Visible    ${LOC_WITHDRAWAL_AMOUNT}    ${TIMEOUT}

Realizar Deposito
    [Arguments]    ${valor}    ${metodo}=PIX
    Abrir Aba Deposito
    Clear Element Text    ${LOC_DEPOSIT_AMOUNT}
    Input Text    ${LOC_DEPOSIT_AMOUNT}    ${valor}
    Select From List By Label    ${LOC_PAYMENT_METHOD}    ${metodo}
    Click Element    ${LOC_CONFIRM_DEPOSIT}

Realizar Saque
    [Arguments]    ${valor}
    Abrir Aba Saque
    Clear Element Text    ${LOC_WITHDRAWAL_AMOUNT}
    Input Text    ${LOC_WITHDRAWAL_AMOUNT}    ${valor}
    Click Element    ${LOC_CONFIRM_WITHDRAWAL}

Verificar Mensagem Sucesso Wallet
    [Arguments]    ${mensagem}=${MSG_DEPOSIT_OK}
    Wait Until Element Is Visible    ${LOC_WALLET_SUCCESS}    ${TIMEOUT}
    Element Should Contain    ${LOC_WALLET_SUCCESS}    ${mensagem}

Verificar Mensagem Erro Wallet
    [Arguments]    ${mensagem}
    Wait Until Element Is Visible    ${LOC_WALLET_ERROR}    ${TIMEOUT}
    Element Should Contain    ${LOC_WALLET_ERROR}    ${mensagem}

# ── Sportsbook ────────────────────────────────────────────────────────────────
Acessar Pagina Sportsbook
    Go To    ${IGAMING_SPORTSBOOK_URL}
    Wait Until Element Is Visible    ${LOC_SEARCH_EVENTS}    ${TIMEOUT}

Pesquisar Evento
    [Arguments]    ${nome_evento}
    Clear Element Text    ${LOC_SEARCH_EVENTS}
    Input Text    ${LOC_SEARCH_EVENTS}    ${nome_evento}
    Wait Until Element Is Visible    ${LOC_FIRST_EVENT}    ${TIMEOUT}

Selecionar Primeiro Evento
    Click Element    ${LOC_FIRST_EVENT}
    Wait Until Element Is Visible    ${LOC_BET_AMOUNT}    ${TIMEOUT}

Realizar Aposta
    [Arguments]    ${valor}
    Clear Element Text    ${LOC_BET_AMOUNT}
    Input Text    ${LOC_BET_AMOUNT}    ${valor}
    Click Element    ${LOC_PLACE_BET}

Verificar Mensagem Sucesso Sportsbook
    [Arguments]    ${mensagem}=${MSG_BET_OK}
    Wait Until Element Is Visible    ${LOC_SB_SUCCESS}    ${TIMEOUT}
    Element Should Contain    ${LOC_SB_SUCCESS}    ${mensagem}

Verificar Mensagem Erro Sportsbook
    [Arguments]    ${mensagem}
    Wait Until Element Is Visible    ${LOC_SB_ERROR}    ${TIMEOUT}
    Element Should Contain    ${LOC_SB_ERROR}    ${mensagem}

Cancelar Aposta Aberta
    Click Element    ${LOC_OPEN_BETS_TAB}
    Wait Until Element Is Visible    ${LOC_FIRST_OPEN_BET}    ${TIMEOUT}
    Click Element    ${LOC_FIRST_OPEN_BET}
    Click Element    ${LOC_CANCEL_BET}

# ── Histórico de Transações ───────────────────────────────────────────────────
Acessar Pagina Historico
    Go To    ${IGAMING_HISTORY_URL}
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}

Filtrar Por Tipo
    [Arguments]    ${tipo}
    Select From List By Label    ${LOC_FILTER_TYPE}    ${tipo}
    Click Element    ${LOC_APPLY_FILTER}
    Wait Until Element Is Visible    ${LOC_TRANS_TABLE}    ${TIMEOUT}

Filtrar Por Periodo
    [Arguments]    ${data_inicio}    ${data_fim}
    Input Text    ${LOC_FILTER_DATE_FROM}    ${data_inicio}
    Input Text    ${LOC_FILTER_DATE_TO}    ${data_fim}
    Click Element    ${LOC_APPLY_FILTER}

Verificar Sem Resultados
    Wait Until Element Is Visible    ${LOC_NO_RESULTS}    ${TIMEOUT}
    Element Should Contain    ${LOC_NO_RESULTS}    ${MSG_NO_TRANSACTIONS}

Obter Quantidade De Transacoes
    ${rows}=    Get WebElements    ${LOC_TRANS_ROWS}
    ${count}=   Get Length    ${rows}
    [Return]    ${count}

Exportar Historico CSV
    Click Element    ${LOC_EXPORT_CSV}
