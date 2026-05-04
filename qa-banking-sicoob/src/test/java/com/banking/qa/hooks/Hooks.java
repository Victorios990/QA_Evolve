package com.banking.qa.hooks;

import com.banking.qa.utils.DatabaseUtils;
import com.banking.qa.utils.DriverFactory;
import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Hooks para testes web. Executados em todos os cenários SEM a tag @mobile.
 * Cenários @mobile têm seus próprios hooks em MobileHooks.
 */
public class Hooks {

    private static final Logger log = LoggerFactory.getLogger(Hooks.class);

    @Before(order = 1, value = "not @mobile")
    public void setup(Scenario scenario) {
        log.info("Iniciando cenário: {}", scenario.getName());
    }

    @After(order = 1, value = "not @mobile")
    public void tearDown(Scenario scenario) {
        // Protege contra cenários que não criaram WebDriver (ex: BancoDados usa apenas JDBC)
        if (DriverFactory.isInitialized()) {
            if (scenario.isFailed()) {
                try {
                    WebDriver driver = DriverFactory.getDriver();
                    byte[] screenshot = ((TakesScreenshot) driver)
                        .getScreenshotAs(OutputType.BYTES);
                    scenario.attach(screenshot, "image/png", "screenshot-falha");
                    log.warn("Cenário falhou: {} — screenshot capturado", scenario.getName());
                } catch (Exception e) {
                    log.error("Erro ao capturar screenshot: {}", e.getMessage());
                }
            }
            DriverFactory.quitDriver();
        }
    }

    @AfterAll
    public static void tearDownAll() {
        DatabaseUtils.closeConnection();
    }
}
