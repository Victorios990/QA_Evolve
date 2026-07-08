package com.banking.qa.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.List;
import java.util.stream.Collectors;

public class AccountActivityPage extends BasePage {

    private final By accountNumber      = By.id("accountId");
    private final By accountType        = By.id("accountType");
    private final By balance            = By.id("balance");
    private final By availableAmount    = By.id("availableBalance");
    private final By transactionTable   = By.id("transactionTable");
    private final By transactionRows    = By.cssSelector("#transactionTable tbody tr");
    private final By transactionLinks   = By.cssSelector("#transactionTable tbody tr td:first-child a");
    private final By activityPeriod     = By.id("month");
    private final By activityType       = By.id("transactionType");
    private final By goButton           = By.cssSelector("input[value='Go']");

    public boolean isPageLoaded() {
        return driver.getCurrentUrl().contains("activity.htm");
    }

    public String getBalance() {
        // Tenta pelo ID; se vazio, busca na página pelo padrão $NNN.NN
        try {
            String val = driver.findElement(balance).getText().trim();
            if (!val.isEmpty()) return val;
        } catch (Exception ignored) {}
        // Fallback: qualquer elemento com $ na área de detalhes da conta
        try {
            return wait.until(d -> {
                for (var el : d.findElements(By.cssSelector(".ng-binding, td"))) {
                    String t = el.getText().trim();
                    if (t.startsWith("$")) return t;
                }
                return null;
            });
        } catch (Exception e) {
            return "";
        }
    }

    public String getAvailableBalance() {
        return getText(availableAmount);
    }

    public int getTransactionCount() {
        List<WebElement> rows = driver.findElements(transactionRows);
        // filtrar linhas vazias
        return (int) rows.stream()
            .filter(r -> !r.getText().trim().isEmpty())
            .count();
    }

    public List<String> getTransactionDescriptions() {
        return driver.findElements(transactionLinks).stream()
            .map(WebElement::getText)
            .collect(Collectors.toList());
    }

    public void filterByPeriod(String period) {
        selectByVisibleText(activityPeriod, period);
    }

    public void filterByType(String type) {
        selectByVisibleText(activityType, type);
    }

    public void applyFilter() {
        click(goButton);
    }
}
