---
name: 📋 Plano de Testes
about: Documenta o plano de testes para uma nova funcionalidade ou mudança
title: "[TEST PLAN] "
labels: test-plan, in-progress
assignees: ''
---

## Funcionalidade
<!-- Nome e descrição da funcionalidade a ser testada -->

## Objetivo
<!-- O que queremos validar com este plano de testes -->

## Escopo

### Inclui
- [ ]
- [ ]

### Exclui
- [ ]

## Critérios de Aceite
<!-- Critérios que definem que a funcionalidade está pronta para produção -->
- [ ] CA-01:
- [ ] CA-02:
- [ ] CA-03:

## Ambiente e Dados de Teste
| Campo              | Valor                          |
|--------------------|-------------------------------|
| **Ambiente**       | QA / Staging                  |
| **Tenant**         |                               |
| **Usuário(s)**     |                               |
| **Dados especiais**|                               |

## Estratégia de Testes

### Testes Funcionais
| ID    | Cenário                     | Tipo       | Prioridade | Automatizado |
|-------|-----------------------------|------------|------------|--------------|
| TC-01 |                             | Positivo   | Alta       | ✅ / ❌      |
| TC-02 |                             | Negativo   | Média      | ✅ / ❌      |
| TC-03 |                             | Borda      | Baixa      | ✅ / ❌      |

### Testes Não-Funcionais
- [ ] **Cross-browser**: Chrome, Firefox, Edge
- [ ] **Responsividade**: Desktop, Tablet, Mobile
- [ ] **Performance**: Tempo de resposta < 3s para operações críticas
- [ ] **Segurança**: Validação de autenticação e autorização
- [ ] **Resiliência**: Comportamento com instabilidade de rede

### Testes de Regressão
<!-- Cenários existentes que devem ser re-executados para garantir ausência de regressão -->
- [ ] Login e autenticação
- [ ] Fluxo de carteira (depósito/saque)
- [ ] Sportsbook (aposta/cancelamento)
- [ ] Histórico de transações
- [ ] Isolamento multi-tenant

## Riscos Identificados
| Risco                              | Probabilidade | Impacto | Mitigação             |
|------------------------------------|---------------|---------|-----------------------|
|                                    | Alta/Média/Baixa | Alto/Médio/Baixo |                |

## Dependências
<!-- Outras equipes, serviços ou dados necessários para executar os testes -->
- [ ]

## Critérios de Conclusão
- [ ] 100% dos casos de teste de prioridade Alta executados
- [ ] 0 bugs críticos ou altos abertos
- [ ] Cobertura de automação >= 80% nos fluxos de smoke
- [ ] Relatório de testes gerado e revisado

## Cronograma
| Etapa                         | Início     | Fim        | Responsável |
|-------------------------------|-----------|------------|-------------|
| Elaboração do plano           |           |            |             |
| Execução dos testes manuais   |           |            |             |
| Automação dos cenários críticos|          |            |             |
| Revisão e sign-off            |           |            |             |

---
**QA Responsável:** <!-- Seu nome -->
**Sprint/Release:**
