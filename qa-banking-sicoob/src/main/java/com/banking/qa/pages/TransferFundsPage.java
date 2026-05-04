package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

public class TransferFundsPage extends BasePage {

    private final By amountField       = By.id("amount");
    private final By fromAccountSelect = By.id("fromAccountId");
    private final By toAccountSelect   = By.id("toAccountId");
    private final By transferButton    = By.cssSelector("input[value='Transfer']");
    private final By showResult        = By.id("showResult");
    private final By showError         = By.id("showError");
    private final By errorMessage      = By.cssSelector(".error");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getBaseUrl() + "/parabank/transfer.htm");
    }

    public void enterAmount(String amount) {
        type(amountField, amount);
    }

    public void selectFromAccount(String accountNumber) {
        selectByVisibleText(fromAccountSelect, accountNumber);
    }

    public void selectToAccount(String accountNumber) {
        selectByVisibleText(toAccountSelect, accountNumber);
    }

    public void clickTransfer() {
        click(transferButton);
    }

    /** Aguarda o Parabank carregar as contas via AJAX antes de interagir com os selects. */
    public void waitForFromAccountOptions() {
        wait.until(d -> {
            List<WebElement> opts = d.findElements(By.cssSelector("#fromAccountId option"));
            return opts.size() > 0 ? opts : null;
        });
    }

    /**
     * Seleciona a conta de origem com maior saldo (último item da lista).
     * O Parabank ordena contas por ID crescente; a última tem o maior saldo nos dados padrão.
     */
    public String selectFirstFromAccount() {
        waitForFromAccountOptions();
        List<WebElement> opts = driver.findElements(By.cssSelector("#fromAccountId option"));
        int lastIdx = opts.size() - 1;
        Select select = new Select(driver.findElement(fromAccountSelect));
        select.selectByIndex(lastIdx);
        return opts.get(lastIdx).getAttribute("value");
    }

    /**
     * Seleciona a primeira conta como destino (diferente da última que foi usada como origem).
     * Aguarda o AJAX popular o select antes de interagir.
     */
    public String selectLastToAccount() {
        wait.until(d -> {
            List<WebElement> opts = d.findElements(By.cssSelector("#toAccountId option"));
            return opts.size() > 0 ? opts : null;
        });
        Select select = new Select(driver.findElement(toAccountSelect));
        select.selectByIndex(0);
        return select.getFirstSelectedOption().getAttribute("value");
    }

    public void transferFunds(String amount, String fromAccount, String toAccount) {
        enterAmount(amount);
        selectFromAccount(fromAccount);
        selectToAccount(toAccount);
        clickTransfer();
    }

    public boolean isTransferSuccessful() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(showResult));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isErrorDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(showError));
            return true;
        } catch (Exception e) {
            return isDisplayed(errorMessage);
        }
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }
}
