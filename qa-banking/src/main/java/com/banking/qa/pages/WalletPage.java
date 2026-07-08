package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.WebElement;

public class WalletPage extends BasePage {

    // ── Elementos ─────────────────────────────────────────────────────────────
    @FindBy(id = "wallet-balance")
    private WebElement balanceElement;

    @FindBy(id = "available-balance")
    private WebElement availableBalanceElement;

    @FindBy(id = "deposit-amount")
    private WebElement depositAmountField;

    @FindBy(id = "withdrawal-amount")
    private WebElement withdrawalAmountField;

    @FindBy(id = "payment-method")
    private WebElement paymentMethodSelect;

    @FindBy(id = "btn-deposit")
    private WebElement confirmDepositButton;

    @FindBy(id = "btn-withdrawal")
    private WebElement confirmWithdrawalButton;

    @FindBy(id = "btn-deposit-tab")
    private WebElement depositTab;

    @FindBy(id = "btn-withdrawal-tab")
    private WebElement withdrawalTab;

    @FindBy(css = ".alert-success")
    private WebElement successMessageElement;

    @FindBy(css = ".alert-danger")
    private WebElement errorMessageElement;

    // ── Locators (By) — usados nos métodos de espera ──────────────────────────
    private static final By LOC_BALANCE          = By.id("wallet-balance");
    private static final By LOC_DEPOSIT_TAB      = By.id("btn-deposit-tab");
    private static final By LOC_WITHDRAWAL_TAB   = By.id("btn-withdrawal-tab");
    private static final By LOC_DEPOSIT_AMOUNT   = By.id("deposit-amount");
    private static final By LOC_WITHDRAWAL_AMOUNT = By.id("withdrawal-amount");
    private static final By LOC_PAYMENT_METHOD   = By.id("payment-method");
    private static final By LOC_CONFIRM_DEPOSIT  = By.id("btn-deposit");
    private static final By LOC_CONFIRM_WITHDRAWAL = By.id("btn-withdrawal");
    private static final By LOC_SUCCESS_MSG      = By.cssSelector(".alert-success");
    private static final By LOC_ERROR_MSG        = By.cssSelector(".alert-danger");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getIGameBaseUrl() + "/account/wallet");
        waitVisible(LOC_BALANCE);
    }

    public String getSaldo() {
        return getText(LOC_BALANCE).replaceAll("[^0-9.,]", "").trim();
    }

    public void abrirAbaDeposito() {
        click(LOC_DEPOSIT_TAB);
        waitVisible(LOC_DEPOSIT_AMOUNT);
    }

    public void abrirAbaSaque() {
        click(LOC_WITHDRAWAL_TAB);
        waitVisible(LOC_WITHDRAWAL_AMOUNT);
    }

    public void informarValorDeposito(String valor) {
        type(LOC_DEPOSIT_AMOUNT, valor);
    }

    public void selecionarMetodoPagamento(String metodo) {
        selectByVisibleText(LOC_PAYMENT_METHOD, metodo);
    }

    public void confirmarDeposito() {
        click(LOC_CONFIRM_DEPOSIT);
    }

    public void informarValorSaque(String valor) {
        type(LOC_WITHDRAWAL_AMOUNT, valor);
    }

    public void confirmarSaque() {
        click(LOC_CONFIRM_WITHDRAWAL);
    }

    public String getMensagemSucesso() {
        return getText(LOC_SUCCESS_MSG);
    }

    public String getMensagemErro() {
        return getText(LOC_ERROR_MSG);
    }

    public boolean isSucessoExibido() {
        return isDisplayed(LOC_SUCCESS_MSG);
    }

    public boolean isErroExibido() {
        return isDisplayed(LOC_ERROR_MSG);
    }

    public boolean isPageLoaded() {
        return isDisplayed(LOC_BALANCE);
    }
}
