# Registro de Defeitos — Demo iGaming

Defeitos encontrados durante a execução da suite Cypress em **2026-07-09** contra `demo-igaming localhost:3000`.

**Resultado da execução:** 54 testes | 53 passando | 1 falhando  
**Relatório Mochawesome:** `cypress/reports/index.html`  
**Vídeos:** `cypress/reports/videos/`  
**Screenshots:** `cypress/reports/screenshots/`

---

## Resumo

| ID       | Título                                              | Severidade | Prioridade | Módulo          | Status  |
|----------|-----------------------------------------------------|------------|------------|-----------------|---------|
| BUG-001  | Prioridade incorreta de validação no saque          | Alta       | P1         | Carteira        | Aberto  |
| BUG-002  | JWT sem assinatura permite escalação de privilégio  | **Crítica**| **P0**     | Autenticação    | Aberto  |
| BUG-003  | Ausência de rate limiting no endpoint de login      | Alta       | P1         | Autenticação    | Aberto  |
| BUG-004  | Export CSV ignora parâmetros de filtro              | Média      | P2         | Histórico       | Aberto  |
| BUG-005  | Saque registrado com valor positivo no histórico    | Média      | P2         | Histórico       | Aberto  |
| BUG-006  | Apostas permanecem em estado "Aberta" indefinidamente| Alta      | P1         | Sportsbook      | Aberto  |

---

## Detalhamento

### BUG-001 — Prioridade incorreta de validação no saque
- **Evidência:** 3 screenshots do Cypress em `cypress/reports/screenshots/carteira.cy.js/`
- **Teste que falha:** `CT-W09 | Saque acima do limite diário é bloqueado`
- **Arquivo:** [BUG-001-prioridade-validacao-saque.md](./BUG-001-prioridade-validacao-saque.md)

### BUG-002 — JWT sem assinatura HMAC (Privilege Escalation)
- **Evidência:** Output de terminal demonstrando token forjado acessando endpoint admin
- **CWE:** CWE-347 | **OWASP:** A07:2021
- **Arquivo:** [BUG-002-jwt-sem-assinatura-escalacao-privilegio.md](./BUG-002-jwt-sem-assinatura-escalacao-privilegio.md)

### BUG-003 — Ausência de rate limiting (Brute Force)
- **Evidência:** 20 tentativas de login inválidas sem receber HTTP 429
- **CWE:** CWE-307 | **OWASP:** A07:2021
- **Arquivo:** [BUG-003-ausencia-rate-limiting-autenticacao.md](./BUG-003-ausencia-rate-limiting-autenticacao.md)

### BUG-004 — Export CSV ignora filtros
- **Evidência:** 10 linhas "Saque" no CSV exportado com filtro `type=Depósito`
- **Arquivo:** [BUG-004-export-csv-ignora-filtros.md](./BUG-004-export-csv-ignora-filtros.md)

### BUG-005 — Saque com valor positivo no histórico
- **Evidência:** API retorna `amount: 50` para saque de R$50 (deveria ser negativo ou sinalizado)
- **Arquivo:** [BUG-005-saldo-saque-positivo-historico.md](./BUG-005-saldo-saque-positivo-historico.md)

### BUG-006 — Apostas nunca liquidadas
- **Evidência:** Endpoint `POST /api/sportsbook/bets/:id/settle` inexistente (404)
- **Arquivo:** [BUG-006-apostas-nunca-liquidadas.md](./BUG-006-apostas-nunca-liquidadas.md)

---

## Priorização de Correção

```
P0 — CRÍTICO (corrigir imediatamente)
  └── BUG-002: JWT forgery → escalação de privilégio

P1 — ALTO (sprint atual)
  ├── BUG-001: Mensagem errada no limite diário de saque
  ├── BUG-003: Sem rate limiting = brute force possível
  └── BUG-006: Apostas não liquidadas = fluxo financeiro incompleto

P2 — MÉDIO (próximo sprint)
  ├── BUG-004: Export CSV sem filtros = relatórios incorretos
  └── BUG-005: Histórico sem sinal de débito = conciliação prejudicada
```

---

## Como Gerar o Relatório

```bash
# 1. Iniciar o servidor demo
cd demo-igaming && node server.js &

# 2. Executar todos os testes iGaming
cd qa-banking && npx cypress run --spec 'cypress/e2e/igaming/**/*.cy.js'

# 3. Abrir o relatório HTML
open cypress/reports/index.html
```
