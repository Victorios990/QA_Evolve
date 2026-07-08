package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;

public class RegisterPage extends BasePage {

    private final By firstNameField    = By.id("customer.firstName");
    private final By lastNameField     = By.id("customer.lastName");
    private final By addressField      = By.id("customer.address.street");
    private final By cityField         = By.id("customer.address.city");
    private final By stateField        = By.id("customer.address.state");
    private final By zipCodeField      = By.id("customer.address.zipCode");
    private final By phoneField        = By.id("customer.phoneNumber");
    private final By ssnField          = By.id("customer.ssn");
    private final By usernameField     = By.id("customer.username");
    private final By passwordField     = By.id("customer.password");
    private final By confirmPassword   = By.id("repeatedPassword");
    private final By registerButton    = By.cssSelector("input[value='Register']");
    private final By errorMessage      = By.cssSelector(".error");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getBaseUrl() + "/parabank/register.htm");
    }

    public void fillForm(String firstName, String lastName, String address,
                         String city, String state, String zipCode,
                         String phone, String ssn,
                         String username, String password) {
        type(firstNameField,  firstName);
        type(lastNameField,   lastName);
        type(addressField,    address);
        type(cityField,       city);
        type(stateField,      state);
        type(zipCodeField,    zipCode);
        type(phoneField,      phone);
        type(ssnField,        ssn);
        type(usernameField,   username);
        type(passwordField,   password);
        type(confirmPassword, password);
    }

    public void submit() {
        click(registerButton);
    }

    public boolean isRegistrationSuccessful() {
        try {
            wait.until(d -> {
                String src = d.getPageSource();
                return src.contains("Log Out") ||
                       src.contains("Welcome") ||
                       src.contains("Accounts Overview");
            });
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasError() {
        return isDisplayed(errorMessage);
    }

    public String getErrorText() {
        return getText(errorMessage);
    }
}
