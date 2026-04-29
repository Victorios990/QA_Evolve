package com.banking.qa.utils;

import com.banking.qa.config.ConfigManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utilitário JDBC para validações de banco de dados.
 * Compatível com PostgreSQL e IBM DB2 (mesma API JDBC).
 *
 * Para conectar no DB2, trocar a URL em config.properties:
 *   db.url=jdbc:db2://host:50000/BANKING
 */
public class DatabaseUtils {

    private static Connection connection;

    public static Connection getConnection() throws SQLException {
        ConfigManager cfg = ConfigManager.getInstance();
        if (connection == null || connection.isClosed()) {
            connection = DriverManager.getConnection(
                cfg.getDbUrl(),
                cfg.getDbUser(),
                cfg.getDbPassword()
            );
        }
        return connection;
    }

    public static List<Map<String, Object>> executeQuery(String sql) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Statement stmt = getConnection().createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= cols; i++) {
                    row.put(meta.getColumnName(i).toLowerCase(), rs.getObject(i));
                }
                results.add(row);
            }
        }
        return results;
    }

    public static int executeUpdate(String sql) throws SQLException {
        try (Statement stmt = getConnection().createStatement()) {
            return stmt.executeUpdate(sql);
        }
    }

    public static Object executeSingleValue(String sql) throws SQLException {
        List<Map<String, Object>> result = executeQuery(sql);
        if (result.isEmpty()) return null;
        return result.get(0).values().iterator().next();
    }

    public static void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) connection.close();
        } catch (SQLException ignored) {}
    }
}
