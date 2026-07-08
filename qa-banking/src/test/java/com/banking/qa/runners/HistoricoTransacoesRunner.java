package com.banking.qa.runners;

import org.junit.platform.suite.api.*;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features/igaming/historico")
@ConfigurationParameter(key = "cucumber.glue", value = "com.banking.qa.steps.igaming.historico,com.banking.qa.hooks")
@ConfigurationParameter(key = "cucumber.plugin", value =
    "pretty," +
    "html:target/reports/igaming/historico/report.html," +
    "json:target/reports/igaming/historico/report.json," +
    "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
@ConfigurationParameter(key = "cucumber.filter.tags", value = "not @ignorar")
public class HistoricoTransacoesRunner {}
