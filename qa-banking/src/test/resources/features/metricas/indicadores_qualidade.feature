# language: pt
@metricas @qualidade @banco_de_dados
Funcionalidade: Indicadores de Qualidade do Sistema Bancário
  Como QA Engineer estratégico
  Quero monitorar KPIs de saúde do sistema via banco de dados
  Para detectar degradação antes que afete clientes — e embasar decisões com dados

  @metricas @transacoes @P1 @smoke
  Cenário: Taxa de sucesso de transações acima do SLA definido
    # KPI de confiabilidade: meta = 95% de transações sem erro
    # Queda abaixo disso aciona alerta de incidente e análise de causa-raiz
    Dado que o banco de dados está disponível
    Quando calculo a taxa de sucesso das transações no período
    Então a taxa de sucesso de transações deve ser superior a 95%

  @metricas @cadastro @P2
  Cenário: Dados cadastrais de clientes estão completos
    # KPI de qualidade de dados: cadastros incompletos geram falhas operacionais
    # e não conformidades regulatórias (KYC / BACEN / SUSEP)
    Dado que o banco de dados está disponível
    Quando avalio a completude dos dados cadastrais de clientes
    Então todos os cadastros devem estar completos

  @metricas @contas @P2
  Cenário: Cada cliente possui ao menos uma conta ativa
    # Regra de negócio: cliente ativo sem conta é inconsistência sistêmica
    # que impede operações e gera suporte desnecessário
    Dado que o banco de dados está disponível
    Quando verifico se cada cliente possui conta ativa
    Então nenhum cliente ativo deve estar sem conta

  @metricas @volume @P3
  Cenário: Volume mínimo de dados disponível para execução dos testes
    # Health check de ambiente: valida que os dados de referência existem
    # antes de executar a suíte completa de testes funcionais
    Dado que o banco de dados está disponível
    Quando verifico os volumes mínimos de dados de teste
    Então devem existir ao menos 1 clientes cadastrados
    E devem existir ao menos 1 contas ativas
    E devem existir ao menos 1 transações registradas

  @metricas @auditoria @P1 @regulatorio
  Cenário: Cobertura de auditoria atinge 100% das transações
    # KPI regulatório: meta não-negociável de cobertura total de auditoria
    # Monitorado a cada deploy para prevenir regressão na trilha de auditoria
    Dado que o banco de dados está disponível
    Quando calculo a cobertura de trilha de auditoria
    Então 100% das transações devem ter trilha de auditoria

  @metricas @integridade @P2
  Cenário: Ausência de registros órfãos nas tabelas principais
    # KPI de integridade referencial: órfãos indicam falha em cascade delete
    # ou bug em processo de exclusão/migração
    Dado que o banco de dados está disponível
    Quando verifico a existência de registros órfãos
    Então não deve haver registros órfãos nas tabelas principais
