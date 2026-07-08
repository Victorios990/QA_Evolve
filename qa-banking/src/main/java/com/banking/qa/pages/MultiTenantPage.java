package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class MultiTenantPage extends BasePage {

    // ── Elementos ─────────────────────────────────────────────────────────────
    @FindBy(id = "tenant-selector")
    private WebElement tenantSelectorDropdown;

    @FindBy(id = "current-tenant-name")
    private WebElement currentTenantLabel;

    @FindBy(id = "btn-switch-tenant")
    private WebElement switchTenantButton;

    @FindBy(css = ".tenant-data-table")
    private WebElement tenantDataTable;

    @FindBy(css = ".access-denied-message")
    private WebElement accessDeniedMessage;

    @FindBy(css = ".alert-success")
    private WebElement successMessageElement;

    @FindBy(css = ".alert-danger")
    private WebElement errorMessageElement;

    @FindBy(id = "tenant-user-count")
    private WebElement tenantUserCountElement;

    @FindBy(id = "tenant-balance-total")
    private WebElement tenantBalanceTotalElement;

    @FindBy(css = ".tenant-config-panel")
    private WebElement tenantConfigPanel;

    // ── Locators (By) ─────────────────────────────────────────────────────────
    private static final By LOC_TENANT_SELECTOR   = By.id("tenant-selector");
    private static final By LOC_CURRENT_TENANT    = By.id("current-tenant-name");
    private static final By LOC_SWITCH_TENANT     = By.id("btn-switch-tenant");
    private static final By LOC_ACCESS_DENIED     = By.cssSelector(".access-denied-message");
    private static final By LOC_SUCCESS_MSG       = By.cssSelector(".alert-success");
    private static final By LOC_ERROR_MSG         = By.cssSelector(".alert-danger");
    private static final By LOC_TENANT_USER_COUNT = By.id("tenant-user-count");
    private static final By LOC_TENANT_BALANCE    = By.id("tenant-balance-total");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getIGameBaseUrl() + "/admin/tenants");
        waitVisible(LOC_CURRENT_TENANT);
    }

    public String getTenantAtual() {
        return getText(LOC_CURRENT_TENANT).trim();
    }

    public void selecionarTenant(String nomeTenant) {
        selectByVisibleText(LOC_TENANT_SELECTOR, nomeTenant);
    }

    public void confirmarTrocaTenant() {
        click(LOC_SWITCH_TENANT);
    }

    public void trocarTenant(String nomeTenant) {
        selecionarTenant(nomeTenant);
        confirmarTrocaTenant();
        waitVisible(LOC_CURRENT_TENANT);
    }

    public String getMensagemSucesso() {
        return getText(LOC_SUCCESS_MSG);
    }

    public String getMensagemErro() {
        return getText(LOC_ERROR_MSG);
    }

    public String getMensagemAcessoNegado() {
        return getText(LOC_ACCESS_DENIED);
    }

    public boolean isTenantDataVisivelParaOutroTenant(String dadoExclusivo) {
        String paginaAtual = driver.getPageSource();
        return paginaAtual.contains(dadoExclusivo);
    }

    public boolean isAcessoNegadoExibido() {
        return isDisplayed(LOC_ACCESS_DENIED);
    }

    public boolean isSucessoExibido() {
        return isDisplayed(LOC_SUCCESS_MSG);
    }

    public boolean isErroExibido() {
        return isDisplayed(LOC_ERROR_MSG);
    }

    public String getQuantidadeUsuariosTenant() {
        return getText(LOC_TENANT_USER_COUNT).trim();
    }

    public String getSaldoTotalTenant() {
        return getText(LOC_TENANT_BALANCE).replaceAll("[^0-9.,]", "").trim();
    }

    public boolean isPageLoaded() {
        return isDisplayed(LOC_CURRENT_TENANT);
    }
}
