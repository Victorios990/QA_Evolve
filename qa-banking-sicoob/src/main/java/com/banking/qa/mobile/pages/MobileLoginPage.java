package com.banking.qa.mobile.pages;

import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;

/**
 * Tela de login do Sauce Labs My Demo App.
 * Accessibility IDs conforme o app: https://github.com/saucelabs/my-demo-app-rn
 *
 * Credenciais válidas de treino:
 *   Usuário: bod@example.com  |  Senha: 10203040
 */
public class MobileLoginPage extends MobileBasePage {

    private final By usernameField = AppiumBy.accessibilityId("Username input field");
    private final By passwordField = AppiumBy.accessibilityId("Password input field");
    private final By loginButton   = AppiumBy.accessibilityId("Login button");
    private final By errorMessage  = AppiumBy.accessibilityId("generic-error-message");

    public void enterUsername(String username) {
        type(usernameField, username);
    }

    public void enterPassword(String password) {
        type(passwordField, password);
    }

    public void tapLogin() {
        tap(loginButton);
    }

    public void login(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        tapLogin();
    }

    public boolean isErrorDisplayed() {
        return isDisplayed(errorMessage);
    }

    public String getErrorMessage() {
        return getText(errorMessage);
    }
}
