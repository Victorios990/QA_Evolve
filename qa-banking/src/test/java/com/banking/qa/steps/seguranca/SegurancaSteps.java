package com.banking.qa.steps.seguranca;

import com.banking.qa.config.ConfigManager;
import com.banking.qa.pages.AccountOverviewPage;
import com.banking.qa.pages.LoginPage;
import com.banking.qa.pages.NavigationBar;
import com.banking.qa.pages.RegisterPage;
import com.banking.qa.utils.DriverFactory;
import com.banking.qa.utils.TestDataGenerator;
import io.cucumber.java.pt.*;
import org.openqa.selenium.NoAlertPresentException;

import static org.junit.jupiter.api.Assertions.*;

public class SegurancaSteps {

    private final LoginPage loginPage       = new LoginPage();
    private final AccountOverviewPage overview = new AccountOverviewPage();
    private final NavigationBar navBar      = new NavigationBar();
    private final RegisterPage registerPage = new RegisterPage();

    // ── Controle de sessão ─────────────────────────────────────────

    @Dado("que nenhuma sessão está ativa no navegador")
    public void nenhumaSessaoAtiva() {
        DriverFactory.getDriver().manage().deleteAllCookies();
    }

    @Quando("um usuário não autenticado tenta acessar a URL protegida de contas")
    public void acessaUrlProtegidaSemAuth() {
        String url = ConfigManager.getInstance().getBaseUrl() + "/parabank/overview.htm";
        DriverFactory.getDriver().get(url);
    }

    @Então("o sistema deve redirecionar para a página de login")
    public void sistemaRedirecionaParaLogin() {
        String url = DriverFactory.getDriver().getCurrentUrl();
        boolean naTelaLogin = url.contains("login") || url.contains("index.htm");
        assertTrue(naTelaLogin,
            "FALHA: sistema não redirecionou para login. URL atual: " + url);
    }

    @Então("nenhum dado sensível deve ser exposto")
    public void nenhumDadoSensivelExposto() {
        String src = DriverFactory.getDriver().getPageSource();
        boolean expostoSemAuth = src.contains("Account Overview") && src.contains("Available Amount");
        assertFalse(expostoSemAuth,
            "FALHA DE SEGURANÇA: dados de conta expostos sem autenticação!");
        System.out.println("PASS: Nenhum dado sensível exposto sem autenticação");
    }

    @Quando("o usuário realiza logout pelo menu")
    public void realizaLogoutPeloMenu() {
        navBar.logout();
    }

    @Quando("tenta acessar a URL protegida de contas sem autenticação")
    public void tentaAcessarContasAposLogout() {
        String url = ConfigManager.getInstance().getBaseUrl() + "/parabank/overview.htm";
        DriverFactory.getDriver().get(url);
    }

    // ── Injeção e XSS ─────────────────────────────────────────────

    @Então("o acesso não deve ser concedido com credencial inválida")
    public void acessoNaoConcedido() {
        assertFalse(overview.isPageLoaded(),
            "FALHA DE SEGURANÇA: acesso concedido com credencial inválida!");
    }

    @Então("o sistema deve retornar mensagem de erro padrão")
    public void sistemaMostraErroAutenticacao() {
        String url = DriverFactory.getDriver().getCurrentUrl();
        boolean emTelaDeErro = loginPage.isErrorDisplayed()
            || url.contains("login")
            || url.contains("index.htm");
        assertTrue(emTelaDeErro,
            "Nenhuma resposta de segurança detectada após credencial inválida");
        System.out.println("PASS: Sistema rejeitou credencial inválida corretamente");
    }

    @Dado("que o usuário está na página de registro")
    public void usuarioEstaNaPaginaDeRegistro() {
        registerPage.navigate();
    }

    @Quando("o usuário submete o formulário com payload de script malicioso no campo nome")
    public void submeteFomularioComXSS() {
        String xssPayload = "<script>alert('XSS-PORTO-SEGURO')</script>";
        String username    = "xss_test_" + System.currentTimeMillis();
        registerPage.fillForm(
            xssPayload, "TesterSeguranca",
            "Av. Paulista, 1000", "São Paulo", "SP", "01310-100",
            "11999990000", TestDataGenerator.ssn(),
            username, "Senha@Segura1"
        );
        registerPage.submit();
    }

    @Então("o sistema não deve executar o script injetado")
    public void sistemaNaoExecutaScript() {
        try {
            DriverFactory.getDriver().switchTo().alert().dismiss();
            fail("FALHA DE SEGURANÇA: XSS executado — alert detectado no navegador!");
        } catch (NoAlertPresentException e) {
            System.out.println("PASS: Nenhum alert de XSS disparado");
        }
    }

    @Então("o payload não deve ser refletido sem sanitização na página")
    public void payloadNaoRefletido() {
        String src = DriverFactory.getDriver().getPageSource();
        // Se o script fosse refletido sem escape, apareceria literalmente na fonte
        assertFalse(src.contains("<script>alert('XSS-PORTO-SEGURO')"),
            "FALHA: payload XSS refletido sem sanitização na resposta HTML!");
        System.out.println("PASS: Payload XSS não refletido sem escape na página");
    }

    // ── Cadastro duplicado ─────────────────────────────────────────

    @Quando("o usuário tenta se registrar com o username já existente {string}")
    public void tentaRegistrarUsernameExistente(String username) {
        registerPage.fillForm(
            "Teste", "Duplicado",
            "Rua das Flores, 42", "Brasília", "DF", "70000-000",
            "61988880000", TestDataGenerator.ssn(),
            username, "Senha@Segura1"
        );
        registerPage.submit();
    }

    @Então("o sistema deve rejeitar o cadastro duplicado")
    public void sistemaRejeitaCadastroDuplicado() {
        assertTrue(registerPage.hasError(),
            "Esperava rejeição de username duplicado, mas nenhum erro foi exibido");
    }

    @Então("deve exibir mensagem de conflito de username")
    public void exibeMensagemConflito() {
        String erro = registerPage.getErrorText().toLowerCase();
        boolean mensagemRelevante = erro.contains("username")
            || erro.contains("already")
            || erro.contains("taken")
            || erro.contains("exist");
        assertTrue(mensagemRelevante,
            "Mensagem de conflito de username não identificada. Obtido: [" + erro + "]");
        System.out.println("PASS: Sistema rejeitou cadastro duplicado — " + erro);
    }
}
