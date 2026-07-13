package com.banking.qa.utils;

import com.banking.qa.config.ConfigManager;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;

public class DriverFactory {

    private static final ThreadLocal<WebDriver> driverThread = new ThreadLocal<>();

    public static WebDriver getDriver() {
        if (driverThread.get() == null) {
            driverThread.set(createDriver());
        }
        return driverThread.get();
    }

    public static WebDriver getDriver(String browserOverride) {
        if (driverThread.get() == null) {
            driverThread.set(createDriver(browserOverride));
        }
        return driverThread.get();
    }

    private static WebDriver createDriver() {
        return createDriver(ConfigManager.getInstance().getBrowser());
    }

    private static WebDriver createDriver(String browser) {
        boolean headless = ConfigManager.getInstance().isHeadless();

        return switch (browser.toLowerCase()) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions opts = new FirefoxOptions();
                if (headless) opts.addArguments("--headless");
                yield new FirefoxDriver(opts);
            }
            case "edge" -> {
                WebDriverManager.edgedriver().setup();
                EdgeOptions opts = new EdgeOptions();
                if (headless) opts.addArguments("--headless=new");
                opts.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--window-size=1920,1080");
                yield new EdgeDriver(opts);
            }
            default -> {
                WebDriverManager.chromedriver().setup();
                ChromeOptions opts = new ChromeOptions();
                if (headless) opts.addArguments("--headless=new");
                opts.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--window-size=1920,1080");
                yield new ChromeDriver(opts);
            }
        };
    }

    public static void quitDriver() {
        WebDriver driver = driverThread.get();
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception ignored) {
            } finally {
                driverThread.remove();
            }
        }
    }
}
