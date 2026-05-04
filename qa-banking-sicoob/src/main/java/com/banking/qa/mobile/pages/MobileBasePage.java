package com.banking.qa.mobile.pages;

import com.banking.qa.mobile.driver.MobileDriverFactory;
import io.appium.java_client.AppiumDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.PointerInput;
import org.openqa.selenium.interactions.Sequence;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Base para todos os page objects mobile.
 * Fornece helpers de interação e gestos (swipe) via W3C Actions API.
 */
public abstract class MobileBasePage {

    protected AppiumDriver driver;
    protected WebDriverWait wait;

    public MobileBasePage() {
        this.driver = MobileDriverFactory.getDriver();
        this.wait   = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    // ── Interações básicas ─────────────────────────────────────────

    protected WebElement waitVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected void tap(By locator) {
        waitVisible(locator).click();
    }

    protected void type(By locator, String text) {
        WebElement el = waitVisible(locator);
        el.clear();
        el.sendKeys(text);
    }

    protected String getText(By locator) {
        return waitVisible(locator).getText();
    }

    protected boolean isDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    // ── Gestos mobile via W3C Actions API ─────────────────────────
    // Usando PointerInput em vez de driver.swipe() (deprecated no Appium 2.x)

    /**
     * Swipe up — rola a tela para baixo (conteúdo sobe).
     * Equivalente ao gesto de dedo subindo na tela.
     */
    protected void swipeUp() {
        Dimension size  = driver.manage().window().getSize();
        int centerX     = size.width  / 2;
        int startY      = (int) (size.height * 0.70);
        int endY        = (int) (size.height * 0.30);
        performSwipe(centerX, startY, centerX, endY);
    }

    /**
     * Swipe down — rola a tela para cima (conteúdo desce).
     * Equivalente ao gesto de dedo descendo na tela.
     */
    protected void swipeDown() {
        Dimension size  = driver.manage().window().getSize();
        int centerX     = size.width  / 2;
        int startY      = (int) (size.height * 0.30);
        int endY        = (int) (size.height * 0.70);
        performSwipe(centerX, startY, centerX, endY);
    }

    /**
     * Swipe horizontal da esquerda para a direita (ex: abrir menu lateral).
     */
    protected void swipeRight() {
        Dimension size = driver.manage().window().getSize();
        int centerY    = size.height / 2;
        int startX     = (int) (size.width * 0.10);
        int endX       = (int) (size.width * 0.90);
        performSwipe(startX, centerY, endX, centerY);
    }

    private void performSwipe(int startX, int startY, int endX, int endY) {
        PointerInput finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
        Sequence swipe = new Sequence(finger, 1)
            .addAction(finger.createPointerMove(
                Duration.ZERO, PointerInput.Origin.viewport(), startX, startY))
            .addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()))
            .addAction(finger.createPointerMove(
                Duration.ofMillis(600), PointerInput.Origin.viewport(), endX, endY))
            .addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(List.of(swipe));
    }
}
