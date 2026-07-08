*** Settings ***
Documentation    Suite de testes de Transferência de Fundos — ParaBank
...              Cobre cenários positivos, negativos e validação em banco de dados.
...              Pré-condição: usuário john/demo com ao menos 2 contas cadastradas.
Library          SeleniumLibrary
Library          DatabaseLibrary
Resource         ../../resources/variables.robot
Resource         ../../resources/common.robot
Resource         ../../resources/transfer_keywords.robot
Suite Setup      Iniciar Suite De Transferência
Suite Teardown   Encerrar Suite De Transferência
Test Teardown    Screenshot Em Falha

*** Test Cases ***

CT-TRANSF-001: Transferência com valor válido deve ser concluída com sucesso
    [Tags]    transferencia    positivo    smoke
    [Documentation]    Verifica que uma transferência de R$100,00 entre contas distintas
    ...                é processada e exibe "Transfer Complete".
    Realizar Transferência    ${TRANSFER_AMOUNT}
    Transferência Deve Ter Sucesso

CT-TRANSF-002: Transferência com valor mínimo R$0,01 deve ser processada
    [Tags]    transferencia    positivo
    [Documentation]    Valida que o sistema aceita o menor valor monetário possível.
    Realizar Transferência    ${MIN_AMOUNT}
    Transferência Deve Ter Sucesso

CT-TRANSF-003: Transferência com valor R$0,00 não deveria ser processada
    [Tags]    transferencia    negativo    bug
    [Documentation]    BUG-001: Parabank processa transferência de R$0,00 sem exibir erro.
    ...                Comportamento esperado: rejeitar valor zero com mensagem de erro.
    ...                Comportamento atual: processa a transferência silenciosamente.
    Realizar Transferência    ${ZERO_AMOUNT}
    Transferência Não Deve Ter Sido Concluída

CT-TRANSF-004: Transferência com campo valor vazio não deveria ser submetida
    [Tags]    transferencia    negativo    bug
    [Documentation]    BUG-002: Parabank não valida o campo vazio antes de submeter.
    ...                Comportamento esperado: mensagem de validação antes do POST.
    ...                Comportamento atual: submete sem valor definido.
    Navegar Para Transferência
    Aguardar Contas Carregarem
    Clicar Em Transferir
    Erro De Transferência Deve Ser Exibido

CT-TRANSF-005: Após transferência bem-sucedida deve haver registro no banco de dados
    [Tags]    transferencia    banco_de_dados    positivo
    [Documentation]    Valida que a transferência de R$50,00 gera transações
    ...                de DEBIT e CREDIT nas tabelas do PostgreSQL local.
    Realizar Transferência    50.00
    Transferência Deve Ter Sucesso
    Verificar Transação Registrada Na Tabela    transaction    DEBIT
    Verificar Transação Registrada Na Tabela    transaction    CREDIT

*** Keywords ***
Iniciar Suite De Transferência
    Conectar Banco De Dados
    Abrir Browser
    Fazer Login

Encerrar Suite De Transferência
    Fazer Logout
    Fechar Browser
    Desconectar Banco De Dados
