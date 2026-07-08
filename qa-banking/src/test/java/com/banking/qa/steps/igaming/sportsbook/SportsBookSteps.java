package com.banking.qa.steps.igaming.sportsbook;

import com.banking.qa.pages.LoginPage;
import com.banking.qa.pages.SportsBookPage;
import com.banking.qa.pages.TransactionHistoryPage;
import com.banking.qa.pages.WalletPage;
import io.cucumber.java.pt.*;

import static org.junit.jupiter.api.Assertions.*;

public class SportsBookSteps {

    private final LoginPage              loginPage    = new LoginPage();
    private final SportsBookPage         sbPage       = new SportsBookPage();
    private final WalletPage             walletPage   = new WalletPage();
    private final TransactionHistoryPage historicoPage = new TransactionHistoryPage();

    @Dado("que o jogador está autenticado no iGaming com usuário {string} e senha {string}")
    public void jogadorAutenticado(String usuario, String senha) {
        loginPage.login(usuario, senha);
    }

    @Dado("acessa a página de apostas esportivas")
    public void acessarPaginaSportsBook() {
        sbPage.navigate();
        assertTrue(sbPage.isPageLoaded(), "Página de apostas esportivas não carregou");
    }

    @Dado("que o saldo atual da carteira é {string}")
    public void saldoAtual(String valor) {
        walletPage.navigate();
        String saldo = walletPage.getSaldo();
        System.out.println("INFO: Saldo atual = " + saldo + " | Esperado para cenário = " + valor);
        sbPage.navigate();
    }

    @Dado("que o jogador possui uma aposta aberta registrada")
    public void jogadorPossuiApostaAberta() {
        System.out.println("INFO: Cenário requer aposta aberta pré-existente no ambiente de QA");
    }

    @Dado("que o jogador possui uma aposta liquidada")
    public void jogadorPossuiApostaLiquidada() {
        System.out.println("INFO: Cenário requer aposta liquidada pré-existente no ambiente de QA");
    }

    @Quando("o jogador pesquisa pelo evento {string}")
    public void pesquisarEvento(String nomeEvento) {
        sbPage.pesquisarEvento(nomeEvento);
    }

    @Quando("seleciona o primeiro evento da lista")
    public void selecionarPrimeiroEvento() {
        sbPage.selecionarPrimeiroEvento();
    }

    @Quando("o jogador pesquisa por um evento já encerrado")
    public void pesquisarEventoEncerrado() {
        sbPage.pesquisarEvento("EVENTO_ENCERRADO_QA");
    }

    @Quando("informa o valor da aposta {string}")
    public void informarValorAposta(String valor) {
        sbPage.informarValorAposta(valor);
    }

    @Quando("confirma a aposta")
    public void confirmarAposta() {
        sbPage.confirmarAposta();
    }

    @Quando("o jogador acessa suas apostas abertas")
    public void acessarApostasAbertas() {
        sbPage.abrirApostasAbertas();
    }

    @Quando("seleciona a primeira aposta aberta")
    public void selecionarPrimeiraApostaAberta() {
        sbPage.selecionarPrimeiraApostaAberta();
    }

    @Quando("cancela a aposta")
    public void cancelarAposta() {
        sbPage.cancelarAposta();
    }

    @Quando("as odds são alteradas pelo sistema enquanto o jogador preenche o valor")
    public void simularMudancaDeOdds() {
        System.out.println("INFO: Mudança de odds simulada pelo ambiente de QA durante o preenchimento");
    }

    @Quando("o jogador acessa a página de histórico de transações")
    public void acessarHistoricoTransacoes() {
        historicoPage.navigate();
    }

    @Quando("filtra por tipo {string}")
    public void filtrarPorTipo(String tipo) {
        historicoPage.filtrarPorTipo(tipo);
    }

    @Quando("aplica os filtros")
    public void aplicarFiltros() {
        historicoPage.aplicarFiltros();
    }

    @Então("o sistema exibe a mensagem de sucesso {string}")
    public void verificarMensagemSucesso(String mensagemEsperada) {
        assertTrue(sbPage.isSucessoExibido(),
            "Mensagem de sucesso não exibida. Esperado: " + mensagemEsperada);
        String obtida = sbPage.getMensagemSucesso();
        assertTrue(obtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + obtida + "]");
    }

    @Então("o sistema exibe a mensagem de erro {string}")
    public void verificarMensagemErro(String mensagemEsperada) {
        assertTrue(sbPage.isErroExibido(),
            "Mensagem de erro não exibida. Esperado: " + mensagemEsperada);
        String obtida = sbPage.getMensagemErro();
        assertTrue(obtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + obtida + "]");
    }

    @Então("as odds do evento devem ser exibidas e maiores que {string}")
    public void verificarOddsExibidas(String oddsMinimas) {
        String odds = sbPage.getOdds();
        assertFalse(odds.isEmpty(), "Odds do evento não foram exibidas");
        double oddsValor = Double.parseDouble(odds.replace(",", "."));
        double minimo    = Double.parseDouble(oddsMinimas.replace(",", "."));
        assertTrue(oddsValor > minimo,
            "Odds inválidas. Obtido: " + oddsValor + " | Mínimo esperado: " + minimo);
    }

    @Então("o sistema indica que o evento não está disponível para apostas")
    public void verificarEventoIndisponivel() {
        assertTrue(sbPage.isEventoIndisponivel() || sbPage.isErroExibido(),
            "Sistema não indicou que o evento está encerrado/indisponível");
        System.out.println("PASS: Sistema corretamente bloqueou aposta em evento indisponível");
    }

    @Então("o sistema exibe alerta de que as odds foram alteradas")
    public void verificarAlertaOddsAlteradas() {
        assertTrue(sbPage.isOddsAlteradas(),
            "Alerta de mudança de odds não foi exibido");
        System.out.println("PASS: Alerta de odds alteradas exibido corretamente");
    }

    @Então("a aposta liquidada deve aparecer no histórico")
    public void verificarApostaLiquidadaNoHistorico() {
        String tipo = historicoPage.getTipoPrimeiraTransacao();
        assertTrue(tipo.toLowerCase().contains("aposta"),
            "Aposta liquidada não encontrada no histórico. Tipo obtido: " + tipo);
        System.out.println("PASS: Aposta liquidada encontrada no histórico: " + tipo);
    }
}
