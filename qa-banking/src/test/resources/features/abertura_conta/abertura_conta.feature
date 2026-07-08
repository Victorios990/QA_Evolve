# language: pt
@abertura_conta @regressao
Funcionalidade: Abertura de Nova Conta Bancária
  Como um correntista autenticado
  Quero abrir novos produtos bancários no internet banking
  Para diversificar minha gestão financeira sem precisar ir a uma agência

  Contexto:
    Dado que o usuário está autenticado com usuário "john" e senha "demo"

  @abertura_conta @positivo @smoke @P1
  Cenário: Abertura de conta corrente com sucesso
    # Fluxo principal — critério de aceite: número de conta exibido imediatamente
    Quando acessa a tela de abertura de nova conta
    E escolhe o tipo de conta "CHECKING"
    E confirma a abertura da conta bancária
    Então a conta bancária deve ser criada com sucesso
    E o número identificador da nova conta deve ser exibido

  @abertura_conta @positivo @P1
  Cenário: Abertura de conta poupança com rendimento
    Quando acessa a tela de abertura de nova conta
    E escolhe o tipo de conta "SAVINGS"
    E confirma a abertura da conta bancária
    Então a conta bancária deve ser criada com sucesso
    E o número identificador da nova conta deve ser exibido

  @abertura_conta @positivo @P1
  Cenário: Nova conta aparece no painel de contas do cliente
    Quando acessa a tela de abertura de nova conta
    E escolhe o tipo de conta "SAVINGS"
    E confirma a abertura da conta bancária
    Então a conta bancária deve ser criada com sucesso
    E a nova conta deve constar no painel de contas do cliente

  @abertura_conta @banco_de_dados @P1 @auditoria
  Cenário: Abertura de conta registrada no banco de dados
    # Critério de aceite: toda abertura de conta deve gerar registro imediato no BD
    # Essencial para auditoria regulatória e consistência sistêmica
    Quando acessa a tela de abertura de nova conta
    E escolhe o tipo de conta "SAVINGS"
    E confirma a abertura da conta bancária
    Então a conta bancária deve ser criada com sucesso
    E a abertura de conta deve estar registrada no banco de dados

  @abertura_conta @negativo @P2 @edge_case
  Cenário: Bloqueio de abertura sem conta de origem disponível
    # Regra de negócio: abertura de conta derivada exige conta corrente de origem
    # Documentado para validação em ambiente controlado (usuário sem conta prévia)
    Dado que não há conta de origem para o usuário corrente
    Quando acessa a tela de abertura de nova conta
    Então o sistema deve bloquear a abertura de conta sem conta de origem

  @abertura_conta @esquema @positivo @P2
  Esquema do Cenário: Abertura de diferentes tipos de conta
    Quando acessa a tela de abertura de nova conta
    E escolhe o tipo de conta "<tipo_conta>"
    E confirma a abertura da conta bancária
    Então a conta bancária deve ser criada com sucesso
    E o número identificador da nova conta deve ser exibido

    Exemplos:
      | tipo_conta |
      | CHECKING   |
      | SAVINGS    |

  @abertura_conta @banco_de_dados @consistencia @P2
  Cenário: Consistência entre contas na interface e banco de dados
    # Critério de aceite: dados exibidos na UI devem refletir exatamente o banco
    Quando o usuário acessa o painel de contas
    Então a quantidade de contas exibidas deve ser igual ao total no banco
    E cada conta deve ter registro correspondente no banco de dados
