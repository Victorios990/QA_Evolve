package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/auditoria")
@ConfigurationParameter(key = "cucumber.glue", value =
    "com.banking.qa.steps.auditoria," +
    "com.banking.qa.steps.database," +
    "com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/auditoria/report.html," +
    "json:target/reports/auditoria/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class AuditoriaRunner {}
