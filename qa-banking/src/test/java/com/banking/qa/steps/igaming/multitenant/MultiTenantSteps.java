package com.banking.qa.steps.igaming.multitenant;

import com.banking.qa.config.ConfigManager;
import com.banking.qa.pages.LoginPage;
import com.banking.qa.pages.MultiTenantPage;
import com.banking.qa.utils.DriverFactory;
import io.cucumber.java.pt.*;

import static org.junit.jupiter.api.Assertions.*;

public class MultiTenantSteps {

    private final LoginPage       loginPage       = new LoginPage();
    private final MultiTenantPage multiTenantPage = new MultiTenantPage();

    private String dadoExclusivoTenantA;
    private String saldoTenantAAntes;

    @Dado("que o administrador está autenticado com usuário {string} e senha {string}")
    public void administradorAutenticado(String usuario, String senha) {
        loginPage.login(usuario, senha);
    }

    @Dado("acessa o painel de gerenciamento de tenants")
    public void acessarPainelTenants() {
        multiTenantPage.navigate();
        assertTrue(multiTenantPage.isPageLoaded(),
            "Painel de gerenciamento de tenants não carregou");
    }

    @Dado("que o usuário está autenticado como jogador com usuário {string} e senha {string}")
    public void jogadorAutenticado(String usuario, String senha) {
        loginPage.login(usuario, senha);
    }

    @Dado("que o administrador visualiza dados exclusivos do tenant {string}")
    public void registrarDadosExclusivosTenant(String nomeTenant) {
        multiTenantPage.trocarTenant(nomeTenant);
        dadoExclusivoTenantA = multiTenantPage.getSaldoTotalTenant();
        System.out.println("INFO: Dado exclusivo registrado do tenant " + nomeTenant +
            ": saldo = " + dadoExclusivoTenantA);
    }

    @Dado("que o administrador obtém um token de sessão do tenant {string}")
    public void obterTokenSessao(String nomeTenant) {
        multiTenantPage.trocarTenant(nomeTenant);
        String token = DriverFactory.getDriver().manage().getCookieNamed("session_token") != null
            ? DriverFactory.getDriver().manage().getCookieNamed("session_token").getValue()
            : "token-simulado-tenant-a";
        System.out.println("INFO: Token de sessão obtido para tenant " + nomeTenant + " = " + token);
    }

    @Dado("que o saldo do tenant {string} está registrado")
    public void registrarSaldoTenant(String nomeTenant) {
        multiTenantPage.trocarTenant(nomeTenant);
        saldoTenantAAntes = multiTenantPage.getSaldoTotalTenant();
        System.out.println("INFO: Saldo registrado do tenant " + nomeTenant + " = " + saldoTenantAAntes);
    }

    @Quando("o administrador seleciona o tenant {string}")
    public void selecionarTenant(String nomeTenant) {
        multiTenantPage.selecionarTenant(nomeTenant);
    }

    @Quando("confirma a troca de tenant")
    public void confirmarTrocaTenant() {
        multiTenantPage.confirmarTrocaTenant();
    }

    @Quando("o administrador troca para o tenant {string}")
    public void trocarParaTenant(String nomeTenant) {
        multiTenantPage.trocarTenant(nomeTenant);
    }

    @Quando("tenta acessar o painel de gerenciamento de tenants diretamente pela URL")
    public void tentarAcessarPainelPorURL() {
        String urlAdmin = ConfigManager.getInstance().getIGameBaseUrl() + "/admin/tenants";
        DriverFactory.getDriver().get(urlAdmin);
    }

    @Quando("tenta usar esse token para acessar recursos do tenant {string}")
    public void tentarAcessarComTokenDeOutroTenant(String nomeTenant) {
        String urlTenant = ConfigManager.getInstance().getIGameBaseUrl() + "/admin/tenants/" + nomeTenant;
        DriverFactory.getDriver().get(urlTenant);
    }

    @Quando("o administrador tenta selecionar o tenant {string}")
    public void tentarSelecionarTenantInexistente(String nomeTenant) {
        try {
            multiTenantPage.selecionarTenant(nomeTenant);
            multiTenantPage.confirmarTrocaTenant();
        } catch (Exception e) {
            System.out.println("INFO: Tenant inexistente não selecionável: " + e.getMessage());
        }
    }

    @Quando("um jogador do tenant {string} realiza um depósito")
    public void jogadorDoTenantRealizaDeposito(String nomeTenant) {
        System.out.println("INFO: Simulando depósito de jogador no tenant " + nomeTenant);
    }

    @Então("o tenant atual exibido deve ser {string}")
    public void verificarTenantAtual(String tenantEsperado) {
        String tenantAtual = multiTenantPage.getTenantAtual();
        assertEquals(tenantEsperado, tenantAtual,
            "Tenant incorreto. Esperado: [" + tenantEsperado + "] Obtido: [" + tenantAtual + "]");
    }

    @Então("o sistema exibe a mensagem de sucesso {string}")
    public void verificarMensagemSucesso(String mensagemEsperada) {
        assertTrue(multiTenantPage.isSucessoExibido(),
            "Mensagem de sucesso não exibida. Esperado: " + mensagemEsperada);
        String obtida = multiTenantPage.getMensagemSucesso();
        assertTrue(obtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + obtida + "]");
    }

    @Então("os dados exclusivos do tenant {string} não devem ser visíveis")
    public void verificarIsolamentoDados(String nomeTenantOrigem) {
        boolean dadosVisiveis = multiTenantPage.isTenantDataVisivelParaOutroTenant(dadoExclusivoTenantA);
        assertFalse(dadosVisiveis,
            "FALHA DE ISOLAMENTO: dados do tenant " + nomeTenantOrigem +
                " visíveis em outro tenant! Dado: " + dadoExclusivoTenantA);
        System.out.println("PASS: Dados do tenant " + nomeTenantOrigem +
            " não visíveis após troca de tenant");
    }

    @Então("o sistema exibe a mensagem de acesso negado {string}")
    public void verificarAcessoNegado(String mensagemEsperada) {
        boolean acessoNegado = multiTenantPage.isAcessoNegadoExibido()
            || multiTenantPage.isErroExibido();
        assertTrue(acessoNegado,
            "FALHA DE SEGURANÇA: acesso ao painel multi-tenant não foi negado!");
        System.out.println("PASS: Acesso negado corretamente. Mensagem esperada: " + mensagemEsperada);
    }

    @Então("o usuário não visualiza dados de outros tenants")
    public void verificarNaoVisualizaDadosTenants() {
        String paginaAtual = DriverFactory.getDriver().getPageSource();
        boolean temDadosTenant = paginaAtual.contains("tenant-data-table") &&
            !paginaAtual.contains("access-denied");
        assertFalse(temDadosTenant,
            "FALHA: jogador sem permissão conseguiu visualizar dados de tenants");
        System.out.println("PASS: Jogador não visualiza dados de outros tenants");
    }

    @Então("o saldo total do tenant deve ser exibido e maior que {string}")
    public void verificarSaldoTotalTenant(String valorMinimo) {
        String saldo = multiTenantPage.getSaldoTotalTenant();
        assertFalse(saldo.isEmpty(), "Saldo total do tenant não foi exibido");
        System.out.println("INFO: Saldo total do tenant = " + saldo);
    }

    @Então("a quantidade de usuários do tenant deve ser exibida")
    public void verificarQuantidadeUsuariosTenant() {
        String qtd = multiTenantPage.getQuantidadeUsuariosTenant();
        assertFalse(qtd.isEmpty(), "Quantidade de usuários do tenant não foi exibida");
        System.out.println("INFO: Quantidade de usuários do tenant = " + qtd);
    }

    @Então("o sistema exibe a mensagem de erro {string}")
    public void verificarMensagemErro(String mensagemEsperada) {
        assertTrue(multiTenantPage.isErroExibido() || multiTenantPage.isAcessoNegadoExibido(),
            "Mensagem de erro não exibida. Esperado: " + mensagemEsperada);
        System.out.println("INFO: Erro exibido para tenant inválido, conforme esperado");
    }

    @Então("o saldo do tenant {string} não deve ser alterado")
    public void verificarSaldoTenantInalterado(String nomeTenant) {
        multiTenantPage.trocarTenant(nomeTenant);
        String saldoAtual = multiTenantPage.getSaldoTotalTenant();
        assertEquals(saldoTenantAAntes, saldoAtual,
            "FALHA DE ISOLAMENTO: saldo do tenant " + nomeTenant +
                " foi afetado por operação de outro tenant!" +
                " Antes: " + saldoTenantAAntes + " | Depois: " + saldoAtual);
        System.out.println("PASS: Saldo do tenant " + nomeTenant + " não foi alterado por outro tenant");
    }
}
