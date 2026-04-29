package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/extrato")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.extrato,com.banking.qa.steps.transferencia,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/extrato/report.html," +
    "json:target/reports/extrato/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class ExtratoRunner {}
