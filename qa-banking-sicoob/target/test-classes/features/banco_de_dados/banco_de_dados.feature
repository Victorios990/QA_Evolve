# language: pt
@banco_de_dados @sql
Funcionalidade: Validações de Banco de Dados (SQL / DB2)
  Como analista de QA
  Quero validar a integridade dos dados no banco
  Para garantir que as regras de negócio bancário estão sendo aplicadas corretamente

  @positivo
  Cenário: Verificar integridade referencial entre conta e cliente
    Dado que o banco de dados está disponível
    Quando executo a query de validação de integridade referencial de contas
    Então não deve existir conta sem cliente associado

  @positivo
  Cenário: Verificar saldo negativo indevido
    Dado que o banco de dados está disponível
    Quando executo a query de verificação de saldo negativo
    Então não deve existir conta com saldo negativo sem ser conta especial

  @positivo
  Cenário: Verificar consistência de transações
    Dado que o banco de dados está disponível
    Quando executo a query de consistência de transações
    Então toda transação deve ter conta de origem válida

  @positivo
  Cenário: Contar total de clientes ativos
    Dado que o banco de dados está disponível
    Quando executo a contagem de clientes ativos
    Então o resultado deve ser maior que zero

  @positivo
  Cenário: Verificar duplicidade de CPF
    Dado que o banco de dados está disponível
    Quando executo a query de verificação de duplicidade de CPF
    Então não deve existir CPF duplicado na base de clientes

  @auditoria
  Cenário: Verificar transações sem registro de auditoria
    Dado que o banco de dados está disponível
    Quando executo a query de auditoria de transações
    Então toda transação deve ter registro de auditoria correspondente
