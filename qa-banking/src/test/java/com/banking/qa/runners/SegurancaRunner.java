package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/seguranca")
@ConfigurationParameter(key = "cucumber.glue", value =
    "com.banking.qa.steps.seguranca," +
    "com.banking.qa.steps.login," +
    "com.banking.qa.steps.transferencia," +
    "com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/seguranca/report.html," +
    "json:target/reports/seguranca/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class SegurancaRunner {}
