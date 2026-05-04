package com.banking.qa.mobile.pages;

import io.appium.java_client.AppiumBy;
import org.openqa.selenium.By;

/**
 * Tela de produtos (home após login) do Sauce Labs My Demo App.
 * Equivalente ao "painel de contas" no contexto bancário.
 */
public class MobileProductsPage extends MobileBasePage {

    private final By productsTitle = AppiumBy.accessibilityId("Products title");
    private final By productItem   = AppiumBy.accessibilityId("store item");
    private final By menuButton    = AppiumBy.accessibilityId("open menu");

    public boolean isPageLoaded() {
        return isDisplayed(productsTitle);
    }

    public int getProductCount() {
        return driver.findElements(productItem).size();
    }

    /** Rola para baixo para revelar mais itens na lista. */
    public void scrollDown() {
        swipeUp();
    }

    /** Volta ao topo da lista. */
    public void scrollToTop() {
        swipeDown();
    }

    /** Abre o menu lateral (hamburguer). */
    public void openMenu() {
        tap(menuButton);
    }
}
