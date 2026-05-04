# Setup Appium para Testes Mobile

Guia passo a passo para rodar os testes mobile deste projeto localmente.

---

## O que você vai precisar

| Ferramenta | Versão mínima | Para quê |
|---|---|---|
| Node.js | 18+ | Rodar o Appium server |
| Appium | 2.x | Servidor de automação mobile |
| driver UiAutomator2 | latest | Automação Android |
| Android Studio | latest | Emulador + SDK |
| Java | 21 | Já instalado (Maven) |

---

## 1. Instalar o Appium 2

```bash
npm install -g appium
appium --version   # deve mostrar 2.x.x
```

### Instalar o driver para Android

```bash
appium driver install uiautomator2
appium driver list   # confirma: uiautomator2 INSTALLED
```

### Instalar o driver para iOS (só no Mac)

```bash
appium driver install xcuitest
# Também precisa: Xcode + xcode-select --install
```

---

## 2. Criar o Emulador Android

1. Abra o **Android Studio** → `Device Manager` → `Create Virtual Device`
2. Escolha: **Pixel 5** → sistema **API 31 (Android 12)**
3. Nome do AVD: `Pixel_5_API_31` *(deve bater com `mobile.device.name` no config.properties)*
4. Inicie o emulador

Confirme que está rodando:
```bash
adb devices
# Lista como: emulator-5554  device
```

---

## 3. Baixar o App de Treino

O projeto usa o **Sauce Labs My Demo App** — app gratuito criado para praticar automação mobile.

**Download do APK:**
```
https://github.com/saucelabs/my-demo-app-rn/releases
```

Salve o arquivo em:
```
src/test/resources/apps/my_demo_app.apk
```

**Credenciais de teste do app:**
| Usuário | Senha |
|---|---|
| `bod@example.com` | `10203040` |
| `alice@example.com` | `10203040` |

---

## 4. Iniciar o Appium Server

Em um terminal separado, deixe rodando:

```bash
appium --port 4723 --log-level info
```

Confirme que está OK:
```
[Appium] Welcome to Appium v2.x.x
[Appium] Appium REST http interface listener started on http://0.0.0.0:4723
```

---

## 5. Executar os Testes Mobile

```bash
# Apenas testes mobile
mvn test -Dtest=MobileRunner

# Apenas smoke mobile
mvn test -Dtest=MobileRunner -Dcucumber.filter.tags="@mobile and @smoke"
```

---

## 6. Inspecionar Elementos com Appium Inspector

O **Appium Inspector** é a ferramenta para descobrir locators de elementos (como o DevTools do Chrome, mas para apps).

**Download:** https://github.com/appium/appium-inspector/releases

**Configuração para Android:**
```json
{
  "platformName": "Android",
  "appium:deviceName": "Pixel_5_API_31",
  "appium:app": "/caminho/para/my_demo_app.apk",
  "appium:automationName": "UiAutomator2"
}
```

**O que procurar nos elementos:**
- `content-desc` → accessibility ID (o mais estável — usado neste projeto)
- `resource-id` → equivale ao `id` no Selenium
- `class` → equivale ao `tagName` (menos estável)
- `xpath` → último recurso (frágil, evitar)

---

## 7. Estrutura da Camada Mobile no Projeto

```
src/
├── main/java/com/banking/qa/mobile/
│   ├── driver/
│   │   └── MobileDriverFactory     → Cria AndroidDriver ou IOSDriver
│   └── pages/
│       ├── MobileBasePage          → wait, tap, type, swipe (W3C Actions)
│       ├── MobileLoginPage         → tela de login do app
│       └── MobileProductsPage      → tela principal após login
└── test/
    ├── java/com/banking/qa/
    │   ├── steps/mobile/
    │   │   └── MobileLoginSteps    → implementação dos passos Gherkin
    │   ├── hooks/
    │   │   └── MobileHooks         → screenshot em falha + teardown do AppiumDriver
    │   └── runners/
    │       └── MobileRunner        → mvn test -Dtest=MobileRunner
    └── resources/
        ├── features/mobile/
        │   └── mobile_login.feature
        └── apps/
            └── my_demo_app.apk     ← você precisa baixar e colocar aqui
```

---

## 8. Diferenças entre Web (Selenium) e Mobile (Appium)

| Conceito | Selenium (Web) | Appium (Mobile) |
|---|---|---|
| Driver | `ChromeDriver` / `FirefoxDriver` | `AndroidDriver` / `IOSDriver` |
| Locator preferido | `By.id`, `By.cssSelector` | `AppiumBy.accessibilityId` |
| Clique | `element.click()` | `element.click()` |
| Scroll | `JavascriptExecutor` | `PointerInput` (W3C Actions) |
| Server | Embutido no driver | Appium server externo (porta 4723) |
| Inspeção | DevTools / Browser | Appium Inspector |
| Config device | `ChromeOptions` | `UiAutomator2Options` / `XCUITestOptions` |

---

## 9. Problemas Comuns

**"Could not find a connected Android device"**
```bash
adb devices          # emulador deve aparecer como "device"
adb kill-server
adb start-server
```

**"An unknown server-side error occurred while processing the command"**
- Confirme que o APK está em `src/test/resources/apps/my_demo_app.apk`
- Confirme `mobile.app.package` e `mobile.app.activity` no `config.properties`

**"Connection refused localhost:4723"**
```bash
appium --port 4723   # Appium server não estava rodando
```

**Appium Inspector não conecta**
- Marque "Advanced Settings" → desative SSL
- Use `http://localhost:4723` (sem `/wd/hub` no Appium 2.x)
