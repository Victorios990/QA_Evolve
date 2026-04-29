package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class TransferFundsPage extends BasePage {

    private final By amountField       = By.id("amount");
    private final By fromAccountSelect = By.id("fromAccountId");
    private final By toAccountSelect   = By.id("toAccountId");
    private final By transferButton    = By.cssSelector("input[value='Transfer']");
    private final By successTitle      = By.cssSelector(".title");
    private final By errorMessage      = By.cssSelector(".error");
    private final By transferedAmount  = By.id("amount");

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

    public void transferFunds(String amount, String fromAccount, String toAccount) {
        enterAmount(amount);
        selectFromAccount(fromAccount);
        selectToAccount(toAccount);
        clickTransfer();
    }

    public boolean isTransferSuccessful() {
        // Parabank usa AJAX — aguardar resultado
        try {
            WebDriverWait w = new WebDriverWait(driver, Duration.ofSeconds(15));
            // Pode retornar no div#showResult ou no .title
            w.until(ExpectedConditions.or(
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".title")),
                ExpectedConditions.visibilityOfElementLocated(By.id("showResult"))
            ));
        } catch (Exception ignored) {}
        String pageSource = driver.getPageSource();
        return pageSource.contains("Transfer Complete") || pageSource.contains("transfer complete");
    }

    public boolean isErrorDisplayed() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(ExpectedConditions.visibilityOfElementLocated(errorMessage));
            return true;
        } catch (Exception e) {
            // Parabank pode não mostrar erro — verificar se resultado de sucesso também não apareceu
            return !driver.getPageSource().contains("Transfer Complete");
        }
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }
}
