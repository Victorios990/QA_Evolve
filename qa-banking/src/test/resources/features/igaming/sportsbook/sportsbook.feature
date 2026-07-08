# language: pt
@sportsbook @igaming
Funcionalidade: Apostas Esportivas (Sportsbook)
  Como um jogador autenticado na plataforma iGaming
  Quero realizar apostas em eventos esportivos
  Para participar dos mercados disponíveis com segurança e rastreabilidade

  Contexto:
    Dado que o jogador está autenticado no iGaming com usuário "player01" e senha "Senha@123"
    E acessa a página de apostas esportivas

  @positivo @smoke
  Cenário: Realizar aposta em evento disponível
    Quando o jogador pesquisa pelo evento "Flamengo x Palmeiras"
    E seleciona o primeiro evento da lista
    E informa o valor da aposta "25.00"
    E confirma a aposta
    Então o sistema exibe a mensagem de sucesso "Aposta registrada com sucesso"

  @positivo
  Cenário: Cancelar aposta aberta
    Dado que o jogador possui uma aposta aberta registrada
    Quando o jogador acessa suas apostas abertas
    E seleciona a primeira aposta aberta
    E cancela a aposta
    Então o sistema exibe a mensagem de sucesso "Aposta cancelada com sucesso"

  @positivo
  Cenário: Verificar odds antes de apostar
    Quando o jogador pesquisa pelo evento "Corinthians x São Paulo"
    E seleciona o primeiro evento da lista
    Então as odds do evento devem ser exibidas e maiores que "1.00"

  @negativo
  Cenário: Tentativa de aposta com saldo insuficiente
    Dado que o saldo atual da carteira é "0.00"
    Quando o jogador pesquisa pelo evento "Flamengo x Palmeiras"
    E seleciona o primeiro evento da lista
    E informa o valor da aposta "100.00"
    E confirma a aposta
    Então o sistema exibe a mensagem de erro "Saldo insuficiente para esta operação"

  @negativo
  Cenário: Tentativa de aposta abaixo do valor mínimo
    Quando o jogador pesquisa pelo evento "Flamengo x Palmeiras"
    E seleciona o primeiro evento da lista
    E informa o valor da aposta "0.01"
    E confirma a aposta
    Então o sistema exibe a mensagem de erro "Valor abaixo do mínimo permitido para apostas"

  @negativo
  Cenário: Tentativa de aposta acima do valor máximo permitido
    Quando o jogador pesquisa pelo evento "Flamengo x Palmeiras"
    E seleciona o primeiro evento da lista
    E informa o valor da aposta "999999.00"
    E confirma a aposta
    Então o sistema exibe a mensagem de erro "Valor acima do máximo permitido para apostas"

  @negativo
  Cenário: Evento encerrado não permite novas apostas
    Quando o jogador pesquisa por um evento já encerrado
    Então o sistema indica que o evento não está disponível para apostas

  @positivo
  Cenário: Alerta de mudança de odds durante preenchimento
    Quando o jogador pesquisa pelo evento "Brasil x Argentina"
    E seleciona o primeiro evento da lista
    E as odds são alteradas pelo sistema enquanto o jogador preenche o valor
    Então o sistema exibe alerta de que as odds foram alteradas

  @positivo @smoke
  Cenário: Aposta liquidada aparece no histórico
    Dado que o jogador possui uma aposta liquidada
    Quando o jogador acessa a página de histórico de transações
    E filtra por tipo "Aposta"
    E aplica os filtros
    Então a aposta liquidada deve aparecer no histórico
