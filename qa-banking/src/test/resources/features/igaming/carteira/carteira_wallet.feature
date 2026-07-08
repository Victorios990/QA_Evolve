# language: pt
@carteira @igaming
Funcionalidade: Gestão de Carteira (Wallet)
  Como um jogador autenticado na plataforma iGaming
  Quero gerenciar minha carteira digital
  Para depositar, sacar e acompanhar meu saldo com segurança

  Contexto:
    Dado que o jogador está autenticado no iGaming com usuário "player01" e senha "Senha@123"
    E acessa a página da carteira

  @positivo @smoke
  Cenário: Depósito via PIX com valor válido
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "200.00"
    E seleciona o método de pagamento "PIX"
    E confirma o depósito
    Então o sistema exibe a mensagem de sucesso "Depósito realizado com sucesso"
    E o saldo da carteira deve refletir o valor depositado de "200.00"

  @positivo
  Cenário: Depósito via cartão de crédito
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "500.00"
    E seleciona o método de pagamento "Cartão de Crédito"
    E confirma o depósito
    Então o sistema exibe a mensagem de sucesso "Depósito realizado com sucesso"

  @positivo @smoke
  Cenário: Saque dentro do saldo disponível
    Dado que o saldo atual da carteira é de pelo menos "100.00"
    Quando o jogador abre a aba de saque
    E informa o valor de saque "50.00"
    E confirma o saque
    Então o sistema exibe a mensagem de sucesso "Saque realizado com sucesso"
    E o saldo é decrementado em "50.00"

  @negativo
  Cenário: Tentativa de saque com saldo insuficiente
    Dado que o saldo atual da carteira é "0.00"
    Quando o jogador abre a aba de saque
    E informa o valor de saque "100.00"
    E confirma o saque
    Então o sistema exibe a mensagem de erro "Saldo insuficiente para esta operação"
    E o saldo permanece inalterado

  @negativo
  Cenário: Depósito com valor zerado
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "0.00"
    E confirma o depósito
    Então o sistema exibe a mensagem de erro "Valor inválido informado"

  @negativo
  Cenário: Saque acima do limite diário
    Quando o jogador abre a aba de saque
    E informa o valor de saque "50000.00"
    E confirma o saque
    Então o sistema exibe a mensagem de erro "Limite diário de saque excedido"

  @negativo
  Cenário: Depósito com valor negativo
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "-100.00"
    E confirma o depósito
    Então o sistema exibe a mensagem de erro "Valor inválido informado"

  @rede @resiliencia
  Cenário: Depósito com instabilidade de rede não duplica transação
    Dado que a conexão de rede está simulando instabilidade
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "100.00"
    E seleciona o método de pagamento "PIX"
    E confirma o depósito com múltiplos cliques
    Então apenas uma transação de depósito de "100.00" deve ser registrada

  @positivo @cross-browser
  Esquema do Cenário: Depósito funciona em múltiplos navegadores
    Dado que o navegador em uso é "<navegador>"
    Quando o jogador abre a aba de depósito
    E informa o valor de depósito "100.00"
    E seleciona o método de pagamento "PIX"
    E confirma o depósito
    Então o sistema exibe a mensagem de sucesso "Depósito realizado com sucesso"

    Exemplos:
      | navegador |
      | chrome    |
      | firefox   |
      | edge      |
