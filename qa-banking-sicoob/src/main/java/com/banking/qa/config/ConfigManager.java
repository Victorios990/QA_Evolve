package com.banking.qa.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigManager {

    private static final Properties props = new Properties();
    private static ConfigManager instance;

    private ConfigManager() {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("config.properties")) {
            if (input != null) props.load(input);
        } catch (IOException e) {
            throw new RuntimeException("Falha ao carregar config.properties", e);
        }
    }

    public static ConfigManager getInstance() {
        if (instance == null) instance = new ConfigManager();
        return instance;
    }

    public String get(String key) {
        return System.getProperty(key, props.getProperty(key, ""));
    }

    public String getBaseUrl()    { return get("base.url"); }
    public String getBrowser()    { return get("browser"); }
    public boolean isHeadless()   { return Boolean.parseBoolean(get("headless")); }
    public String getDbUrl()      { return get("db.url"); }
    public String getDbUser()     { return get("db.user"); }
    public String getDbPassword() { return get("db.password"); }
}
