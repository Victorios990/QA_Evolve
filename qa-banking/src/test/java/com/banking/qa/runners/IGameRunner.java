package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

/** Executa toda a suíte iGaming — carteira, histórico, sportsbook e multi-tenant */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/igaming")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.igaming,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/igaming/all/report.html," +
    "json:target/reports/igaming/all/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class IGameRunner {}
