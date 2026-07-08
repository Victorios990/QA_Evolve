*** Settings ***
Library    SeleniumLibrary
Library    DatabaseLibrary
Library    Collections
Library    String
Resource   variables.robot

*** Keywords ***
Abrir Browser
    [Documentation]    Inicializa o Chrome com opções adequadas para CI/CD
    ${options}=    Evaluate    selenium.webdriver.ChromeOptions()    selenium.webdriver
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --disable-dev-shm-usage
    Call Method    ${options}    add_argument    --disable-gpu
    Call Method    ${options}    add_argument    --window-size\=1920,1080
    Open Browser    ${PARABANK_URL}/index.htm    chrome    options=${options}
    Set Selenium Timeout    ${TIMEOUT}
    Set Selenium Implicit Wait    2s
    Maximize Browser Window

Fechar Browser
    Close All Browsers

Conectar Banco De Dados
    [Documentation]    Conecta ao PostgreSQL via psycopg2 (espelha config.properties)
    Connect To Database    psycopg2    ${DB_NAME}    ${DB_USER}    ${DB_PASS}    ${DB_HOST}    ${DB_PORT}

Desconectar Banco De Dados
    Disconnect From Database

Screenshot Em Falha
    Run Keyword If Test Failed    Capture Page Screenshot    falha_{TEST NAME}_{index}.png

Fazer Login
    [Arguments]    ${usuario}=${VALID_USERNAME}    ${senha}=${VALID_PASSWORD}
    Go To    ${PARABANK_URL}/index.htm
    Wait Until Element Is Visible    name:username    ${TIMEOUT}
    Input Text    name:username    ${usuario}
    Input Text    name:password    ${senha}
    Click Element    css:input[value='Log In']
    Wait Until Page Contains Element    link:Log Out    ${TIMEOUT}

Fazer Logout
    Click Element    link:Log Out
    Wait Until Page Does Not Contain Element    link:Log Out    ${TIMEOUT}

Gerar Sufixo Único
    [Documentation]    Retorna timestamp em milissegundos para unicidade de dados
    ${ts}=    Evaluate    int(__import__('time').time() * 1000)
    [Return]    ${ts}
