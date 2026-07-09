# Matriz de Priorização de Bugs — iGaming

## Critérios

| Critério | Peso |
|---|---|
| **Impacto financeiro** — envolve saldo, depósito, saque, aposta | Alto |
| **Frequência de uso** — fluxo executado por muitos usuários/sessões | Alto |
| **Visibilidade** — erro visível ao jogador na UI | Médio |
| **Risco regulatório** — viola LGPD, limites ou isolamento de dados | Alto |
| **Dificuldade de reprodução** — intermitente vs. consistente | Médio |

---

## Classificação de Severidade

| Severidade | Definição | Exemplo iGaming |
|---|---|---|
| **Crítico (S1)** | Sistema indisponível ou perda de dados financeiros | Depósito debitado mas saldo não atualiza |
| **Alto (S2)** | Fluxo principal bloqueado, impacto financeiro direto | Saque não processa; aposta aceita com saldo zero |
| **Médio (S3)** | Fluxo alternativo afetado ou exibição incorreta | Filtro de histórico retorna dados errados |
| **Baixo (S4)** | Problema cosmético ou de usabilidade | Label de botão incorreta; alinhamento de layout |

---

## Matriz Impacto × Probabilidade

```
         │  BAIXO impacto  │  MÉDIO impacto  │  ALTO impacto
─────────┼─────────────────┼─────────────────┼──────────────────
ALTA     │     P3          │      P2          │     P1 🔴
probab.  │  Monitorar      │  Corrigir sprint │  Corrigir agora
─────────┼─────────────────┼─────────────────┼──────────────────
MÉDIA    │     P4          │      P3          │     P2 🟠
probab.  │  Backlog        │  Monitorar       │  Próximo sprint
─────────┼─────────────────┼─────────────────┼──────────────────
BAIXA    │     P4          │      P4          │     P3 🟡
probab.  │  Won't fix      │  Backlog         │  Backlog
```

---

## Aplicação prática — fluxos iGaming

| Fluxo | Prioridade padrão de bug | Justificativa |
|---|---|---|
| Depósito / Saque | **P1 automático** | Impacto financeiro direto; retenção de jogador |
| Saldo incorreto na UI | **P1** | Gera desconfiança e disputa de crédito |
| Aposta aceita sem saldo | **P1** | Fraude / prejuízo operacional |
| Isolamento multi-tenant | **P1** | Risco regulatório e de dados |
| Mudança de odds não exibida | **P2** | Pode gerar apostas com odds erradas |
| Histórico com dado errado | **P2** | Disputa de transação |
| Filtro de data incorreto | **P3** | Relatório errado, sem impacto imediato |
| Layout quebrado no mobile | **P3** | UX afetada, sem perda financeira |
| Texto de label incorreto | **P4** | Cosmético |

---

## Fluxo de triagem de bugs

```
Bug reportado
     │
     ▼
Afeta saldo / transação financeira?
     │ SIM → P1 → Notificar dev + QA Lead imediatamente
     │ NÃO
     ▼
Bloqueia fluxo principal (login, apostar, sacar)?
     │ SIM → P2 → Corrigir no sprint atual
     │ NÃO
     ▼
Afeta experiência do usuário de forma perceptível?
     │ SIM → P3 → Backlog priorizado
     │ NÃO → P4 → Backlog normal
```

---

## Critério de bloqueio de release

Qualquer **P1 aberto** → **BLOQUEIA** o deploy em produção.
Mais de 2 **P2 abertos** → requer aprovação do PO para prosseguir.

---

*Referência: Risk-Based Testing (ISTQB) + critérios de aceitação iGaming*
