# language: pt
@mobile
Funcionalidade: Login no Aplicativo Móvel
  Como usuário do aplicativo mobile
  Quero autenticar com minhas credenciais
  Para acessar os serviços disponíveis com segurança

  # App de treino: Sauce Labs My Demo App
  # Credenciais válidas: bod@example.com / 10203040
  # Download APK: https://github.com/saucelabs/my-demo-app-rn/releases

  Contexto:
    Dado que o aplicativo móvel está aberto

  @smoke @positivo
  Cenário: Login com credenciais válidas
    Quando o usuário informa o e-mail "bod@example.com" e a senha "10203040"
    E toca no botão de login
    Então a tela de produtos deve ser exibida

  @negativo
  Cenário: Login com senha incorreta
    Quando o usuário informa o e-mail "bod@example.com" e a senha "senhaErrada"
    E toca no botão de login
    Então uma mensagem de erro deve ser exibida

  @negativo
  Cenário: Login com campos em branco
    Quando o usuário não preenche as credenciais
    E toca no botão de login
    Então uma mensagem de erro de campos obrigatórios deve ser exibida

  @positivo
  Cenário: Navegar pela lista de itens após login
    Quando o usuário informa o e-mail "bod@example.com" e a senha "10203040"
    E toca no botão de login
    Então a tela de produtos deve ser exibida
    E deve ser possível rolar a lista de produtos
