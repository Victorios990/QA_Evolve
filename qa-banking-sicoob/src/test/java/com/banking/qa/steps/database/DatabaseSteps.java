package com.banking.qa.steps.database;

import com.banking.qa.utils.DatabaseUtils;
import io.cucumber.java.pt.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DatabaseSteps {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSteps.class);

    @Dado("que o banco de dados está disponível")
    public void bancoDadosDisponivel() throws SQLException {
        assertNotNull(DatabaseUtils.getConnection(),
            "Não foi possível conectar ao banco de dados");
    }

    @Quando("executo a query de validação de integridade referencial de contas")
    public void executaQueryIntegridadeContas() throws SQLException {
        String sql = """
            SELECT COUNT(*) as total
            FROM account a
            LEFT JOIN customer c ON a.customer_id = c.id
            WHERE c.id IS NULL
            """;
        Object total = DatabaseUtils.executeSingleValue(sql);
        assertEquals("0", total.toString(),
            "Existem contas sem cliente associado: " + total);
    }

    @Então("não deve existir conta sem cliente associado")
    public void naoDeveExistirContaSemCliente() {
        log.info("Integridade referencial conta-cliente: OK");
    }

    @Quando("executo a query de verificação de saldo negativo")
    public void executaQuerySaldoNegativo() throws SQLException {
        String sql = """
            SELECT COUNT(*) as total
            FROM account
            WHERE balance < 0
            AND type NOT IN ('LOAN', 'CREDIT', 'OVERDRAFT')
            """;
        Object total = DatabaseUtils.executeSingleValue(sql);
        assertEquals("0", total.toString(),
            "Existem contas com saldo negativo indevido: " + total);
    }

    @Então("não deve existir conta com saldo negativo sem ser conta especial")
    public void naoDeveExistirSaldoNegativoIndevido() {
        log.info("Validação de saldo negativo: OK");
    }

    @Quando("executo a query de consistência de transações")
    public void executaQueryConsistenciaTransacoes() throws SQLException {
        String sql = """
            SELECT COUNT(*) as total
            FROM transaction t
            LEFT JOIN account a ON t.account_id = a.id
            WHERE a.id IS NULL
            """;
        Object total = DatabaseUtils.executeSingleValue(sql);
        assertEquals("0", total.toString(),
            "Existem transações sem conta de origem válida: " + total);
    }

    @Então("toda transação deve ter conta de origem válida")
    public void transacoesDevemTerContaValida() {
        log.info("Consistência de transações: OK");
    }

    @Quando("executo a contagem de clientes ativos")
    public void executaContagemClientesAtivos() throws SQLException {
        String sql = "SELECT COUNT(*) as total FROM customer WHERE active = true";
        Object total = DatabaseUtils.executeSingleValue(sql);
        int count = Integer.parseInt(total.toString());
        assertTrue(count > 0, "Nenhum cliente ativo encontrado no banco");
    }

    @Então("o resultado deve ser maior que zero")
    public void resultadoMaiorQueZero() {
        log.info("Clientes ativos: OK");
    }

    @Quando("executo a query de verificação de duplicidade de CPF")
    public void executaQueryDuplicidadeCPF() throws SQLException {
        String sql = """
            SELECT ssn, COUNT(*) as qty
            FROM customer
            WHERE ssn IS NOT NULL
            GROUP BY ssn
            HAVING COUNT(*) > 1
            """;
        List<Map<String, Object>> duplicados = DatabaseUtils.executeQuery(sql);
        assertTrue(duplicados.isEmpty(),
            "CPFs duplicados encontrados: " + duplicados.size());
    }

    @Então("não deve existir CPF duplicado na base de clientes")
    public void naoDeveExistirCPFDuplicado() {
        log.info("Unicidade de CPF: OK");
    }

    @Quando("executo a query de auditoria de transações")
    public void executaQueryAuditoria() throws SQLException {
        String sql = """
            SELECT COUNT(*) as total
            FROM transaction t
            LEFT JOIN audit_log al ON al.transaction_id = t.id
            WHERE al.id IS NULL
            """;
        Object total = DatabaseUtils.executeSingleValue(sql);
        assertEquals("0", total.toString(),
            "Existem transações sem registro de auditoria: " + total);
    }

    @Então("toda transação deve ter registro de auditoria correspondente")
    public void transacoesDevemTerAuditoria() {
        log.info("Auditoria de transações: OK");
    }
}
