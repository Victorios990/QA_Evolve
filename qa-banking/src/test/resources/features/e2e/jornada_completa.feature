# language: pt
@e2e
Funcionalidade: Jornada Completa do Correntista
  Como um novo cliente do banco
  Quero realizar todas as operações bancárias essenciais
  Para validar o fluxo completo de ponta a ponta do sistema

  @e2e @smoke
  Cenário: Jornada completa — do registro ao logout
    # ── ETAPA 1: Registro de novo usuário ──────────────────────────
    Dado que um novo usuário acessa a página de registro
    Quando preenche o formulário com dados válidos gerados automaticamente
    E submete o formulário de registro
    Então o registro deve ser concluído com sucesso
    E o novo usuário deve estar autenticado automaticamente

    # ── ETAPA 2: Visão geral das contas ────────────────────────────
    Quando navega para a visão geral de contas
    Então pelo menos uma conta deve estar visível no painel

    # ── ETAPA 3: Abertura de nova conta ────────────────────────────
    Quando abre uma nova conta do tipo "SAVINGS"
    Então a nova conta de poupança deve ser criada com sucesso
    E o número da nova conta deve ser exibido

    # ── ETAPA 4: Transferência entre contas ────────────────────────
    Quando realiza uma transferência de "50.00" entre as contas disponíveis
    Então a transferência deve ser registrada com sucesso

    # ── ETAPA 5: Consulta de extrato ───────────────────────────────
    Quando consulta o extrato de uma conta
    Então o extrato deve ser exibido com as movimentações

    # ── ETAPA 6: Pagamento de boleto ───────────────────────────────
    Quando realiza o pagamento de um boleto de "25.00"
    Então o pagamento deve ser confirmado com sucesso

    # ── ETAPA 7: Logout ────────────────────────────────────────────
    Quando realiza o logout
    Então deve ser redirecionado para a página de login
    E não deve ter acesso às páginas protegidas
