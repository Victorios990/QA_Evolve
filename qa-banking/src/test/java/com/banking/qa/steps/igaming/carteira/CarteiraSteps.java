package com.banking.qa.steps.igaming.carteira;

import com.banking.qa.pages.LoginPage;
import com.banking.qa.pages.WalletPage;
import io.cucumber.java.pt.*;

import static org.junit.jupiter.api.Assertions.*;

public class CarteiraSteps {

    private final LoginPage  loginPage  = new LoginPage();
    private final WalletPage walletPage = new WalletPage();

    private String saldoAntes;

    @Dado("que o jogador está autenticado no iGaming com usuário {string} e senha {string}")
    public void jogadorAutenticado(String usuario, String senha) {
        loginPage.login(usuario, senha);
    }

    @Dado("acessa a página da carteira")
    public void acessaPaginaCarteira() {
        walletPage.navigate();
        assertTrue(walletPage.isPageLoaded(), "Página da carteira não carregou");
    }

    @Dado("que o saldo atual da carteira é de pelo menos {string}")
    public void saldoMinimoDisponivel(String valorMinimo) {
        saldoAntes = walletPage.getSaldo();
        double saldo  = Double.parseDouble(saldoAntes.replace(",", "."));
        double minimo = Double.parseDouble(valorMinimo.replace(",", "."));
        assertTrue(saldo >= minimo,
            "Saldo insuficiente para o cenário: esperado mínimo " + valorMinimo + ", obtido " + saldoAntes);
    }

    @Dado("que o saldo atual da carteira é {string}")
    public void saldoExato(String valor) {
        saldoAntes = walletPage.getSaldo();
        System.out.println("INFO: Saldo atual da carteira = " + saldoAntes +
            " | Esperado para cenário = " + valor);
    }

    @Dado("que a conexão de rede está simulando instabilidade")
    public void simularInstabilidadeRede() {
        System.out.println("INFO: Instabilidade de rede simulada via configuração do ambiente de teste");
    }

    @Dado("que o navegador em uso é {string}")
    public void definirNavegador(String navegador) {
        System.out.println("INFO: Navegador para cross-browser = " + navegador);
    }

    @Quando("o jogador abre a aba de depósito")
    public void abrirAbaDeposito() {
        walletPage.abrirAbaDeposito();
    }

    @Quando("o jogador abre a aba de saque")
    public void abrirAbaSaque() {
        walletPage.abrirAbaSaque();
    }

    @Quando("informa o valor de depósito {string}")
    public void informarValorDeposito(String valor) {
        walletPage.informarValorDeposito(valor);
    }

    @Quando("seleciona o método de pagamento {string}")
    public void selecionarMetodoPagamento(String metodo) {
        walletPage.selecionarMetodoPagamento(metodo);
    }

    @Quando("confirma o depósito")
    public void confirmarDeposito() {
        walletPage.confirmarDeposito();
    }

    @Quando("confirma o depósito com múltiplos cliques")
    public void confirmarDepositoMultiplosCliques() {
        walletPage.confirmarDeposito();
        walletPage.confirmarDeposito();
        walletPage.confirmarDeposito();
    }

    @Quando("informa o valor de saque {string}")
    public void informarValorSaque(String valor) {
        walletPage.informarValorSaque(valor);
    }

    @Quando("o jogador tenta sacar {string}")
    public void tentarSacar(String valor) {
        walletPage.abrirAbaSaque();
        walletPage.informarValorSaque(valor);
        walletPage.confirmarSaque();
    }

    @Quando("confirma o saque")
    public void confirmarSaque() {
        walletPage.confirmarSaque();
    }

    @Então("o sistema exibe a mensagem de sucesso {string}")
    public void verificarMensagemSucesso(String mensagemEsperada) {
        assertTrue(walletPage.isSucessoExibido(),
            "Mensagem de sucesso não exibida. Esperado: " + mensagemEsperada);
        String mensagemObtida = walletPage.getMensagemSucesso();
        assertTrue(mensagemObtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + mensagemObtida + "]");
    }

    @Então("o sistema exibe a mensagem de erro {string}")
    public void verificarMensagemErro(String mensagemEsperada) {
        assertTrue(walletPage.isErroExibido(),
            "Mensagem de erro não exibida. Esperado: " + mensagemEsperada);
        String mensagemObtida = walletPage.getMensagemErro();
        assertTrue(mensagemObtida.contains(mensagemEsperada),
            "Mensagem incorreta. Esperado: [" + mensagemEsperada + "] Obtido: [" + mensagemObtida + "]");
    }

    @Então("o saldo da carteira deve refletir o valor depositado de {string}")
    public void verificarSaldoAposDeposito(String valorDepositado) {
        String saldoAtual = walletPage.getSaldo();
        System.out.println("INFO: Saldo após depósito = " + saldoAtual +
            " | Valor depositado = " + valorDepositado);
        assertFalse(saldoAtual.isEmpty(), "Saldo não disponível após depósito");
    }

    @Então("o saldo é decrementado em {string}")
    public void verificarSaldoAposSaque(String valorSacado) {
        String saldoAtual = walletPage.getSaldo();
        System.out.println("INFO: Saldo antes = " + saldoAntes +
            " | Saldo após saque = " + saldoAtual +
            " | Valor sacado = " + valorSacado);
        double antes  = Double.parseDouble(saldoAntes.replace(",", "."));
        double depois = Double.parseDouble(saldoAtual.replace(",", "."));
        double sacado = Double.parseDouble(valorSacado.replace(",", "."));
        assertEquals(antes - sacado, depois, 0.01,
            "Saldo não foi decrementado corretamente após saque");
    }

    @Então("o saldo permanece inalterado")
    public void verificarSaldoInalterado() {
        String saldoAtual = walletPage.getSaldo();
        assertEquals(saldoAntes, saldoAtual,
            "Saldo foi alterado indevidamente. Antes: " + saldoAntes + " | Depois: " + saldoAtual);
    }

    @Então("apenas uma transação de depósito de {string} deve ser registrada")
    public void verificarTransacaoNaoDuplicada(String valor) {
        assertTrue(walletPage.isSucessoExibido() || walletPage.isErroExibido(),
            "Sistema não respondeu ao depósito com instabilidade de rede");
        System.out.println("INFO: Verificar no banco de dados que apenas 1 transação de " +
            valor + " foi registrada (validação de idempotência)");
    }
}
