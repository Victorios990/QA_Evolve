---
name: Plano de Teste
about: Plano de testes para nova funcionalidade iGaming
title: "[TEST PLAN] "
labels: test-plan
assignees: ''
---

## Feature
<!-- Nome e link da especificação -->

## Escopo
<!-- O que está dentro e fora do escopo de teste -->

## Critérios de entrada
- [ ] Especificação aprovada
- [ ] Ambiente de QA disponível
- [ ] Dados de teste provisionados
- [ ] APIs documentadas (se aplicável)

## Camadas de teste

| Camada | Ferramenta | Cobertura |
|---|---|---|
| Web desktop | Cypress / Playwright | Happy path + negativos |
| Mobile browser | Cypress viewport / Playwright mobile | Responsividade |
| Mobile nativo | Appium / Maestro | Fluxo principal |
| API | Postman / k6 | Contrato + carga |
| BDD | Cucumber | Critérios de aceite |

## Cenários críticos (P0/P1)
<!-- Listar cenários de maior risco financeiro ou de experiência -->

## Critérios de saída
- [ ] 100% dos cenários P0/P1 passando
- [ ] Nenhum bug de severidade P0 ou P1 em aberto
- [ ] Testes de carga dentro dos thresholds definidos

## Riscos
<!-- Dependências externas, integrações, limitações de ambiente -->
