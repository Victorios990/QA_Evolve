package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/login")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.login,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/login/report.html," +
    "json:target/reports/login/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class LoginRunner {}
