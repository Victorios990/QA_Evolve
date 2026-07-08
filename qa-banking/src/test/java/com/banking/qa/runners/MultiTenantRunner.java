package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/igaming/multitenant")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.igaming.multitenant,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/igaming/multitenant/report.html," +
    "json:target/reports/igaming/multitenant/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class MultiTenantRunner {}
