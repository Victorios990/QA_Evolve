package com.banking.qa.steps.e2e;

import com.banking.qa.config.ConfigManager;
import com.banking.qa.pages.*;
import com.banking.qa.utils.TestDataGenerator;
import io.cucumber.java.pt.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class E2ESteps {

    private final RegisterPage       registerPage  = new RegisterPage();
    private final AccountOverviewPage overviewPage = new AccountOverviewPage();
    private final OpenAccountPage    openAccPage   = new OpenAccountPage();
    private final TransferFundsPage  transferPage  = new TransferFundsPage();
    private final AccountActivityPage activityPage = new AccountActivityPage();
    private final BillPayPage        billPayPage   = new BillPayPage();
    private final NavigationBar      nav           = new NavigationBar();

    // Dados gerados dinamicamente para o novo usuário
    private String username;
    private String password;
    private String newAccountId;

    // ── ETAPA 1: Registro ──────────────────────────────────────────

    @Dado("que um novo usuário acessa a página de registro")
    public void acessaPaginaRegistro() {
        registerPage.navigate();
    }

    @Quando("preenche o formulário com dados válidos gerados automaticamente")
    public void preencheFormularioRegistro() {
        username = TestDataGenerator.username();
        password = TestDataGenerator.password();

        registerPage.fillForm(
            TestDataGenerator.firstName(),
            TestDataGenerator.lastName(),
            TestDataGenerator.address(),
            TestDataGenerator.city(),
            TestDataGenerator.state(),
            TestDataGenerator.zipCode(),
            TestDataGenerator.phone(),
            TestDataGenerator.ssn(),
            username,
            password
        );
        System.out.println("Usuário criado: " + username);
    }

    @Quando("submete o formulário de registro")
    public void submeteRegistro() {
        registerPage.submit();
    }

    @Então("o registro deve ser concluído com sucesso")
    public void registroConcluidoComSucesso() {
        assertTrue(registerPage.isRegistrationSuccessful(),
            "Registro falhou. Username tentado: " + username);
    }

    @Então("o novo usuário deve estar autenticado automaticamente")
    public void usuarioAutenticadoAposRegistro() {
        assertTrue(nav.isLoggedIn(),
            "Usuário não está logado após registro");
    }

    // ── ETAPA 2: Visão geral ───────────────────────────────────────

    @Quando("navega para a visão geral de contas")
    public void navegaParaVisaoGeral() {
        nav.goToAccountsOverview();
    }

    @Então("pelo menos uma conta deve estar visível no painel")
    public void pelaMenosUmaContaVisivel() {
        WebDriverWait wait = new WebDriverWait(overviewPage.getDriver(), Duration.ofSeconds(15));
        List<WebElement> contas = wait.until(
            ExpectedConditions.presenceOfAllElementsLocatedBy(
                By.cssSelector("a[href*='activity.htm']")));
        assertFalse(contas.isEmpty(), "Nenhuma conta encontrada no painel");
        System.out.println("Contas encontradas: " + contas.size());
    }

    // ── ETAPA 3: Abertura de conta ─────────────────────────────────

    @Quando("abre uma nova conta do tipo {string}")
    public void abreNovaConta(String tipo) {
        openAccPage.openAccount(tipo);
    }

    @Então("a nova conta de poupança deve ser criada com sucesso")
    public void novaContaCriadaComSucesso() {
        assertTrue(openAccPage.isAccountOpened(),
            "Nova conta não foi criada. Verifique se a conta de origem tem saldo suficiente.");
    }

    @Então("o número da nova conta deve ser exibido")
    public void numeroNovaContaExibido() {
        newAccountId = openAccPage.getNewAccountId();
        assertFalse(newAccountId.isEmpty(), "Número da nova conta não foi exibido");
        System.out.println("Nova conta criada: " + newAccountId);
    }

    // ── ETAPA 4: Transferência ─────────────────────────────────────

    @Quando("realiza uma transferência de {string} entre as contas disponíveis")
    public void realizaTransferencia(String valor) {
        transferPage.navigate();

        WebDriverWait wait = new WebDriverWait(transferPage.getDriver(), Duration.ofSeconds(20));

        // Aguarda opções de origem carregarem (AJAX)
        wait.until(d -> {
            List<WebElement> opts = d.findElements(By.cssSelector("#fromAccountId option"));
            return opts.size() > 0 ? opts : null;
        });

        transferPage.enterAmount(valor);

        // Seleciona origem: índice 0
        new Select(transferPage.getDriver().findElement(By.id("fromAccountId")))
            .selectByIndex(0);

        // Seleciona destino: índice diferente (último disponível)
        List<WebElement> toOpts = transferPage.getDriver()
            .findElements(By.cssSelector("#toAccountId option"));
        int idx = toOpts.size() > 1 ? toOpts.size() - 1 : 0;
        new Select(transferPage.getDriver().findElement(By.id("toAccountId")))
            .selectByIndex(idx);

        transferPage.clickTransfer();
    }

    @Então("a transferência deve ser registrada com sucesso")
    public void transferenciaBemSucedida() {
        assertTrue(transferPage.isTransferSuccessful(),
            "Transferência não foi concluída com sucesso");
    }

    // ── ETAPA 5: Extrato ───────────────────────────────────────────

    @Quando("consulta o extrato de uma conta")
    public void consultaExtrato() {
        overviewPage.getDriver().get(
            ConfigManager.getInstance().getBaseUrl() + "/parabank/overview.htm");

        WebDriverWait wait = new WebDriverWait(overviewPage.getDriver(), Duration.ofSeconds(15));
        List<WebElement> links = wait.until(
            ExpectedConditions.presenceOfAllElementsLocatedBy(
                By.cssSelector("a[href*='activity.htm']")));
        links.get(0).click();
    }

    @Então("o extrato deve ser exibido com as movimentações")
    public void extratoExibido() {
        assertTrue(activityPage.isPageLoaded(),
            "Página de extrato não foi carregada");
        System.out.println("Saldo na conta: " + activityPage.getBalance());
    }

    // ── ETAPA 6: Pagamento de boleto ───────────────────────────────

    @Quando("realiza o pagamento de um boleto de {string}")
    public void realizaPagamentoBoleto(String valor) {
        billPayPage.navigate();
        billPayPage.waitForFromAccount();

        // Dados do beneficiário (qualquer empresa fictícia)
        billPayPage.fillPayeeInfo(
            "Concessionária Energia S.A.",
            "Av. Brasília, 100",
            "Brasília",
            "DF",
            "70000-000",
            "61-3333-4444",
            "12345678"
        );
        billPayPage.setAmount(valor);
        billPayPage.sendPayment();
    }

    @Então("o pagamento deve ser confirmado com sucesso")
    public void pagamentoConfirmado() {
        assertTrue(billPayPage.isPaymentSuccessful(),
            "Pagamento de boleto não foi confirmado");
    }

    // ── ETAPA 7: Logout ────────────────────────────────────────────

    @Quando("realiza o logout")
    public void realizaLogout() {
        nav.logout();
    }

    @Então("deve ser redirecionado para a página de login")
    public void redirecionadoPaginaLogin() {
        // Após logout, o link "Log Out" não deve mais estar visível
        assertFalse(nav.isLoggedIn(), "Sessão ainda ativa após logout");
    }

    @Então("não deve ter acesso às páginas protegidas")
    public void semAcessoPaginasProtegidas() {
        nav.getDriver().get(
            ConfigManager.getInstance().getBaseUrl() + "/parabank/overview.htm");
        // Sem sessão ativa, o link de logout não aparece — usuário está deslogado
        assertFalse(nav.isLoggedIn(),
            "Usuário ainda tem acesso à página protegida após logout");
    }
}
