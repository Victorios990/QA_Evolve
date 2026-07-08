# language: pt
@multitenant @igaming
Funcionalidade: Isolamento e Comportamento Multi-Tenant
  Como administrador da plataforma iGaming
  Quero garantir que cada tenant opere de forma isolada
  Para assegurar segurança dos dados e integridade entre operadores

  Contexto:
    Dado que o administrador está autenticado com usuário "admin_qa" e senha "Admin@Seguro1"
    E acessa o painel de gerenciamento de tenants

  @positivo @smoke
  Cenário: Troca de tenant exibe dados do tenant correto
    Quando o administrador seleciona o tenant "Operadora-A"
    E confirma a troca de tenant
    Então o tenant atual exibido deve ser "Operadora-A"
    E o sistema exibe a mensagem de sucesso "Tenant alternado com sucesso"

  @positivo
  Cenário: Dados de um tenant não são visíveis em outro tenant
    Dado que o administrador visualiza dados exclusivos do tenant "Operadora-A"
    Quando o administrador troca para o tenant "Operadora-B"
    Então os dados exclusivos do tenant "Operadora-A" não devem ser visíveis

  @negativo @seguranca
  Cenário: Jogador comum não pode acessar painel multi-tenant
    Dado que o usuário está autenticado como jogador com usuário "player01" e senha "Senha@123"
    Quando tenta acessar o painel de gerenciamento de tenants diretamente pela URL
    Então o sistema exibe a mensagem de acesso negado "Acesso negado"
    E o usuário não visualiza dados de outros tenants

  @negativo @seguranca
  Cenário: Token de um tenant não é válido em outro tenant
    Dado que o administrador obtém um token de sessão do tenant "Operadora-A"
    Quando tenta usar esse token para acessar recursos do tenant "Operadora-B"
    Então o sistema exibe a mensagem de acesso negado "Acesso negado"

  @positivo
  Cenário: Saldo total por tenant é calculado corretamente
    Quando o administrador seleciona o tenant "Operadora-A"
    E confirma a troca de tenant
    Então o saldo total do tenant deve ser exibido e maior que "0"

  @positivo
  Cenário: Quantidade de usuários por tenant é exibida corretamente
    Quando o administrador seleciona o tenant "Operadora-A"
    E confirma a troca de tenant
    Então a quantidade de usuários do tenant deve ser exibida

  @negativo
  Cenário: Tentativa de acesso a tenant inexistente
    Quando o administrador tenta selecionar o tenant "Tenant-Inexistente"
    Então o sistema exibe a mensagem de erro "Você não tem permissão para acessar este tenant"

  @cross-tenant @integridade
  Cenário: Transação de um tenant não afeta saldo de outro tenant
    Dado que o saldo do tenant "Operadora-A" está registrado
    Quando um jogador do tenant "Operadora-B" realiza um depósito
    Então o saldo do tenant "Operadora-A" não deve ser alterado
