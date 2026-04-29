# Técnicas de Análise de Testes — Sistema Bancário

## 1. Partição de Equivalência

Divide as entradas em grupos onde o comportamento do sistema é equivalente.

### Exemplo — Campo Valor de Transferência

| Classe           | Intervalo         | Exemplos       | Resultado    |
|------------------|-------------------|----------------|--------------|
| Inválida (-neg)  | valor < 0         | -1, -100       | Erro         |
| Inválida (zero)  | valor = 0         | 0              | Erro         |
| Válida           | 0 < valor ≤ saldo | 0.01, 50, 100  | Sucesso      |
| Inválida (>saldo)| valor > saldo     | saldo + 1      | Erro: saldo  |

---

## 2. Análise de Valor Limite (BVA)

Testa os valores exatos nas bordas das partições, onde bugs costumam ocorrer.

### Exemplo — Limite de senha (8 a 20 caracteres)

| Valor | Situação         | Esperado  |
|-------|------------------|-----------|
| 7     | abaixo do mínimo | Inválido  |
| 8     | mínimo exato     | Válido    |
| 9     | mínimo + 1       | Válido    |
| 19    | máximo - 1       | Válido    |
| 20    | máximo exato     | Válido    |
| 21    | acima do máximo  | Inválido  |

---

## 3. Tabela de Decisão

Mapeia combinações de condições e suas ações. Ideal para regras de negócio complexas.

### Exemplo — Aprovação de empréstimo

| Condição                   | R1  | R2  | R3  | R4  |
|----------------------------|:---:|:---:|:---:|:---:|
| Score ≥ 700                | S   | S   | N   | N   |
| Renda ≥ 3x parcela         | S   | N   | S   | N   |
| Sem restrição no CPF       | S   | S   | S   | N   |
| **Resultado**              |     |     |     |     |
| Empréstimo aprovado        | ✓   |     |     |     |
| Aprovado com juros maiores |     | ✓   | ✓   |     |
| Reprovado                  |     |     |     | ✓   |

---

## 4. Transição de Estados

Descreve como o sistema transita entre estados. Essencial para contas bancárias.

### Estados de uma conta bancária

```
[NOVA] --ativação--> [ATIVA] --bloqueio--> [BLOQUEADA]
                        |                       |
                    encerramento            desbloqueio
                        |                       |
                    [ENCERRADA]           [ATIVA]
```

### Tabela de Transições

| Estado Atual | Evento           | Estado Novo  | Ação              |
|--------------|------------------|--------------|-------------------|
| Nova         | Cliente aprovado | Ativa        | Habilitar ops     |
| Ativa        | 3 tentativas fail| Bloqueada    | Notificar cliente |
| Bloqueada    | Solicitação unlock| Ativa       | Registrar auditoria|
| Ativa        | Encerramento     | Encerrada    | Bloquear todas ops|

---

## 5. Testes de Exploração (Exploratory Testing)

Investigação livre para descobrir comportamentos inesperados.

### Charters para sistema bancário

- **Charter 1:** Explorar o comportamento do sistema ao realizar múltiplas transferências simultâneas
- **Charter 2:** Verificar o que acontece se a sessão expirar durante uma transferência
- **Charter 3:** Testar acessibilidade do sistema com leitor de tela
- **Charter 4:** Explorar limites de timeout da API de transferência

---

## 6. Testes de Regressão

### Critérios para priorizar casos de regressão

1. **Alta prioridade:** Login, transferência, extrato (fluxo crítico)
2. **Média prioridade:** Cadastro de usuário, abertura de conta
3. **Baixa prioridade:** Preferências de tela, relatórios secundários

### Suite de regressão (tags no projeto)

```bash
# Rodar apenas smoke tests (fluxo crítico)
mvn test -Dcucumber.filter.tags="@smoke"

# Rodar regressão completa
mvn test -Dcucumber.filter.tags="@regressao"

# Rodar apenas testes de banco de dados
mvn test -Dcucumber.filter.tags="@banco_de_dados"
```
