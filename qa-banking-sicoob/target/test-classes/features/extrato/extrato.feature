# language: pt
@extrato @regressao
Funcionalidade: Extrato e Atividade da Conta
  Como um correntista autenticado
  Quero visualizar o extrato da minha conta
  Para acompanhar minhas movimentações financeiras

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    E acessa a visão geral de contas

  @positivo @smoke
  Cenário: Visualizar extrato da conta corrente
    Quando o usuário clica em uma conta disponível
    Então a página de atividades da conta deve ser exibida
    E deve exibir o saldo atual da conta
    E deve exibir a lista de transações

  @positivo
  Cenário: Filtrar extrato por período
    Quando o usuário clica em uma conta disponível
    E filtra as transações pelo período "All"
    Então a lista de transações deve ser exibida

  @positivo
  Cenário: Filtrar extrato por tipo de transação - Débito
    Quando o usuário clica em uma conta disponível
    E filtra as transações pelo período "All"
    E filtra pelo tipo "Debit"
    Então todas as transações exibidas devem ser do tipo débito

  @positivo
  Cenário: Filtrar extrato por tipo de transação - Crédito
    Quando o usuário clica em uma conta disponível
    E filtra as transações pelo período "All"
    E filtra pelo tipo "Credit"
    Então todas as transações exibidas devem ser do tipo crédito

  @banco_de_dados
  Cenário: Consistência entre interface e banco de dados
    Quando o usuário clica em uma conta disponível
    Então o saldo exibido na interface deve corresponder ao valor no banco de dados
    E a quantidade de transações na interface deve corresponder à quantidade no banco de dados
