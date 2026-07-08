*** Settings ***
Documentation    Teste E2E — Jornada Completa do Usuário Bancário
...              Fluxo: Registro → Visão Geral → Abrir Conta → Transferência
...              → Extrato → Pagamento de Boleto → Logout → Acesso Negado
...
...              Dados de teste gerados dinamicamente via timestamp para
...              garantir unicidade no Parabank (evitar colisão de usernames).
Library          SeleniumLibrary
Library          String
Library          Collections
Resource         ../../resources/variables.robot
Resource         ../../resources/common.robot
Resource         ../../resources/login_keywords.robot
Resource         ../../resources/account_keywords.robot
Resource         ../../resources/transfer_keywords.robot
Suite Setup      Abrir Browser
Suite Teardown   Fechar Browser
Test Teardown    Screenshot Em Falha

*** Variables ***
${NOVO_USERNAME}        ${EMPTY}
${NOVA_SENHA}           Test@1234
${NOVO_ACCOUNT_ID}      ${EMPTY}

*** Test Cases ***

CT-E2E-001: Jornada completa do usuário bancário
    [Tags]    e2e    smoke
    [Documentation]    Cenário end-to-end que cobre o ciclo completo de um usuário:
    ...                do registro à consulta de extrato após movimentações financeiras.

    # ── Etapa 1: Registro de novo usuário ─────────────────────────────────────
    ${sufixo}=    Gerar Sufixo Único
    ${username}=    Set Variable    qa_robot_${sufixo}
    Set Suite Variable    ${NOVO_USERNAME}    ${username}

    Go To    ${PARABANK_URL}/register.htm
    Wait Until Element Is Visible    ${LOC_FIRST_NAME}    ${TIMEOUT}
    Input Text    ${LOC_FIRST_NAME}    Robot
    Input Text    ${LOC_LAST_NAME}     Framework
    Input Text    ${LOC_REG_ADDRESS}   Rua QA Automation, 42
    Input Text    ${LOC_REG_CITY}      Brasilia
    Input Text    ${LOC_REG_STATE}     DF
    Input Text    ${LOC_REG_ZIP}       70000-000
    Input Text    ${LOC_REG_PHONE}     61999990000
    Input Text    ${LOC_REG_SSN}       999.888.777-${sufixo}[-3:]
    Input Text    ${LOC_REG_USERNAME}  ${username}
    Input Text    ${LOC_REG_PASSWORD}  ${NOVA_SENHA}
    Input Text    ${LOC_CONFIRM_PASS}  ${NOVA_SENHA}
    Click Element    ${LOC_BTN_REGISTER}

    # ── Etapa 2: Verificar registro e login automático ─────────────────────────
    Wait Until Page Contains Element    ${LOC_LINK_LOGOUT}    ${TIMEOUT}
    Page Should Contain Element    ${LOC_LINK_LOGOUT}
    Log    Usuário registrado e autenticado: ${username}

    # ── Etapa 3: Visão geral de contas ─────────────────────────────────────────
    Ir Para Visão Geral De Contas
    Visão Geral Deve Estar Carregada
    ${qtd_contas}=    Quantidade De Contas Visíveis
    Should Be True    ${qtd_contas} >= 1    Novo usuário deve ter ao menos 1 conta

    # ── Etapa 4: Abrir nova conta poupança ─────────────────────────────────────
    Abrir Nova Conta Do Tipo    SAVINGS
    ${id_nova_conta}=    Nova Conta Deve Ter Sido Criada Com Sucesso
    Set Suite Variable    ${NOVO_ACCOUNT_ID}    ${id_nova_conta}
    Log    Nova conta poupança criada: ${id_nova_conta}

    # ── Etapa 5: Transferência entre contas ────────────────────────────────────
    Ir Para Visão Geral De Contas
    ${qtd_pos_abertura}=    Quantidade De Contas Visíveis
    Should Be True    ${qtd_pos_abertura} >= 2    Devem existir ao menos 2 contas após abertura

    Realizar Transferência    50.00    0    1
    Transferência Deve Ter Sucesso
    Log    Transferência de R$50,00 concluída com sucesso

    # ── Etapa 6: Consultar extrato ──────────────────────────────────────────────
    Ir Para Visão Geral De Contas
    Clicar Na Primeira Conta Disponível
    Extrato Deve Estar Carregado
    ${saldo}=    Saldo Deve Ser Exibido E Não Vazio
    Log    Saldo após transferência: ${saldo}

    # ── Etapa 7: Pagamento de boleto ────────────────────────────────────────────
    Go To    ${PARABANK_URL}/billpay.htm
    Wait Until Element Is Visible    ${LOC_PAYEE_NAME}    ${TIMEOUT}
    Wait Until Element Is Visible    ${LOC_FROM_PAY_OPT}  ${TIMEOUT}
    Input Text    ${LOC_PAYEE_NAME}       Concessionária Energia
    Input Text    ${LOC_PAYEE_ADDR}       Av. Central, 1000
    Input Text    ${LOC_PAYEE_CITY}       Brasilia
    Input Text    ${LOC_PAYEE_STATE}      DF
    Input Text    ${LOC_PAYEE_ZIP}        70000-100
    Input Text    ${LOC_PAYEE_PHONE}      61988880000
    Input Text    ${LOC_PAYEE_ACCOUNT}    12345678
    Input Text    ${LOC_VERIFY_ACCOUNT}   12345678
    Input Text    ${LOC_PAY_AMOUNT}       25.00
    Click Element    ${LOC_BTN_SEND}
    Wait Until Page Contains    Bill Payment Complete    ${TIMEOUT}
    Page Should Contain    Bill Payment Complete
    Log    Pagamento de boleto de R$25,00 confirmado

    # ── Etapa 8: Logout ─────────────────────────────────────────────────────────
    Fazer Logout
    Usuário Não Deve Estar Logado
    Log    Logout realizado com sucesso

    # ── Etapa 9: Verificar que páginas protegidas bloqueiam acesso ──────────────
    Go To    ${PARABANK_URL}/overview.htm
    Wait Until Location Contains    login    ${TIMEOUT}
    Log    Acesso negado a área protegida — redirecionamento para login confirmado
