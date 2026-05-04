# language: pt
@login @regressao
Funcionalidade: Login no Sistema Bancário
  Como um correntista do banco
  Quero realizar login no internet banking
  Para ter acesso às minhas contas e serviços financeiros

  Contexto:
    Dado que o usuário está na página de login

  @positivo @smoke
  Cenário: Login com credenciais válidas
    Quando o usuário informa o usuário "john" e a senha "demo"
    E clica no botão "Entrar"
    Então o sistema deve exibir a mensagem de boas-vindas
    E o usuário deve ser redirecionado para o painel de contas

  @negativo
  Cenário: Login com senha incorreta
    Quando o usuário informa o usuário "john" e a senha "senhaErrada"
    E clica no botão "Entrar"
    Então o sistema deve exibir a mensagem de erro "The username and password could not be verified."

  @negativo
  Cenário: Login com usuário em branco
    Quando o usuário informa o usuário "" e a senha "demo"
    E clica no botão "Entrar"
    Então o sistema deve exibir mensagem de erro de validação

  @negativo
  Cenário: Login com ambos os campos em branco
    Quando o usuário informa o usuário "" e a senha ""
    E clica no botão "Entrar"
    Então o sistema deve exibir mensagem de erro de validação

  @esquema @negativo
  Esquema do Cenário: Login com múltiplas combinações inválidas
    Quando o usuário informa o usuário "<usuario>" e a senha "<senha>"
    E clica no botão "Entrar"
    Então o sistema deve exibir a mensagem de erro "<mensagem>"

    Exemplos:
      | usuario       | senha       | mensagem                                              |
      | usuarioErrado | demo        | The username and password could not be verified.      |
      | john          | 12345       | The username and password could not be verified.      |
      | sql_injection  | invalid123  | The username and password could not be verified.      |
