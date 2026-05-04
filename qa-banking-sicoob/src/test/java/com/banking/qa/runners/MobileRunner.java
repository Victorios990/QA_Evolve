package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

/**
 * Runner para testes mobile com Appium.
 * Pré-requisito: Appium server rodando em localhost:4723
 *                Emulador Android ativo (adb devices) ou device iOS conectado
 *
 * Executar: mvn test -Dtest=MobileRunner
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/mobile")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.mobile,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/mobile/report.html," +
    "json:target/reports/mobile/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "@mobile and not @ignorar")
public class MobileRunner {}
