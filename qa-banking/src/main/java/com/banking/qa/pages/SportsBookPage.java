package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

public class SportsBookPage extends BasePage {

    // ── Elementos ─────────────────────────────────────────────────────────────
    @FindBy(id = "search-events")
    private WebElement searchEventsField;

    @FindBy(css = ".event-list")
    private WebElement eventListContainer;

    @FindBy(css = ".bet-slip")
    private WebElement betSlipPanel;

    @FindBy(id = "bet-amount")
    private WebElement betAmountField;

    @FindBy(id = "btn-place-bet")
    private WebElement placeBetButton;

    @FindBy(id = "btn-cancel-bet")
    private WebElement cancelBetButton;

    @FindBy(css = ".odds-value")
    private WebElement oddsValueElement;

    @FindBy(css = ".bet-status")
    private WebElement betStatusElement;

    @FindBy(css = ".alert-success")
    private WebElement successMessageElement;

    @FindBy(css = ".alert-danger")
    private WebElement errorMessageElement;

    @FindBy(id = "open-bets-tab")
    private WebElement openBetsTab;

    @FindBy(id = "settled-bets-tab")
    private WebElement settledBetsTab;

    @FindBy(css = "#open-bets-list .bet-item")
    private WebElement firstOpenBet;

    // ── Locators (By) ─────────────────────────────────────────────────────────
    private static final By LOC_SEARCH_EVENTS   = By.id("search-events");
    private static final By LOC_EVENT_LIST      = By.cssSelector(".event-list");
    private static final By LOC_FIRST_EVENT     = By.cssSelector(".event-list .event-item:first-child");
    private static final By LOC_FIRST_ODDS      = By.cssSelector(".event-item:first-child .odds-value");
    private static final By LOC_BET_SLIP        = By.cssSelector(".bet-slip");
    private static final By LOC_BET_AMOUNT      = By.id("bet-amount");
    private static final By LOC_PLACE_BET       = By.id("btn-place-bet");
    private static final By LOC_CANCEL_BET      = By.id("btn-cancel-bet");
    private static final By LOC_OPEN_BETS_TAB  = By.id("open-bets-tab");
    private static final By LOC_FIRST_OPEN_BET = By.cssSelector("#open-bets-list .bet-item:first-child");
    private static final By LOC_BET_STATUS     = By.cssSelector(".bet-status");
    private static final By LOC_SUCCESS_MSG     = By.cssSelector(".alert-success");
    private static final By LOC_ERROR_MSG       = By.cssSelector(".alert-danger");
    private static final By LOC_ODDS_CHANGED    = By.cssSelector(".odds-changed-warning");
    private static final By LOC_EVENT_UNAVAILABLE = By.cssSelector(".event-unavailable");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getIGameBaseUrl() + "/sportsbook");
        waitVisible(LOC_EVENT_LIST);
    }

    public void pesquisarEvento(String nomeEvento) {
        type(LOC_SEARCH_EVENTS, nomeEvento);
        waitVisible(LOC_FIRST_EVENT);
    }

    public void selecionarPrimeiroEvento() {
        click(LOC_FIRST_EVENT);
        waitVisible(LOC_BET_SLIP);
    }

    public String getOdds() {
        return getText(LOC_FIRST_ODDS);
    }

    public void informarValorAposta(String valor) {
        type(LOC_BET_AMOUNT, valor);
    }

    public void confirmarAposta() {
        click(LOC_PLACE_BET);
    }

    public void abrirApostasAbertas() {
        click(LOC_OPEN_BETS_TAB);
        waitVisible(LOC_FIRST_OPEN_BET);
    }

    public void selecionarPrimeiraApostaAberta() {
        click(LOC_FIRST_OPEN_BET);
    }

    public void cancelarAposta() {
        click(LOC_CANCEL_BET);
    }

    public String getMensagemSucesso() {
        return getText(LOC_SUCCESS_MSG);
    }

    public String getMensagemErro() {
        return getText(LOC_ERROR_MSG);
    }

    public String getStatusAposta() {
        return getText(LOC_BET_STATUS);
    }

    public boolean isSucessoExibido() {
        return isDisplayed(LOC_SUCCESS_MSG);
    }

    public boolean isErroExibido() {
        return isDisplayed(LOC_ERROR_MSG);
    }

    public boolean isOddsAlteradas() {
        return isDisplayed(LOC_ODDS_CHANGED);
    }

    public boolean isEventoIndisponivel() {
        return isDisplayed(LOC_EVENT_UNAVAILABLE);
    }

    public boolean isPageLoaded() {
        return isDisplayed(LOC_EVENT_LIST);
    }
}
