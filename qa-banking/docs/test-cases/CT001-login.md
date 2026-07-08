# CT001 — Login no Internet Banking

**Módulo:** Autenticação  
**Prioridade:** Alta  
**Tipo:** Funcional  
**Técnica utilizada:** Partição de Equivalência + Análise de Valor Limite

---

## Pré-condições
- Sistema disponível e acessível
- Usuário cadastrado: `john` / `demo`
- Navegador Chrome atualizado

---

## Casos de Teste

| ID       | Descrição                        | Entrada                              | Resultado Esperado                                      | Status |
|----------|----------------------------------|--------------------------------------|---------------------------------------------------------|--------|
| CT001-01 | Login com credenciais válidas    | user: john / pass: demo              | Redirecionamento para painel de contas                  | -      |
| CT001-02 | Login com senha incorreta        | user: john / pass: ERRADA            | Exibir: "The username and password could not be verified." | -   |
| CT001-03 | Login com usuário inexistente    | user: naoexiste / pass: qualquer     | Exibir mensagem de erro de autenticação                 | -      |
| CT001-04 | Login com campos em branco       | user: (vazio) / pass: (vazio)        | Mensagem de validação de campos obrigatórios            | -      |
| CT001-05 | Login com usuário em branco      | user: (vazio) / pass: demo           | Mensagem de validação                                   | -      |
| CT001-06 | Login com senha em branco        | user: john / pass: (vazio)           | Mensagem de validação                                   | -      |
| CT001-07 | Injeção SQL no campo usuário     | user: ' OR '1'='1 / pass: qualquer   | Sistema rejeita, sem acesso indevido                    | -      |
| CT001-08 | Senha com caracteres especiais   | user: john / pass: @#$%              | Mensagem de erro de autenticação (não quebrar sistema)  | -      |
| CT001-09 | Tamanho máximo do campo usuário  | user: 256 caracteres / pass: demo    | Campo truncado ou mensagem de limite                    | -      |
| CT001-10 | Duplo clique no botão Entrar     | Clicar duas vezes rapidamente        | Apenas uma requisição enviada                           | -      |

---

## Técnicas Aplicadas

**Partição de Equivalência:**
- Classe válida: credenciais corretas cadastradas
- Classes inválidas: senha errada, usuário inexistente, campos vazios

**Análise de Valor Limite:**
- Tamanho máximo do campo senha (geralmente 8–64 chars)
- 1 caractere, 2 caracteres, máximo-1, máximo, máximo+1

**Tabela de Decisão:**

| Usuário Válido | Senha Válida | Resultado          |
|:--------------:|:------------:|--------------------|
| Sim            | Sim          | Login bem-sucedido |
| Sim            | Não          | Erro de autenticação |
| Não            | Sim          | Erro de autenticação |
| Não            | Não          | Erro de autenticação |

---

## Pós-condições
- Sessão ativa após login bem-sucedido
- Nenhuma sessão criada em caso de falha
