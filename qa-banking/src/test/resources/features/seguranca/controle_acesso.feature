# language: pt
@seguranca @regressao @alto_risco
Funcionalidade: Controle de Acesso e Segurança da Aplicação
  Como uma instituição financeira regulada
  Queremos garantir que acessos não autorizados sejam impedidos
  Para proteger dados dos clientes e atender requisitos de LGPD, BACEN e SUSEP

  @seguranca @autorizacao @P1 @smoke
  Cenário: Acesso negado a área protegida sem autenticação ativa
    Dado que nenhuma sessão está ativa no navegador
    Quando um usuário não autenticado tenta acessar a URL protegida de contas
    Então o sistema deve redirecionar para a página de login
    E nenhum dado sensível deve ser exposto

  @seguranca @logout @P1
  Cenário: Sessão invalidada após logout explícito do usuário
    Dado que o usuário está autenticado com usuário "john" e senha "demo"
    Quando o usuário realiza logout pelo menu
    E tenta acessar a URL protegida de contas sem autenticação
    Então o sistema deve redirecionar para a página de login

  @seguranca @injecao @P1 @fraude @alto_risco
  Cenário: Resistência a injeção SQL no formulário de autenticação
    # Critério de aceite: credenciais com metacaracteres SQL devem ser tratadas
    # como texto literal — jamais interpretadas pelo banco de dados
    Dado que o usuário está na página de login
    Quando o usuário informa o usuário "' OR '1'='1" e a senha "' OR '1'='1"
    E clica no botão "Entrar"
    Então o acesso não deve ser concedido com credencial inválida
    E o sistema deve retornar mensagem de erro padrão

  @seguranca @xss @P2 @alto_risco
  Cenário: Resistência a Cross-Site Scripting no formulário de registro
    # Critério de aceite: qualquer script inserido em campo de formulário deve ser
    # sanitizado ou rejeitado — nunca executado pelo navegador
    Dado que o usuário está na página de registro
    Quando o usuário submete o formulário com payload de script malicioso no campo nome
    Então o sistema não deve executar o script injetado
    E o payload não deve ser refletido sem sanitização na página

  @seguranca @duplicidade @P1 @lgpd
  Cenário: Sistema bloqueia cadastro com username já registrado
    # Critério de aceite: o sistema não pode permitir dois usuários com mesmo login
    # Impacto: violação de integridade e possível bypass de autenticação
    Dado que o usuário está na página de registro
    Quando o usuário tenta se registrar com o username já existente "john"
    Então o sistema deve rejeitar o cadastro duplicado
    E deve exibir mensagem de conflito de username

  @seguranca @login_negativo @P1 @esquema
  Esquema do Cenário: Rejeição de múltiplas combinações de credenciais inválidas
    # Data-driven: garante que nenhuma variação comum de ataque obtenha acesso
    Dado que o usuário está na página de login
    Quando o usuário informa o usuário "<usuario>" e a senha "<senha>"
    E clica no botão "Entrar"
    Então o acesso não deve ser concedido com credencial inválida

    Exemplos:
      | usuario              | senha          |
      | john                 | senhaErrada    |
      | usuarioInexistente   | demo           |
      | admin                | admin          |
      | ' OR '1'='1          | qualquerCoisa  |
      | john@dominio.com     | demo           |
