package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/banco_de_dados")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.database,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/banco_de_dados/report.html," +
    "json:target/reports/banco_de_dados/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class BancoDadosRunner {}
