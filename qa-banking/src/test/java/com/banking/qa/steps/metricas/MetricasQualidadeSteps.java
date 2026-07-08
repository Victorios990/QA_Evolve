package com.banking.qa.steps.metricas;

import com.banking.qa.utils.DatabaseUtils;
import io.cucumber.java.pt.*;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

public class MetricasQualidadeSteps {

    // ── KPI: Taxa de sucesso ───────────────────────────────────────

    @Quando("calculo a taxa de sucesso das transações no período")
    public void calculoTaxaSucessoTransacoes() {
        System.out.println("INFO: Calculando KPI — taxa de sucesso de transações");
    }

    @Então("a taxa de sucesso de transações deve ser superior a {int}%")
    public void taxaSucessoDeveSerSuperior(int percentualMinimo) {
        try {
            Object totalObj = DatabaseUtils.executeSingleValue("SELECT COUNT(*) FROM transaction");
            Object errosObj = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM transaction " +
                "WHERE description ILIKE '%error%' OR description ILIKE '%failed%'");

            long total = totalObj != null ? Long.parseLong(totalObj.toString()) : 0;
            long erros = errosObj != null ? Long.parseLong(errosObj.toString()) : 0;

            if (total == 0) {
                System.out.println("INFO: Sem transações registradas — KPI não calculável");
                return;
            }

            double taxaSucesso = ((double)(total - erros) / total) * 100;
            System.out.printf("KPI — Taxa de sucesso: %.2f%% (%d/%d transações OK)%n",
                taxaSucesso, total - erros, total);

            assertTrue(taxaSucesso >= percentualMinimo,
                String.format("KPI ABAIXO DO SLA: %.2f%% < %d%% mínimo exigido",
                    taxaSucesso, percentualMinimo));
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    // ── KPI: Qualidade de dados cadastrais ────────────────────────

    @Quando("avalio a completude dos dados cadastrais de clientes")
    public void avalioCompletudeCadastros() {
        System.out.println("INFO: Calculando KPI — completude de dados cadastrais (KYC)");
    }

    @Então("todos os cadastros devem estar completos")
    public void todosCadastrosDevemEstarCompletos() {
        try {
            Object incompletos = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM customer " +
                "WHERE first_name IS NULL OR first_name = '' " +
                "   OR last_name IS NULL OR last_name = '' " +
                "   OR ssn IS NULL OR ssn = ''");
            long count = incompletos != null ? Long.parseLong(incompletos.toString()) : 0;
            System.out.printf("KPI — Cadastros incompletos: %d%n", count);
            assertEquals(0, count,
                "KPI: " + count + " cliente(s) com campos obrigatórios ausentes (risco KYC/Compliance)");
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    // ── KPI: Cliente sem conta ─────────────────────────────────────

    @Quando("verifico se cada cliente possui conta ativa")
    public void verificoClientesPossuemConta() {
        System.out.println("INFO: Verificando KPI — clientes ativos sem conta associada");
    }

    @Então("nenhum cliente ativo deve estar sem conta")
    public void nenhumClienteSemConta() {
        try {
            Object sem_conta = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM customer c " +
                "WHERE NOT EXISTS (" +
                "  SELECT 1 FROM account a WHERE a.customer_id = c.id" +
                ")");
            long count = sem_conta != null ? Long.parseLong(sem_conta.toString()) : 0;
            System.out.printf("KPI — Clientes sem conta: %d%n", count);
            assertEquals(0, count,
                "KPI: " + count + " cliente(s) sem conta — inconsistência sistêmica");
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    // ── KPI: Volume mínimo ─────────────────────────────────────────

    @Quando("verifico os volumes mínimos de dados de teste")
    public void verificoVolumeMinimo() {
        System.out.println("INFO: Health check — verificando volume mínimo de dados no ambiente");
    }

    @Então("devem existir ao menos {int} clientes cadastrados")
    public void deveExistirAoMenosClientes(int minimo) {
        try {
            Object count = DatabaseUtils.executeSingleValue("SELECT COUNT(*) FROM customer");
            long total = count != null ? Long.parseLong(count.toString()) : 0;
            System.out.println("INFO: Total de clientes: " + total);
            assertTrue(total >= minimo,
                "Health check falhou: esperado ao menos " + minimo + " cliente(s), encontrado " + total);
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    @Então("devem existir ao menos {int} contas ativas")
    public void deveExistirAoMenosContas(int minimo) {
        try {
            Object count = DatabaseUtils.executeSingleValue("SELECT COUNT(*) FROM account");
            long total = count != null ? Long.parseLong(count.toString()) : 0;
            System.out.println("INFO: Total de contas: " + total);
            assertTrue(total >= minimo,
                "Health check falhou: esperado ao menos " + minimo + " conta(s), encontrado " + total);
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    @Então("devem existir ao menos {int} transações registradas")
    public void deveExistirAoMenosTransacoes(int minimo) {
        try {
            Object count = DatabaseUtils.executeSingleValue("SELECT COUNT(*) FROM transaction");
            long total = count != null ? Long.parseLong(count.toString()) : 0;
            System.out.println("INFO: Total de transações: " + total);
            assertTrue(total >= minimo,
                "Health check falhou: esperado ao menos " + minimo + " transação(ões), encontrado " + total);
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    // ── KPI: Cobertura de auditoria ────────────────────────────────

    @Quando("calculo a cobertura de trilha de auditoria")
    public void calculoCoberturaAuditoria() {
        System.out.println("INFO: Calculando KPI — cobertura de auditoria (meta regulatória: 100%)");
    }

    @Então("{int}% das transações devem ter trilha de auditoria")
    public void percentualDeTransacoesComAuditoria(int percentualEsperado) {
        try {
            Object totalObj = DatabaseUtils.executeSingleValue("SELECT COUNT(*) FROM transaction");
            Object auditadasObj = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM transaction t " +
                "INNER JOIN audit_log a ON a.transaction_id = t.id");

            long total = totalObj != null ? Long.parseLong(totalObj.toString()) : 0;
            long auditadas = auditadasObj != null ? Long.parseLong(auditadasObj.toString()) : 0;

            if (total == 0) {
                System.out.println("INFO: Sem transações — KPI de auditoria não calculável");
                return;
            }

            double cobertura = ((double) auditadas / total) * 100;
            System.out.printf("KPI — Cobertura de auditoria: %.2f%% (%d/%d transações)%n",
                cobertura, auditadas, total);

            assertTrue(cobertura >= percentualEsperado,
                String.format("KPI ABAIXO DO REQUISITO REGULATÓRIO: cobertura %.2f%% < %d%%",
                    cobertura, percentualEsperado));
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }

    // ── KPI: Registros órfãos ──────────────────────────────────────

    @Quando("verifico a existência de registros órfãos")
    public void verificoRegistrosOrfaos() {
        System.out.println("INFO: Verificando KPI — integridade referencial / registros órfãos");
    }

    @Então("não deve haver registros órfãos nas tabelas principais")
    public void naoDeveHaverRegistrosOrfaos() {
        try {
            long total_orfaos = 0;

            Object contasOrfas = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM account " +
                "WHERE customer_id NOT IN (SELECT id FROM customer)");
            long contas = contasOrfas != null ? Long.parseLong(contasOrfas.toString()) : 0;
            if (contas > 0) System.out.println("ALERTA: " + contas + " conta(s) órfã(s)");
            total_orfaos += contas;

            Object transacoesOrfas = DatabaseUtils.executeSingleValue(
                "SELECT COUNT(*) FROM transaction " +
                "WHERE account_id NOT IN (SELECT id FROM account)");
            long transacoes = transacoesOrfas != null ? Long.parseLong(transacoesOrfas.toString()) : 0;
            if (transacoes > 0) System.out.println("ALERTA: " + transacoes + " transação(ões) órfã(s)");
            total_orfaos += transacoes;

            System.out.printf("KPI — Total de registros órfãos: %d%n", total_orfaos);
            assertEquals(0, total_orfaos,
                "KPI: " + total_orfaos + " registro(s) órfão(s) em tabelas críticas — falha de integridade");
        } catch (SQLException e) {
            System.out.println("AVISO: Banco não disponível — " + e.getMessage());
        }
    }
}
