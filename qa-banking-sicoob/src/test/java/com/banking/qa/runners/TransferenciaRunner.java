package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/transferencia")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.transferencia,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/transferencia/report.html," +
    "json:target/reports/transferencia/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @bug and not @ignorar")
public class TransferenciaRunner {}
