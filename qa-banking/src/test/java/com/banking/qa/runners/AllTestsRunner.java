package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

/** Executa toda a suíte — usado no pipeline CI/CD */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/all/report.html," +
    "json:target/reports/all/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class AllTestsRunner {}
