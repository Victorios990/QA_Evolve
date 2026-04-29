package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class BillPayPage extends BasePage {

    private final By payeeNameField    = By.name("payee.name");
    private final By addressField      = By.name("payee.address.street");
    private final By cityField         = By.name("payee.address.city");
    private final By stateField        = By.name("payee.address.state");
    private final By zipCodeField      = By.name("payee.address.zipCode");
    private final By phoneField        = By.name("payee.phoneNumber");
    private final By accountField      = By.name("payee.accountNumber");
    private final By verifyAccountField= By.name("verifyAccount");
    private final By amountField       = By.name("amount");
    private final By sendButton        = By.cssSelector("input[value='Send Payment']");
    private final By successTitle      = By.cssSelector(".title");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getBaseUrl() + "/parabank/billpay.htm");
    }

    public void fillPayeeInfo(String name, String address, String city,
                              String state, String zip, String phone,
                              String accountNumber) {
        type(payeeNameField,     name);
        type(addressField,       address);
        type(cityField,          city);
        type(stateField,         state);
        type(zipCodeField,       zip);
        type(phoneField,         phone);
        type(accountField,       accountNumber);
        type(verifyAccountField, accountNumber);
    }

    public void setAmount(String amount) {
        type(amountField, amount);
    }

    public void waitForFromAccount() {
        wait.until(ExpectedConditions.presenceOfElementLocated(
            By.cssSelector("select[name='fromAccountId'] option")));
    }

    public void sendPayment() {
        click(sendButton);
    }

    public boolean isPaymentSuccessful() {
        try {
            wait.until(org.openqa.selenium.support.ui.ExpectedConditions
                .presenceOfElementLocated(successTitle));
        } catch (Exception ignored) {}
        String src = driver.getPageSource();
        return src.contains("Bill Payment Complete") || src.contains("payment was successfully");
    }
}
