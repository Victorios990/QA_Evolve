*** Settings ***
Library    SeleniumLibrary
Resource   variables.robot

*** Keywords ***
Navegar Para Login
    Go To    ${PARABANK_URL}/index.htm
    Wait Until Element Is Visible    ${LOC_USERNAME}    ${TIMEOUT}

Preencher Username
    [Arguments]    ${usuario}
    Clear Element Text    ${LOC_USERNAME}
    Input Text    ${LOC_USERNAME}    ${usuario}

Preencher Password
    [Arguments]    ${senha}
    Clear Element Text    ${LOC_PASSWORD}
    Input Text    ${LOC_PASSWORD}    ${senha}

Clicar Em Login
    Click Element    ${LOC_BTN_LOGIN}

Login Deve Ter Sucesso
    Wait Until Page Contains Element    ${LOC_LINK_LOGOUT}    ${TIMEOUT}
    Page Should Contain Element    ${LOC_LINK_LOGOUT}
    Location Should Contain    overview

Mensagem De Erro Deve Ser Exibida
    Wait Until Element Is Visible    ${LOC_ERROR_MSG}    ${TIMEOUT}
    Element Should Be Visible    ${LOC_ERROR_MSG}

Mensagem De Erro Deve Conter
    [Arguments]    ${texto_esperado}
    Wait Until Element Is Visible    ${LOC_ERROR_MSG}    ${TIMEOUT}
    Element Should Contain    ${LOC_ERROR_MSG}    ${texto_esperado}

Usuário Não Deve Estar Logado
    Page Should Not Contain Element    ${LOC_LINK_LOGOUT}

Clicar Em Registrar
    Click Element    ${LOC_LINK_REGISTER}
    Wait Until Location Contains    register.htm    ${TIMEOUT}
