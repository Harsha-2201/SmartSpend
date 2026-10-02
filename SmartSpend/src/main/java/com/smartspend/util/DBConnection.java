package com.smartspend.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Database Connection Utility
 * Manages JDBC connection lifecycle to MySQL database.
 */
public class DBConnection {

    // =========================================================================
    // DATABASE CONFIGURATION (STUDENT: MODIFY YOUR MYSQL CREDENTIALS HERE)
    // =========================================================================
    private static final String URL = "jdbc:mysql://localhost:3306/expense_manager?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // ENTER YOUR LOCAL MYSQL ROOT PASSWORD BELOW:
    // (e.g., "root", "admin", "password123", or leave empty "" if no password)
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    private static final String PASSWORD = "YOUR_MYSQL_PASSWORD";

    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    static {
        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL JDBC Driver not found in classpath! Check pom.xml dependency.");
            e.printStackTrace();
        }
    }

    /**
     * Establishes and returns a new active database connection.
     * @return Connection object
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    /**
     * Safely closes a database connection.
     * @param conn the Connection to close
     */
    public static void closeConnection(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                System.err.println("Error closing database connection: " + e.getMessage());
            }
        }
    }
}
