package com.banking.qa.pages;

import org.openqa.selenium.By;

public class NavigationBar extends BasePage {

    private final By logoutLink         = By.linkText("Log Out");
    private final By accountsOverview   = By.linkText("Accounts Overview");
    private final By transferFunds      = By.linkText("Transfer Funds");
    private final By billPay            = By.linkText("Bill Pay");
    private final By openNewAccount     = By.linkText("Open New Account");

    public void logout() {
        click(logoutLink);
    }

    public void goToAccountsOverview() {
        click(accountsOverview);
    }

    public void goToTransferFunds() {
        click(transferFunds);
    }

    public void goToBillPay() {
        click(billPay);
    }

    public void goToOpenNewAccount() {
        click(openNewAccount);
    }

    public boolean isLoggedIn() {
        return isDisplayed(logoutLink);
    }

    public boolean isOnLoginPage() {
        return driver.getCurrentUrl().contains("index.htm") ||
               driver.getCurrentUrl().contains("login");
    }
}
