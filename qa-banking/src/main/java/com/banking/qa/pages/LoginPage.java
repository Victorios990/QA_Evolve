package com.banking.qa.pages;

import com.banking.qa.config.ConfigManager;
import org.openqa.selenium.By;

public class LoginPage extends BasePage {

    // Locators — Parabank (https://parabank.parasoft.com)
    private final By usernameField  = By.name("username");
    private final By passwordField  = By.name("password");
    private final By loginButton    = By.cssSelector("input[value='Log In']");
    private final By errorMessage   = By.cssSelector(".error");
    private final By welcomeMessage = By.cssSelector(".title");
    private final By registerLink   = By.linkText("Register");

    public void navigate() {
        driver.get(ConfigManager.getInstance().getBaseUrl() + "/parabank/index.htm");
        // Aguarda o form de login estar disponível antes de retornar
        waitVisible(usernameField);
    }

    public void enterUsername(String username) {
        type(usernameField, username);
    }

    public void enterPassword(String password) {
        type(passwordField, password);
    }

    public void clickLogin() {
        click(loginButton);
    }

    public void login(String username, String password) {
        navigate();
        enterUsername(username);
        enterPassword(password);
        clickLogin();
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }

    public boolean isErrorDisplayed() {
        try {
            waitVisible(errorMessage);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isWelcomeDisplayed() {
        return isDisplayed(welcomeMessage);
    }

    public void clickRegister() {
        click(registerLink);
    }
}
