package com.smartspend.dao;

import com.smartspend.model.Budget;
import com.smartspend.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Budget Data Access Object (DAO)
 * Handles monthly budget storage and querying with strict user data isolation.
 */
public class BudgetDAO {

    /**
     * Retrieves the budget configured for a specific month and year.
     */
    public Budget getBudget(int userId, int month, int year) {
        String sql = "SELECT budget_id, user_id, month, year, amount, created_at FROM budgets " +
                     "WHERE user_id = ? AND month = ? AND year = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Budget(
                            rs.getInt("budget_id"),
                            rs.getInt("user_id"),
                            rs.getInt("month"),
                            rs.getInt("year"),
                            rs.getBigDecimal("amount"),
                            rs.getTimestamp("created_at")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching budget: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Sets or updates a budget using an UPSERT query.
     */
    public boolean setOrUpdateBudget(int userId, int month, int year, BigDecimal amount) {
        String sql = "INSERT INTO budgets (user_id, month, year, amount) VALUES (?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE amount = VALUES(amount)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            ps.setBigDecimal(4, amount);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error setting budget: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Retrieves all historical budget configurations for a user.
     */
    public List<Budget> getBudgetsForUser(int userId) {
        List<Budget> list = new ArrayList<>();
        String sql = "SELECT budget_id, user_id, month, year, amount, created_at FROM budgets " +
                     "WHERE user_id = ? ORDER BY year DESC, month DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Budget(
                            rs.getInt("budget_id"),
                            rs.getInt("user_id"),
                            rs.getInt("month"),
                            rs.getInt("year"),
                            rs.getBigDecimal("amount"),
                            rs.getTimestamp("created_at")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching budgets list: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }
}
