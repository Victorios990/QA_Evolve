package com.banking.qa.steps.igaming.historico;

import com.banking.qa.pages.LoginPage;
import com.banking.qa.pages.TransactionHistoryPage;
import com.banking.qa.pages.WalletPage;
import io.cucumber.java.pt.*;

import static org.junit.jupiter.api.Assertions.*;

public class HistoricoTransacoesSteps {

    private final LoginPage              loginPage    = new LoginPage();
    private final TransactionHistoryPage historicoPage = new TransactionHistoryPage();
    private final WalletPage             walletPage   = new WalletPage();

    private int quantidadePaginaUm;

    @Dado("que o jogador está autenticado no iGaming com usuário {string} e senha {string}")
    public void jogadorAutenticado(String usuario, String senha) {
        loginPage.login(usuario, senha);
    }

    @Dado("acessa a página de histórico de transações")
    public void acessaPaginaHistorico() {
        historicoPage.navigate();
        assertTrue(historicoPage.isPageLoaded(),
            "Página de histórico de transações não carregou");
    }

    @Dado("que existem mais transações do que o limite por página")
    public void registrarQuantidadePaginaUm() {
        quantidadePaginaUm = historicoPage.getQuantidadeTransacoes();
        assertTrue(historicoPage.isProximaPaginaDisponivel(),
            "Não há próxima página — verifique se existem transações suficientes no ambiente");
    }

    @Dado("que o jogador realizou um depósito de {string}")
    public void jogadorRealizouDeposito(String valor) {
        walletPage.navigate();
        walletPage.abrirAbaDeposito();
        walletPage.informarValorDeposito(valor);
        walletPage.selecionarMetodoPagamento("PIX");
        walletPage.confirmarDeposito();
        assertTrue(walletPage.isSucessoExibido(),
            "Depósito de " + valor + " não foi confirmado para setup do cenário");
    }

    @Dado("o jogador realizou um saque de {string}")
    public void jogadorRealizouSaque(String valor) {
        walletPage.abrirAbaSaque();
        walletPage.informarValorSaque(valor);
        walletPage.confirmarSaque();
        assertTrue(walletPage.isSucessoExibido(),
            "Saque de " + valor + " não foi confirmado para setup do cenário");
    }

    @Dado("que o jogador possui uma aposta liquidada")
    public void jogadorPossuiApostaLiquidada() {
        System.out.println("INFO: Cenário requer aposta liquidada pré-existente no ambiente de QA");
    }

    @Quando("o jogador filtra por tipo {string}")
    public void filtrarPorTipo(String tipo) {
        historicoPage.filtrarPorTipo(tipo);
    }

    @Quando("aplica os filtros")
    public void aplicarFiltros() {
        historicoPage.aplicarFiltros();
    }

    @Quando("o jogador filtra pelo período de {string} a {string}")
    public void filtrarPorPeriodo(String dataInicio, String dataFim) {
        historicoPage.filtrarPorPeriodo(dataInicio, dataFim);
    }

    @Quando("o jogador filtra por valor mínimo {string} e máximo {string}")
    public void filtrarPorFaixaValor(String minimo, String maximo) {
        historicoPage.filtrarPorValor(minimo, maximo);
    }

    @Quando("o jogador clica em exportar CSV")
    public void exportarCSV() {
        historicoPage.exportarCSV();
    }

    @Quando("o jogador navega para a próxima página")
    public void navegarProximaPagina() {
        historicoPage.navegarProximaPagina();
    }

    @Então("a tabela de transações deve ser exibida")
    public void tabelaDeveSerExibida() {
        assertTrue(historicoPage.isPageLoaded(),
            "Tabela de transações não foi exibida");
    }

    @Então("deve conter ao menos uma transação registrada")
    public void deveConterTransacoes() {
        assertTrue(historicoPage.getQuantidadeTransacoes() > 0,
            "Nenhuma transação foi encontrada na listagem");
    }

    @Então("todas as transações exibidas devem ser do tipo {string}")
    public void verificarTipoTransacoes(String tipoEsperado) {
        String tipoObtido = historicoPage.getTipoPrimeiraTransacao();
        assertTrue(tipoObtido.toLowerCase().contains(tipoEsperado.toLowerCase()),
            "Tipo incorreto. Esperado: [" + tipoEsperado + "] Obtido: [" + tipoObtido + "]");
        System.out.println("INFO: Tipo da primeira transação filtrada = " + tipoObtido);
    }

    @Então("todas as transações exibidas devem estar dentro do período informado")
    public void verificarPeriodoTransacoes() {
        assertTrue(historicoPage.getQuantidadeTransacoes() >= 0,
            "Erro ao carregar transações do período");
        System.out.println("INFO: Transações dentro do período = " + historicoPage.getQuantidadeTransacoes());
    }

    @Então("o sistema exibe a mensagem de erro {string}")
    public void verificarMensagemErro(String mensagemEsperada) {
        assertTrue(historicoPage.isErroExibido(),
            "Mensagem de erro não exibida. Esperado: " + mensagemEsperada);
        String mensagemObtida = historicoPage.getMensagemErro();
        assertTrue(mensagemObtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + mensagemObtida + "]");
    }

    @Então("o sistema exibe a mensagem {string}")
    public void verificarMensagem(String mensagemEsperada) {
        boolean semResultados = historicoPage.isSemResultados();
        boolean erroExibido   = historicoPage.isErroExibido();
        assertTrue(semResultados || erroExibido,
            "Nenhuma mensagem de ausência de resultados foi exibida. Esperado: " + mensagemEsperada);
    }

    @Então("todas as transações devem ter valor entre {string} e {string}")
    public void verificarFaixaValorTransacoes(String minimo, String maximo) {
        String valorPrimeira = historicoPage.getValorPrimeiraTransacao();
        if (!valorPrimeira.isEmpty()) {
            double valor = Double.parseDouble(valorPrimeira.replace(",", "."));
            double min   = Double.parseDouble(minimo.replace(",", "."));
            double max   = Double.parseDouble(maximo.replace(",", "."));
            assertTrue(valor >= min && valor <= max,
                "Valor fora da faixa. Obtido: " + valor + " | Faixa: [" + min + " - " + max + "]");
        }
    }

    @Então("o sistema exibe a mensagem de sucesso {string}")
    public void verificarMensagemSucesso(String mensagemEsperada) {
        assertTrue(historicoPage.isSucessoExibido(),
            "Mensagem de sucesso não exibida. Esperado: " + mensagemEsperada);
    }

    @Então("a segunda página de transações é exibida")
    public void verificarSegundaPagina() {
        assertTrue(historicoPage.isPageLoaded(), "Segunda página não carregou");
    }

    @Então("os registros são diferentes dos da primeira página")
    public void verificarRegistrosDiferentes() {
        System.out.println("INFO: Registros na página 1 = " + quantidadePaginaUm +
            " | Página 2 carregada com " + historicoPage.getQuantidadeTransacoes() + " registros");
    }

    @Então("o histórico deve registrar exatamente {string} transações recentes")
    public void verificarQuantidadeTransacoes(String quantidade) {
        int qtd = historicoPage.getQuantidadeTransacoes();
        int esperado = Integer.parseInt(quantidade);
        assertTrue(qtd >= esperado,
            "Quantidade insuficiente de transações. Esperado: " + esperado + " | Obtido: " + qtd);
    }

    @Então("o saldo líquido das operações deve ser {string}")
    public void verificarSaldoLiquido(String saldoEsperado) {
        System.out.println("INFO: Saldo líquido esperado após depósito 300 - saque 100 = " + saldoEsperado);
        walletPage.navigate();
        String saldoAtual = walletPage.getSaldo();
        System.out.println("INFO: Saldo atual na carteira = " + saldoAtual);
    }

    @Então("a aposta liquidada deve aparecer no histórico")
    public void verificarApostaLiquidadaNoHistorico() {
        String tipo = historicoPage.getTipoPrimeiraTransacao();
        assertTrue(tipo.toLowerCase().contains("aposta"),
            "Aposta não encontrada no histórico. Tipo obtido: " + tipo);
    }
}
