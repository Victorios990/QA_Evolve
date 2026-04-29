package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class OpenAccountPage extends BasePage {

    private final By accountTypeSelect = By.id("type");
    private final By openButton        = By.cssSelector("input[value='Open New Account']");
    private final By successTitle      = By.cssSelector(".title");
    private final By newAccountId      = By.id("newAccountId");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getBaseUrl() + "/parabank/openaccount.htm");
    }

    public void selectAccountType(String type) {
        int index = type.equalsIgnoreCase("SAVINGS") ? 1 : 0;
        new org.openqa.selenium.support.ui.Select(
            driver.findElement(accountTypeSelect)).selectByIndex(index);
    }

    public void waitForFromAccountLoaded() {
        wait.until(ExpectedConditions.presenceOfElementLocated(
            By.cssSelector("#fromAccountId option")));
    }

    public void openAccount(String accountType) {
        navigate();
        waitForFromAccountLoaded();
        selectAccountType(accountType);
        click(openButton);
    }

    public boolean isAccountOpened() {
        try {
            wait.until(org.openqa.selenium.support.ui.ExpectedConditions
                .presenceOfElementLocated(successTitle));
            String src = driver.getPageSource();
            return src.contains("Account Opened") || src.contains("Congratulations");
        } catch (Exception e) {
            return false;
        }
    }

    public String getNewAccountId() {
        try {
            return wait.until(
                ExpectedConditions.visibilityOfElementLocated(newAccountId)).getText().trim();
        } catch (Exception e) {
            return "";
        }
    }
}
