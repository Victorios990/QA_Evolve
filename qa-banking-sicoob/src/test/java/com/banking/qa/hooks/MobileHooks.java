package com.banking.qa.hooks;

import com.banking.qa.mobile.driver.MobileDriverFactory;
import io.appium.java_client.AppiumDriver;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Hooks exclusivos para cenários mobile (@mobile).
 * Gerencia ciclo de vida do AppiumDriver separado do WebDriver de testes web.
 */
public class MobileHooks {

    private static final Logger log = LoggerFactory.getLogger(MobileHooks.class);

    @Before(order = 1, value = "@mobile")
    public void setup(Scenario scenario) {
        log.info("Iniciando cenário mobile: {}", scenario.getName());
    }

    @After(order = 1, value = "@mobile")
    public void tearDown(Scenario scenario) {
        if (scenario.isFailed()) {
            try {
                AppiumDriver driver = MobileDriverFactory.getDriver();
                byte[] screenshot = ((TakesScreenshot) driver)
                    .getScreenshotAs(OutputType.BYTES);
                scenario.attach(screenshot, "image/png", "screenshot-falha-mobile");
                log.warn("Cenário mobile falhou: {} — screenshot capturado", scenario.getName());
            } catch (Exception e) {
                log.error("Erro ao capturar screenshot mobile: {}", e.getMessage());
            }
        }
        MobileDriverFactory.quitDriver();
    }
}
