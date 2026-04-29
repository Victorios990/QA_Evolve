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

public class Hooks {

    @Before(order = 1)
    public void setup(Scenario scenario) {
        System.out.println("Iniciando cenário: " + scenario.getName());
    }

    @After(order = 1)
    public void tearDown(Scenario scenario) {
        // Captura screenshot em falha
        if (scenario.isFailed()) {
            try {
                WebDriver driver = DriverFactory.getDriver();
                byte[] screenshot = ((TakesScreenshot) driver)
                    .getScreenshotAs(OutputType.BYTES);
                scenario.attach(screenshot, "image/png", "screenshot-falha");
            } catch (Exception e) {
                System.out.println("Erro ao capturar screenshot: " + e.getMessage());
            }
        }
        DriverFactory.quitDriver();
    }

    @AfterAll
    public static void tearDownAll() {
        DatabaseUtils.closeConnection();
    }
}
