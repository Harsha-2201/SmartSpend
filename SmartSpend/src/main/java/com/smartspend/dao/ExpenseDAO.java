package com.smartspend.dao;

import com.smartspend.model.Expense;
import com.smartspend.util.DBConnection;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Expense Data Access Object (DAO)
 * Enforces strict user-level data isolation for all CRUD and reporting operations.
 */
public class ExpenseDAO {

    /**
     * Inserts a new expense record for the logged-in user.
     */
    public boolean addExpense(Expense expense) {
        String sql = "INSERT INTO expenses (user_id, category_id, amount, description, expense_date) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, expense.getUserId());
            ps.setInt(2, expense.getCategoryId());
            ps.setBigDecimal(3, expense.getAmount());
            ps.setString(4, expense.getDescription().trim());
            ps.setDate(5, expense.getExpenseDate());

            int rows = ps.executeUpdate();
            if (rows > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        expense.setExpenseId(rs.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            System.err.println("Error adding expense: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Updates an existing expense, strictly verifying user ownership.
     */
    public boolean updateExpense(Expense expense) {
        String sql = "UPDATE expenses SET category_id = ?, amount = ?, description = ?, expense_date = ? " +
                     "WHERE expense_id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expense.getCategoryId());
            ps.setBigDecimal(2, expense.getAmount());
            ps.setString(3, expense.getDescription().trim());
            ps.setDate(4, expense.getExpenseDate());
            ps.setInt(5, expense.getExpenseId());
            ps.setInt(6, expense.getUserId()); // Isolation protection

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error updating expense: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Deletes an expense owned by the logged-in user.
     */
    public boolean deleteExpense(int expenseId, int userId) {
        String sql = "DELETE FROM expenses WHERE expense_id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expenseId);
            ps.setInt(2, userId); // Isolation protection

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Error deleting expense: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Retrieves an individual expense by ID for the authorized user.
     */
    public Expense getExpenseById(int expenseId, int userId) {
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.description, e.expense_date, e.created_at " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.expense_id = ? AND e.user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, expenseId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Expense exp = new Expense(
                            rs.getInt("expense_id"),
                            rs.getInt("user_id"),
                            rs.getInt("category_id"),
                            rs.getBigDecimal("amount"),
                            rs.getString("description"),
                            rs.getDate("expense_date"),
                            rs.getTimestamp("created_at")
                    );
                    exp.setCategoryName(rs.getString("category_name"));
                    return exp;
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching expense by ID: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Retrieves recent expenses for dashboard display.
     */
    public List<Expense> getRecentExpenses(int userId, int limit) {
        List<Expense> list = new ArrayList<>();
        String sql = "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                     "e.description, e.expense_date, e.created_at " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? " +
                     "ORDER BY e.expense_date DESC, e.created_at DESC " +
                     "LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Expense exp = new Expense(
                            rs.getInt("expense_id"),
                            rs.getInt("user_id"),
                            rs.getInt("category_id"),
                            rs.getBigDecimal("amount"),
                            rs.getString("description"),
                            rs.getDate("expense_date"),
                            rs.getTimestamp("created_at")
                    );
                    exp.setCategoryName(rs.getString("category_name"));
                    list.add(exp);
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching recent expenses: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Advanced Search and Filter for expenses.
     */
    public List<Expense> searchAndFilterExpenses(int userId, String search, Integer categoryId,
                                                Integer month, Integer year, String exactDate) {
        List<Expense> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
                "SELECT e.expense_id, e.user_id, e.category_id, c.category_name, e.amount, " +
                "e.description, e.expense_date, e.created_at " +
                "FROM expenses e " +
                "JOIN categories c ON e.category_id = c.category_id " +
                "WHERE e.user_id = ? "
        );

        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (LOWER(e.description) LIKE ? OR LOWER(c.category_name) LIKE ?) ");
            String wild = "%" + search.trim().toLowerCase() + "%";
            params.add(wild);
            params.add(wild);
        }

        if (categoryId != null && categoryId > 0) {
            sql.append("AND e.category_id = ? ");
            params.add(categoryId);
        }

        if (exactDate != null && !exactDate.trim().isEmpty()) {
            sql.append("AND e.expense_date = ? ");
            params.add(Date.valueOf(exactDate.trim()));
        } else {
            if (month != null && month > 0) {
                sql.append("AND MONTH(e.expense_date) = ? ");
                params.add(month);
            }
            if (year != null && year > 0) {
                sql.append("AND YEAR(e.expense_date) = ? ");
                params.add(year);
            }
        }

        sql.append("ORDER BY e.expense_date DESC, e.created_at DESC");

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Expense exp = new Expense(
                            rs.getInt("expense_id"),
                            rs.getInt("user_id"),
                            rs.getInt("category_id"),
                            rs.getBigDecimal("amount"),
                            rs.getString("description"),
                            rs.getDate("expense_date"),
                            rs.getTimestamp("created_at")
                    );
                    exp.setCategoryName(rs.getString("category_name"));
                    list.add(exp);
                }
            }
        } catch (SQLException e) {
            System.err.println("Error searching/filtering expenses: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Calculates total spent in a specific month and year.
     */
    public BigDecimal getTotalExpenseForPeriod(int userId, int month, int year) {
        String sql = "SELECT COALESCE(SUM(amount), 0.00) AS total FROM expenses " +
                     "WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getBigDecimal("total");
                }
            }
        } catch (SQLException e) {
            System.err.println("Error calculating total expense: " + e.getMessage());
            e.printStackTrace();
        }
        return BigDecimal.ZERO;
    }

    /**
     * Counts the total number of expense entries in a specific month and year.
     */
    public int getExpenseCountForPeriod(int userId, int month, int year) {
        String sql = "SELECT COUNT(*) AS cnt FROM expenses " +
                     "WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("cnt");
                }
            }
        } catch (SQLException e) {
            System.err.println("Error counting expenses: " + e.getMessage());
            e.printStackTrace();
        }
        return 0;
    }

    /**
     * Groups expenses by category for circular pie chart and monthly reporting.
     * Uses the exact SQL query structure requested.
     */
    public Map<String, BigDecimal> getCategoryWiseSpending(int userId, int month, int year) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        String sql = "SELECT c.category_name, SUM(e.amount) AS total " +
                     "FROM expenses e " +
                     "JOIN categories c ON e.category_id = c.category_id " +
                     "WHERE e.user_id = ? " +
                     "  AND MONTH(e.expense_date) = ? " +
                     "  AND YEAR(e.expense_date) = ? " +
                     "GROUP BY c.category_name " +
                     "ORDER BY total DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, month);
            ps.setInt(3, year);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    map.put(rs.getString("category_name"), rs.getBigDecimal("total"));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error querying category-wise spending: " + e.getMessage());
            e.printStackTrace();
        }
        return map;
    }
}
