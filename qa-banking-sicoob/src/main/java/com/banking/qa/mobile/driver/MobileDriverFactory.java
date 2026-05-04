package com.banking.qa.mobile.driver;

import com.banking.qa.config.ConfigManager;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import io.appium.java_client.ios.IOSDriver;
import io.appium.java_client.ios.options.XCUITestOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Gerencia o ciclo de vida do AppiumDriver (Android/iOS).
 * Thread-safe via ThreadLocal — suporta execução paralela de cenários mobile.
 */
public class MobileDriverFactory {

    private static final Logger log = LoggerFactory.getLogger(MobileDriverFactory.class);
    private static final ThreadLocal<AppiumDriver> driverThread = new ThreadLocal<>();

    public static AppiumDriver getDriver() {
        if (driverThread.get() == null) {
            initDriver();
        }
        return driverThread.get();
    }

    public static boolean isInitialized() {
        return driverThread.get() != null;
    }

    private static void initDriver() {
        ConfigManager config = ConfigManager.getInstance();
        String platform  = config.get("mobile.platform").toLowerCase();
        String serverUrl = config.get("appium.server.url");

        log.info("Iniciando driver mobile — plataforma: {} | server: {}", platform, serverUrl);

        try {
            URL url = new URL(serverUrl);

            if ("android".equals(platform)) {
                driverThread.set(createAndroidDriver(url, config));
            } else if ("ios".equals(platform)) {
                driverThread.set(createIOSDriver(url, config));
            } else {
                throw new IllegalArgumentException("Plataforma não suportada: " + platform
                    + ". Use 'android' ou 'ios' em config.properties");
            }

            log.info("Driver mobile iniciado com sucesso");

        } catch (MalformedURLException e) {
            throw new RuntimeException("URL do servidor Appium inválida: " + serverUrl
                + "\nVerifique se o Appium está rodando: appium --port 4723", e);
        }
    }

    private static AndroidDriver createAndroidDriver(URL serverUrl, ConfigManager config) {
        UiAutomator2Options options = new UiAutomator2Options()
            .setDeviceName(config.get("mobile.device.name"))
            .setPlatformVersion(config.get("mobile.platform.version"))
            .setApp(resolveAppPath(config.get("mobile.app.path")))
            .setAppPackage(config.get("mobile.app.package"))
            .setAppActivity(config.get("mobile.app.activity"))
            .setAutoGrantPermissions(true)
            .setNoReset(false);
        return new AndroidDriver(serverUrl, options);
    }

    private static IOSDriver createIOSDriver(URL serverUrl, ConfigManager config) {
        XCUITestOptions options = new XCUITestOptions()
            .setDeviceName(config.get("mobile.device.name"))
            .setPlatformVersion(config.get("mobile.platform.version"))
            .setApp(resolveAppPath(config.get("mobile.app.path")))
            .setBundleId(config.get("mobile.bundle.id"))
            .setNoReset(false);
        return new IOSDriver(serverUrl, options);
    }

    private static String resolveAppPath(String relativePath) {
        File appFile = new File(relativePath).isAbsolute()
            ? new File(relativePath)
            : new File(System.getProperty("user.dir"), relativePath);

        if (!appFile.exists()) {
            throw new RuntimeException("APK/IPA não encontrado: " + appFile.getAbsolutePath()
                + "\nBaixe o app de treino em: https://github.com/saucelabs/my-demo-app-rn/releases");
        }
        return appFile.getAbsolutePath();
    }

    public static void quitDriver() {
        AppiumDriver driver = driverThread.get();
        if (driver != null) {
            driver.quit();
            driverThread.remove();
            log.info("Driver mobile encerrado");
        }
    }
}
