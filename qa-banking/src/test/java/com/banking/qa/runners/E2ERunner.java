package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/e2e")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.e2e,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/e2e/report.html," +
    "json:target/reports/e2e/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class E2ERunner {}
