# language: pt
@auditoria @banco_de_dados @regulatorio @alto_risco
Funcionalidade: Rastreabilidade e Auditoria de Operações Financeiras
  Como uma instituição financeira regulada pela BACEN e SUSEP
  Queremos garantir rastreabilidade completa de todas as operações sensíveis
  Para atender requisitos regulatórios e suportar investigações de causa-raiz

  @auditoria @cobertura @P1 @smoke
  Cenário: Toda transação financeira possui trilha de auditoria
    # Critério regulatório: 100% das transações devem ter registro de auditoria
    # Ausência de auditoria é não-conformidade BACEN — risco crítico em produção
    Dado que o banco de dados está disponível
    Quando analiso a cobertura de auditoria de transações financeiras
    Então não deve haver transação financeira sem trilha de auditoria

  @auditoria @integridade @P1
  Cenário: Toda conta bancária está vinculada a um cliente
    # Integridade referencial: conta sem dono gera risco de dados zumbis
    # e dificulta resposta a incidentes de acesso indevido
    Dado que o banco de dados está disponível
    Quando analiso a integridade referencial do modelo de dados
    Então não deve haver conta bancária sem cliente associado

  @auditoria @saldo @P1 @fraude
  Cenário: Nenhuma conta padrão possui saldo negativo não autorizado
    # Regra de negócio: apenas contas com limite de crédito aprovado
    # podem ter saldo negativo — demais contas devem ter saldo >= 0
    Dado que o banco de dados está disponível
    Quando analiso contas com saldo negativo não autorizado
    Então nenhuma conta padrão deve ter saldo negativo

  @auditoria @integridade @P1
  Cenário: Toda transação referencia conta de origem existente
    # Integridade referencial: transação sem conta válida indica
    # possível corrupção de dados ou falha no processo de exclusão
    Dado que o banco de dados está disponível
    Quando analiso a cadeia de transações registradas
    Então toda transação deve ter sua conta de origem válida

  @auditoria @lgpd @P1 @regulatorio
  Cenário: Documentos de identificação são únicos na base de clientes
    # Requisito LGPD + Regulatório: CPF duplicado indica falha de validação
    # e pode caracterizar cadastro fraudulento ou erro sistêmico grave
    Dado que o banco de dados está disponível
    Quando analiso a unicidade de documentos de identificação na base
    Então não deve haver CPF registrado mais de uma vez

  @auditoria @rca @P1 @fraude @alto_risco
  Cenário: Detecção de padrão de double-submission em transações
    # RCA — pré-mortem baseado no incidente INC-2024-047:
    # duplo clique / instabilidade de rede pode gerar transações duplicadas
    # Detector preemptivo para prevenir reincidência em produção
    Dado que o banco de dados está disponível
    Quando analiso o padrão de double-submission em transações
    Então não deve haver par de transações com dados idênticos no mesmo instante

  @auditoria @lgpd @P1 @regulatorio
  Cenário: Dados pessoais de clientes inativos anonimizados conforme LGPD
    # Art. 16 LGPD: dados devem ser eliminados ou anonimizados
    # após o término do tratamento ou quando o titular solicitar
    Dado que o banco de dados está disponível
    Quando analiso os dados pessoais de clientes sem movimentação há 5 anos
    Então os dados pessoais sensíveis devem estar anonimizados conforme LGPD

  @auditoria @consistencia @P2
  Cenário: Consistência matemática entre transações e saldo de conta
    # Validação contábil: saldo atual deve ser resultado das transações históricas
    # Inconsistência indica possível falha no processamento ou manipulação de dados
    Dado que o banco de dados está disponível
    Quando analiso a consistência matemática de saldos
    Então a soma de débitos e créditos deve equilibrar o saldo de cada conta
