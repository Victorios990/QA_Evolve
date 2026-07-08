package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/metricas")
@ConfigurationParameter(key = "cucumber.glue", value =
    "com.banking.qa.steps.metricas," +
    "com.banking.qa.steps.database," +
    "com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/metricas/report.html," +
    "json:target/reports/metricas/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class MetricasRunner {}
