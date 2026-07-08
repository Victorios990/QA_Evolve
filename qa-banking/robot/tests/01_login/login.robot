*** Settings ***
Documentation    Suite de testes de Login — ParaBank
...              Cobre cenários positivos, negativos e data-driven de autenticação.
...              Aplicação: https://parabank.parasoft.com
...              Credenciais padrão: john / demo
Library          SeleniumLibrary
Resource         ../../resources/variables.robot
Resource         ../../resources/common.robot
Resource         ../../resources/login_keywords.robot
Suite Setup      Abrir Browser
Suite Teardown   Fechar Browser
Test Setup       Navegar Para Login
Test Teardown    Screenshot Em Falha

*** Test Cases ***

CT-LOGIN-001: Login com credenciais válidas deve redirecionar para visão geral
    [Tags]    login    positivo    smoke
    [Documentation]    Verifica que o login bem-sucedido redireciona para /overview.htm
    ...                e exibe o link de logout confirmando autenticação.
    Preencher Username    ${VALID_USERNAME}
    Preencher Password    ${VALID_PASSWORD}
    Clicar Em Login
    Login Deve Ter Sucesso
    [Teardown]    Run Keywords    Fazer Logout    AND    Screenshot Em Falha

CT-LOGIN-002: Login com senha incorreta deve exibir mensagem de erro
    [Tags]    login    negativo
    [Documentation]    Verifica que senha inválida gera mensagem de erro visível,
    ...                sem redirecionar o usuário para área autenticada.
    Preencher Username    ${VALID_USERNAME}
    Preencher Password    senha_invalida_XYZ
    Clicar Em Login
    Mensagem De Erro Deve Ser Exibida
    Usuário Não Deve Estar Logado

CT-LOGIN-003: Login com usuário em branco deve exibir mensagem de erro
    [Tags]    login    negativo
    [Documentation]    Verifica que o campo username em branco impede o login.
    Preencher Password    ${VALID_PASSWORD}
    Clicar Em Login
    Mensagem De Erro Deve Ser Exibida
    Usuário Não Deve Estar Logado

CT-LOGIN-004: Login com ambos os campos em branco deve exibir mensagem de erro
    [Tags]    login    negativo
    [Documentation]    Verifica que submeter o formulário totalmente vazio exibe erro.
    Clicar Em Login
    Mensagem De Erro Deve Ser Exibida
    Usuário Não Deve Estar Logado

CT-LOGIN-005: Login com usuário inexistente deve exibir mensagem de erro
    [Tags]    login    negativo
    [Documentation]    Verifica que um usuário não cadastrado recebe mensagem de erro.
    Preencher Username    usuario_nao_cadastrado_99
    Preencher Password    qualquer_senha
    Clicar Em Login
    Mensagem De Erro Deve Ser Exibida
    Usuário Não Deve Estar Logado

CT-LOGIN-006: Login inválido — tabela de dados múltiplos
    [Tags]    login    negativo    data-driven
    [Documentation]    Cobre múltiplas combinações inválidas de credenciais.
    [Template]    Tentar Login Inválido E Verificar Erro
    usuario_nao_existe         qualquer_senha
    ${VALID_USERNAME}          senha_errada_123
    ${EMPTY}                   ${EMPTY}
    ${EMPTY}                   ${VALID_PASSWORD}
    usuario_sql_inject'--      senha

CT-LOGIN-007: Verificar link de registro está disponível na página de login
    [Tags]    login    positivo
    [Documentation]    Garante que o link "Register" está visível na tela de login.
    Page Should Contain Element    ${LOC_LINK_REGISTER}
    Element Should Be Visible      ${LOC_LINK_REGISTER}

*** Keywords ***
Tentar Login Inválido E Verificar Erro
    [Arguments]    ${usuario}    ${senha}
    Navegar Para Login
    Run Keyword If    '${usuario}' != '${EMPTY}'    Preencher Username    ${usuario}
    Run Keyword If    '${senha}' != '${EMPTY}'      Preencher Password    ${senha}
    Clicar Em Login
    Mensagem De Erro Deve Ser Exibida
