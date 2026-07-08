package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.util.List;

public class TransactionHistoryPage extends BasePage {

    // ── Elementos ─────────────────────────────────────────────────────────────
    @FindBy(id = "filter-type")
    private WebElement filterTypeSelect;

    @FindBy(id = "filter-date-from")
    private WebElement filterDateFromField;

    @FindBy(id = "filter-date-to")
    private WebElement filterDateToField;

    @FindBy(id = "filter-amount-min")
    private WebElement filterAmountMinField;

    @FindBy(id = "filter-amount-max")
    private WebElement filterAmountMaxField;

    @FindBy(id = "btn-apply-filter")
    private WebElement applyFilterButton;

    @FindBy(id = "btn-clear-filter")
    private WebElement clearFilterButton;

    @FindBy(id = "btn-export-csv")
    private WebElement exportCsvButton;

    @FindBy(css = "#transaction-table tbody tr")
    private List<WebElement> transactionRows;

    @FindBy(css = ".no-results-message")
    private WebElement noResultsMessage;

    @FindBy(css = ".alert-success")
    private WebElement successMessageElement;

    @FindBy(css = ".alert-danger")
    private WebElement errorMessageElement;

    @FindBy(id = "pagination-next")
    private WebElement nextPageButton;

    @FindBy(id = "pagination-prev")
    private WebElement prevPageButton;

    @FindBy(css = ".transaction-count")
    private WebElement transactionCountElement;

    // ── Locators (By) ─────────────────────────────────────────────────────────
    private static final By LOC_TRANSACTION_TABLE    = By.id("transaction-table");
    private static final By LOC_FILTER_TYPE         = By.id("filter-type");
    private static final By LOC_FILTER_DATE_FROM    = By.id("filter-date-from");
    private static final By LOC_FILTER_DATE_TO      = By.id("filter-date-to");
    private static final By LOC_FILTER_AMOUNT_MIN   = By.id("filter-amount-min");
    private static final By LOC_FILTER_AMOUNT_MAX   = By.id("filter-amount-max");
    private static final By LOC_APPLY_FILTER        = By.id("btn-apply-filter");
    private static final By LOC_CLEAR_FILTER        = By.id("btn-clear-filter");
    private static final By LOC_EXPORT_CSV          = By.id("btn-export-csv");
    private static final By LOC_ROWS                = By.cssSelector("#transaction-table tbody tr");
    private static final By LOC_FIRST_ROW_AMOUNT    = By.cssSelector("#transaction-table tbody tr:first-child td.amount");
    private static final By LOC_FIRST_ROW_TYPE      = By.cssSelector("#transaction-table tbody tr:first-child td.type");
    private static final By LOC_NO_RESULTS          = By.cssSelector(".no-results-message");
    private static final By LOC_SUCCESS_MSG         = By.cssSelector(".alert-success");
    private static final By LOC_ERROR_MSG           = By.cssSelector(".alert-danger");
    private static final By LOC_NEXT_PAGE = By.id("pagination-next");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getIGameBaseUrl() + "/account/transactions");
        waitVisible(LOC_TRANSACTION_TABLE);
    }

    public void filtrarPorTipo(String tipo) {
        selectByVisibleText(LOC_FILTER_TYPE, tipo);
    }

    public void filtrarPorPeriodo(String dataInicio, String dataFim) {
        type(LOC_FILTER_DATE_FROM, dataInicio);
        type(LOC_FILTER_DATE_TO, dataFim);
    }

    public void filtrarPorValor(String minimo, String maximo) {
        type(LOC_FILTER_AMOUNT_MIN, minimo);
        type(LOC_FILTER_AMOUNT_MAX, maximo);
    }

    public void aplicarFiltros() {
        click(LOC_APPLY_FILTER);
        waitVisible(LOC_TRANSACTION_TABLE);
    }

    public void limparFiltros() {
        click(LOC_CLEAR_FILTER);
    }

    public void exportarCSV() {
        click(LOC_EXPORT_CSV);
    }

    public int getQuantidadeTransacoes() {
        List<WebElement> rows = driver.findElements(LOC_ROWS);
        return rows.size();
    }

    public String getValorPrimeiraTransacao() {
        return getText(LOC_FIRST_ROW_AMOUNT).replaceAll("[^0-9.,]", "").trim();
    }

    public String getTipoPrimeiraTransacao() {
        return getText(LOC_FIRST_ROW_TYPE).trim();
    }

    public boolean isSemResultados() {
        return isDisplayed(LOC_NO_RESULTS);
    }

    public boolean isSucessoExibido() {
        return isDisplayed(LOC_SUCCESS_MSG);
    }

    public boolean isErroExibido() {
        return isDisplayed(LOC_ERROR_MSG);
    }

    public String getMensagemErro() {
        return getText(LOC_ERROR_MSG);
    }

    public boolean isProximaPaginaDisponivel() {
        return isDisplayed(LOC_NEXT_PAGE);
    }

    public void navegarProximaPagina() {
        click(LOC_NEXT_PAGE);
        waitVisible(LOC_TRANSACTION_TABLE);
    }

    public boolean isPageLoaded() {
        return isDisplayed(LOC_TRANSACTION_TABLE);
    }
}
