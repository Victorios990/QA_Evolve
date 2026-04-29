package com.banking.qa.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;

public class AccountOverviewPage extends BasePage {

    private final By pageTitle        = By.cssSelector(".title");
    private final By accountTable     = By.id("accountTable");
    private final By accountRows      = By.cssSelector("#accountTable tbody tr");
    private final By totalBalance     = By.cssSelector("#accountTable tfoot td:nth-child(2)");
    private final By accountLinks     = By.cssSelector("#accountTable tbody tr td:first-child a");

    public boolean isPageLoaded() {
        return isDisplayed(pageTitle) && getText(pageTitle).contains("Accounts Overview");
    }

    public int getAccountCount() {
        return driver.findElements(accountRows).size();
    }

    public String getTotalBalance() {
        return getText(totalBalance);
    }

    public void clickAccount(String accountNumber) {
        List<WebElement> links = driver.findElements(accountLinks);
        for (WebElement link : links) {
            if (link.getText().trim().equals(accountNumber)) {
                link.click();
                return;
            }
        }
        throw new RuntimeException("Conta não encontrada: " + accountNumber);
    }

    public boolean accountExists(String accountNumber) {
        List<WebElement> links = driver.findElements(accountLinks);
        return links.stream().anyMatch(l -> l.getText().trim().equals(accountNumber));
    }
}
