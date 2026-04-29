# language: pt
@transferencia @regressao
Funcionalidade: Transferência entre Contas
  Como um correntista autenticado
  Quero transferir valores entre minhas contas
  Para movimentar meu dinheiro de forma segura

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    E acessa a página de transferência de fundos

  @positivo @smoke
  Cenário: Transferência com saldo suficiente
    Quando o usuário informa o valor "100.00"
    E seleciona a conta de origem disponível
    E seleciona uma conta de destino diferente
    E confirma a transferência
    Então o sistema deve exibir mensagem de sucesso "Transfer Complete!"
    E o saldo da conta de origem deve ser decrementado em "100.00"
    E o saldo da conta de destino deve ser incrementado em "100.00"

  @positivo
  Cenário: Transferência de valor mínimo
    Quando o usuário informa o valor "0.01"
    E seleciona a conta de origem disponível
    E seleciona uma conta de destino diferente
    E confirma a transferência
    Então o sistema deve exibir mensagem de sucesso "Transfer Complete!"

  @negativo @bug
  Cenário: Tentativa de transferência com valor zerado
    # BUG-001: Parabank processa transferência de $0,00 sem exibir erro — comportamento incorreto
    Quando o usuário informa o valor "0"
    E seleciona a conta de origem disponível
    E seleciona uma conta de destino diferente
    E confirma a transferência
    Então o sistema deve exibir mensagem de erro

  @negativo @bug
  Cenário: Tentativa de transferência sem informar valor
    # BUG-002: Parabank não valida campo valor vazio antes de submeter — comportamento incorreto
    Quando o usuário não informa o valor da transferência
    E seleciona a conta de origem disponível
    E seleciona uma conta de destino diferente
    E confirma a transferência
    Então o sistema deve exibir mensagem de erro

  @banco_de_dados
  Cenário: Validação da transferência no banco de dados
    Quando o usuário informa o valor "50.00"
    E seleciona a conta de origem disponível
    E seleciona uma conta de destino diferente
    E confirma a transferência
    Então o sistema deve exibir mensagem de sucesso "Transfer Complete!"
    E a transação deve estar registrada na tabela "TRANSACTION" do banco
    E o tipo da transação deve ser "Funds Transfer Sent"
