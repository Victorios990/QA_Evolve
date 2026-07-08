# language: pt
@historico @igaming
Funcionalidade: Histórico de Transações
  Como um jogador autenticado na plataforma iGaming
  Quero consultar meu histórico de transações
  Para acompanhar minha movimentação financeira com clareza e rastreabilidade

  Contexto:
    Dado que o jogador está autenticado no iGaming com usuário "player01" e senha "Senha@123"
    E acessa a página de histórico de transações

  @positivo @smoke
  Cenário: Listagem de transações recentes sem filtro
    Então a tabela de transações deve ser exibida
    E deve conter ao menos uma transação registrada

  @positivo
  Cenário: Filtro por tipo de transação — Depósito
    Quando o jogador filtra por tipo "Depósito"
    E aplica os filtros
    Então todas as transações exibidas devem ser do tipo "Depósito"

  @positivo
  Cenário: Filtro por tipo de transação — Saque
    Quando o jogador filtra por tipo "Saque"
    E aplica os filtros
    Então todas as transações exibidas devem ser do tipo "Saque"

  @positivo
  Cenário: Filtro por período de datas válido
    Quando o jogador filtra pelo período de "01/06/2026" a "30/06/2026"
    E aplica os filtros
    Então todas as transações exibidas devem estar dentro do período informado

  @negativo
  Cenário: Filtro com data de início maior que data de fim
    Quando o jogador filtra pelo período de "30/06/2026" a "01/06/2026"
    E aplica os filtros
    Então o sistema exibe a mensagem de erro "Período de datas inválido"

  @negativo
  Cenário: Filtro com período sem transações retorna estado vazio
    Quando o jogador filtra pelo período de "01/01/2000" a "02/01/2000"
    E aplica os filtros
    Então o sistema exibe a mensagem "Nenhuma transação encontrada"

  @positivo
  Cenário: Filtro por faixa de valor
    Quando o jogador filtra por valor mínimo "50.00" e máximo "200.00"
    E aplica os filtros
    Então todas as transações devem ter valor entre "50.00" e "200.00"

  @positivo
  Cenário: Exportação do histórico em CSV
    Quando o jogador clica em exportar CSV
    Então o sistema exibe a mensagem de sucesso "Exportação concluída com sucesso"

  @positivo
  Cenário: Paginação do histórico de transações
    Dado que existem mais transações do que o limite por página
    Quando o jogador navega para a próxima página
    Então a segunda página de transações é exibida
    E os registros são diferentes dos da primeira página

  @integridade
  Cenário: Integridade do saldo após múltiplas transações
    Dado que o jogador realizou um depósito de "300.00"
    E o jogador realizou um saque de "100.00"
    Quando o jogador acessa a página de histórico de transações
    Então o histórico deve registrar exatamente "2" transações recentes
    E o saldo líquido das operações deve ser "200.00"
