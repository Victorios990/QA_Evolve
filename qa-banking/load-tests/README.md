# Testes de Carga — iGaming

## Instalação

```bash
# Mac
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo apt install k6
```

## Estrutura

```
load-tests/
  k6/
    config.js           → URL base, thresholds, credenciais (variáveis de ambiente)
    helpers.js          → Funções reutilizáveis: login, depósito, aposta, etc.
    carteira_load.js    → Carga específica de Wallet (depósito, saque, saldo)
    sportsbook_load.js  → Carga de Sportsbook (listagem de eventos + apostas)
    multi_tenant_load.js→ Isolamento multi-tenant sob carga cruzada
    full_suite.js       → Suite completa com todos os cenários
  results/              → Relatórios JSON gerados após execução
```

## Execução

### Por módulo

```bash
# Carteira
k6 run load-tests/k6/carteira_load.js

# Sportsbook
k6 run load-tests/k6/sportsbook_load.js

# Multi-tenant
k6 run load-tests/k6/multi_tenant_load.js
```

### Suite completa — cenário específico

```bash
# Smoke (padrão — valida que o ambiente está de pé)
k6 run --env SCENARIO=smoke load-tests/k6/full_suite.js

# Carga normal
k6 run --env SCENARIO=load load-tests/k6/full_suite.js

# Stress (encontra ponto de ruptura)
k6 run --env SCENARIO=stress load-tests/k6/full_suite.js

# Spike (final de campeonato: 0 → 500 usuários em 5s)
k6 run --env SCENARIO=spike load-tests/k6/full_suite.js

# Soak (30 minutos com carga moderada — detecta memory leak)
k6 run --env SCENARIO=soak load-tests/k6/full_suite.js

# Todos os cenários em sequência
k6 run load-tests/k6/full_suite.js
```

### Com URL e credenciais configuráveis

```bash
k6 run \
  --env BASE_URL=https://igaming-qa.example.com \
  --env IGAMING_USER=player01 \
  --env IGAMING_PASS=Senha@123 \
  --env SCENARIO=load \
  load-tests/k6/full_suite.js
```

## Cenários e o que cada um valida

| Cenário | VUs | Duração | Objetivo |
|---------|-----|---------|----------|
| **Smoke** | 2 | 30s | Sistema responde com carga mínima |
| **Load** | até 100 | 5m | Comportamento em operação normal |
| **Stress** | até 600 | 10m | Ponto de ruptura e recuperação |
| **Spike** | 0→500→0 | ~1m | Final de campeonato / pico súbito |
| **Soak** | 50 | 30m | Memory leaks, degradação gradual |

## Thresholds (critérios de sucesso)

| Métrica | Limite |
|---------|--------|
| p(95) de todas as requisições | < 2000ms |
| p(99) de operações críticas | < 5000ms |
| Taxa de erros HTTP | < 1% |
| Taxa de sucesso dos checks | > 99% |
| Taxa de sucesso de depósitos | > 98% |
| Taxa de sucesso de apostas | > 98% |
| Isolamento multi-tenant | > 99.9% |

## Relatórios

Os resultados são salvos automaticamente em `load-tests/results/` após cada execução:
- `carteira_summary.json`
- `sportsbook_summary.json`
- `multi_tenant_summary.json`
- `full_suite_summary.json`
