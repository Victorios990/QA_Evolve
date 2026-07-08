package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/abertura_conta")
@ConfigurationParameter(key = "cucumber.glue", value =
    "com.banking.qa.steps.abertura," +
    "com.banking.qa.steps.transferencia," +
    "com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/abertura_conta/report.html," +
    "json:target/reports/abertura_conta/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class AberturaContaRunner {}
