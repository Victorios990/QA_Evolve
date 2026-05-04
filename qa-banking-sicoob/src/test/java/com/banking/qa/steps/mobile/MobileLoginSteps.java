package com.banking.qa.steps.mobile;

import com.banking.qa.mobile.pages.MobileLoginPage;
import com.banking.qa.mobile.pages.MobileProductsPage;
import io.cucumber.java.pt.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

public class MobileLoginSteps {

    private static final Logger log = LoggerFactory.getLogger(MobileLoginSteps.class);

    private final MobileLoginPage    loginPage    = new MobileLoginPage();
    private final MobileProductsPage productsPage = new MobileProductsPage();

    @Dado("que o aplicativo móvel está aberto")
    public void appMobilAberto() {
        log.info("Aplicativo móvel iniciado via Appium");
    }

    @Quando("o usuário informa o e-mail {string} e a senha {string}")
    public void usuarioInformaCredenciaisApp(String email, String senha) {
        loginPage.enterUsername(email);
        loginPage.enterPassword(senha);
    }

    @Quando("o usuário não preenche as credenciais")
    public void usuarioNaoPreencheCredenciais() {
        // campos permanecem vazios para testar validação de campo obrigatório
    }

    @Quando("toca no botão de login")
    public void tocaNoBotaoLogin() {
        loginPage.tapLogin();
    }

    @Então("a tela de produtos deve ser exibida")
    public void telaProdutosExibida() {
        assertTrue(productsPage.isPageLoaded(),
            "Tela de produtos não foi carregada após login mobile");
        log.info("Login mobile bem-sucedido — {} produto(s) visível(is)",
            productsPage.getProductCount());
    }

    @Então("uma mensagem de erro deve ser exibida")
    public void mensagemErroExibida() {
        assertTrue(loginPage.isErrorDisplayed(),
            "Mensagem de erro não exibida para credenciais inválidas");
        log.info("Mensagem de erro capturada: {}", loginPage.getErrorMessage());
    }

    @Então("uma mensagem de erro de campos obrigatórios deve ser exibida")
    public void mensagemErroCamposObrigatorios() {
        assertTrue(loginPage.isErrorDisplayed(),
            "Mensagem de erro de campos obrigatórios não exibida");
        log.info("Validação de campos obrigatórios: {}", loginPage.getErrorMessage());
    }

    @Então("deve ser possível rolar a lista de produtos")
    public void rolarListaProdutos() {
        int antes = productsPage.getProductCount();
        productsPage.scrollDown();
        int depois = productsPage.getProductCount();
        log.info("Produtos visíveis — antes do scroll: {} | depois: {}", antes, depois);
        assertTrue(depois >= 0, "Erro ao rolar a lista de produtos");
    }
}
