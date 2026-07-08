*** Settings ***
Library    AppiumLibrary
Resource   appium_variables.robot

*** Keywords ***
Abrir App Android
    Open Application    ${APPIUM_URL}
    ...    platformName=Android
    ...    deviceName=${ANDROID_DEVICE}
    ...    app=${APK_PATH}
    ...    automationName=UiAutomator2
    ...    noReset=False

Abrir App iOS
    Open Application    ${APPIUM_URL}
    ...    platformName=iOS
    ...    deviceName=${IOS_DEVICE}
    ...    platformVersion=${IOS_VERSION}
    ...    app=${IPA_PATH}
    ...    automationName=XCUITest
    ...    noReset=False

Fechar App
    Close Application

Fazer Login
    [Arguments]    ${tenant}=operator-a    ${user}=${USER_TENANT_A}    ${password}=${PASS_TENANT_A}
    Click Element    accessibility_id=tenant-select
    Click Element    xpath=//android.widget.TextView[@text='${tenant}']
    Input Text       accessibility_id=username    ${user}
    Input Text       accessibility_id=password    ${password}
    Click Element    accessibility_id=btn-submit-login
    Wait Until Element Is Visible    accessibility_id=dashboard    timeout=10s

Obter Saldo Atual
    ${texto}    Get Text    accessibility_id=wallet-balance
    ${saldo}    Evaluate    float('${texto}'.replace('R$','').replace('.','').replace(',','.').strip())
    [Return]    ${saldo}

Realizar Deposito
    [Arguments]    ${valor}
    Click Element    accessibility_id=input-deposit
    Input Text       accessibility_id=input-deposit    ${valor}
    Click Element    accessibility_id=btn-deposit
    Click Element    accessibility_id=btn-confirm
    Wait Until Element Is Visible    accessibility_id=success-message    timeout=10s

Realizar Saque
    [Arguments]    ${valor}
    Click Element    accessibility_id=input-withdraw
    Input Text       accessibility_id=input-withdraw    ${valor}
    Click Element    accessibility_id=btn-withdraw
    Click Element    accessibility_id=btn-confirm

Verificar Mensagem De Sucesso
    [Arguments]    ${mensagem}
    Element Should Contain Text    accessibility_id=success-message    ${mensagem}

Verificar Mensagem De Erro
    [Arguments]    ${mensagem}
    Element Should Contain Text    accessibility_id=error-message    ${mensagem}

Realizar Aposta
    [Arguments]    ${evento}    ${valor}
    Click Element    accessibility_id=nav-sportsbook
    Click Element    accessibility_id=search-event
    Input Text       accessibility_id=search-event    ${evento}
    Click Element    xpath=//android.widget.TextView[@resource-id='event-card'][1]
    Input Text       accessibility_id=bet-amount    ${valor}
    Click Element    accessibility_id=btn-place-bet
    Wait Until Element Is Visible    accessibility_id=success-message    timeout=10s
