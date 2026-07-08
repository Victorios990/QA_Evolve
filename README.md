# qa-igaming

Portfólio de automação de testes para plataformas **iGaming** — jogos, cassino, sportsbook, carteira digital e backoffice multi-tenant.

Cobre as camadas **web**, **mobile nativo** (Android + iOS) e **API/carga**, com cinco stacks de automação distintas.

---

## Estrutura

```
qa-igaming/
├── web/
│   ├── cypress/          # Testes E2E web + viewport mobile (iPhone, Android)
│   └── playwright/       # Testes multi-dispositivo (iPhone 14, Pixel 7, iPad Pro)
├── mobile/
│   ├── appium/           # Testes nativos Android (UiAutomator2) e iOS (XCUITest)
│   ├── maestro/          # Flows declarativos YAML para Android e iOS
│   └── robot-appium/     # Robot Framework + AppiumLibrary (cross-platform)
├── api/
│   └── k6/               # Testes de carga e isolamento multi-tenant
├── docs/
│   ├── test-cases/
│   └── test-plans/
└── .github/
    └── ISSUE_TEMPLATE/   # Templates padronizados de bug report e plano de teste
```

---

## Domínios cobertos

| Domínio | O que é validado |
|---|---|
| Carteira (Wallet) | Depósito, saque, saldo, idempotência, falha de rede |
| Sportsbook | Aposta, mudança de odd, cancelamento, saldo insuficiente |
| Cassino | Lançamento de jogo, sessão, saída |
| Histórico | Filtros, paginação, exportação CSV |
| Multi-tenant | Isolamento de dados, rejeição de token cross-tenant, badge de tenant |

---

## Stacks e ferramentas

### Web — Cypress 13
Testes E2E com cobertura de viewport mobile integrada.

```bash
# instalar dependências
npm install

# rodar todos os testes
CYPRESS_BASE_URL=http://<app-url> npm run cy:run

# rodar em modo mobile (390×844)
CYPRESS_BASE_URL=http://<app-url> npm run cy:run:mobile
```

**Destaques:**
- `cy.session()` para cache de login entre specs
- `cy.intercept()` para simular falha de rede, saldo zerado e mudança de odd
- `selectors.js` centralizado com atributos `data-cy`
- Viewports: `iphone-14`, `samsung-s10`

---

### Web — Playwright
Testes multi-dispositivo com emulação real de hardware.

```bash
npm run pw:install        # instalar browsers
PW_BASE_URL=http://<app-url> npm run pw:test:mobile
```

**Projetos configurados:**
- Desktop Chrome
- Mobile Safari — iPhone 14
- Mobile Chrome — Pixel 7
- Tablet — iPad Pro

**Destaques:**
- `page.tap()` para eventos de toque
- `page.route()` para interceptar chamadas de API
- Validação de layout: elementos visíveis e não sobrepostos em mobile

---

### Mobile nativo — Appium (Python)
Testes em apps nativos Android e iOS via Appium Server.

```
# pré-requisitos
pip install -r mobile/robot-appium/requirements.txt
# ou
pip install appium-python-client pytest

# Android
APK_PATH=./apps/igaming.apk pytest mobile/appium/tests/android/

# iOS
IPA_PATH=./apps/igaming.ipa pytest mobile/appium/tests/ios/
```

**Cobertura:**
- `WalletPage` e `SportsbookPage` com Page Object Model
- Testes de toque duplo (idempotência), swipe de navegação
- Verificação de teclado numérico em campos de valor (iOS)

---

### Mobile nativo — Maestro
Ferramenta moderna com flows em YAML — zero configuração de driver.

```bash
# instalar
brew install maestro

# rodar todos os flows
npm run maestro:all

# rodar por domínio
npm run maestro:carteira
npm run maestro:sportsbook
```

**Flows disponíveis:**
- `carteira/deposito_valido.yaml`
- `carteira/saque_saldo_insuficiente.yaml`
- `sportsbook/registrar_aposta.yaml`
- `multi_tenant/isolamento_tenant.yaml`

---

### Mobile nativo — Robot Framework + AppiumLibrary
Keywords em português, cross-platform Android e iOS no mesmo suite.

```bash
pip install -r mobile/robot-appium/requirements.txt

# Android
robot --include android mobile/robot-appium/tests/

# iOS
robot --include ios mobile/robot-appium/tests/

# Cross-platform
robot mobile/robot-appium/tests/04_cross_platform/
```

**Tags disponíveis:** `android`, `ios`, `cross-platform`, `financeiro`, `P0`, `P1`, `P2`

---

### API e carga — k6

```bash
# smoke (5 VUs, 1 min)
BASE_URL=http://<app-url> npm run k6:smoke

# carga (rampa até 50 VUs)
BASE_URL=http://<app-url> npm run k6:load

# spike — simula final de campeonato (200 apostas/s)
BASE_URL=http://<app-url> npm run k6:spike

# isolamento multi-tenant sob carga
BASE_URL=http://<app-url> npm run k6:tenant
```

**Thresholds globais:**
- `p(95) < 2000ms` | `p(99) < 5000ms`
- Taxa de erro `< 1%`
- Vazamento de dados entre tenants: `0` ocorrências

---

## Configuração de ambiente

Copie o arquivo de exemplo e preencha com os dados do ambiente QA:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `CYPRESS_BASE_URL` | URL base do app (Cypress) |
| `PW_BASE_URL` | URL base do app (Playwright) |
| `BASE_URL` | URL base da API (k6) |
| `APPIUM_URL` | Endpoint do Appium Server |
| `APK_PATH` | Caminho para o `.apk` Android |
| `IPA_PATH` | Caminho para o `.ipa` iOS |
| `ANDROID_DEVICE` | ID do device/emulador Android |
| `IOS_DEVICE` | Nome do simulador iOS |

---

## GitHub Templates

- **Bug Report** — severidade, passos, resultado esperado/obtido, impacto financeiro
- **Test Plan** — critérios de entrada/saída, tabela de camadas de teste, riscos

---

## Casos de teste críticos (P0)

| ID | Cenário | Ferramenta |
|---|---|---|
| CT-001 | Depósito não duplica com duplo clique | Cypress, Appium |
| CT-002 | Saque bloqueado com saldo insuficiente | Cypress, Playwright, Robot |
| CT-003 | Token de tenant A rejeitado na API de tenant B | Cypress (API), k6 |
| CT-004 | Saldo intacto após falha de rede no depósito | Cypress, Playwright |
| CT-005 | Zero vazamento de dados entre tenants sob carga | k6 |
| CT-006 | Aposta bloqueia quando odd muda antes da confirmação | Cypress |
