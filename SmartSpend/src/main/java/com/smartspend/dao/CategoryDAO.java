package com.smartspend.dao;

import com.smartspend.model.Category;
import com.smartspend.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Category Data Access Object (DAO)
 * Fetches default system categories and user-customized categories.
 */
public class CategoryDAO {

    /**
     * Retrieves all categories available to a user:
     * default global categories (user_id IS NULL) + user-defined custom categories (user_id = ?).
     */
    public List<Category> getCategoriesForUser(int userId) {
        List<Category> list = new ArrayList<>();
        String sql = "SELECT category_id, category_name, user_id FROM categories " +
                     "WHERE user_id IS NULL OR user_id = ? " +
                     "ORDER BY category_name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Integer uId = rs.getObject("user_id") != null ? rs.getInt("user_id") : null;
                    list.add(new Category(
                            rs.getInt("category_id"),
                            rs.getString("category_name"),
                            uId
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching categories: " + e.getMessage());
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Adds a custom category specifically for a user.
     */
    public boolean addCustomCategory(String name, int userId) {
        String checkSql = "SELECT category_id FROM categories WHERE LOWER(category_name) = LOWER(?) AND (user_id IS NULL OR user_id = ?)";
        String insertSql = "INSERT INTO categories (category_name, user_id) VALUES (?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            // Check if already exists for this user or default
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                checkPs.setString(1, name.trim());
                checkPs.setInt(2, userId);
                try (ResultSet rs = checkPs.executeQuery()) {
                    if (rs.next()) {
                        return false; // Already exists
                    }
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, name.trim());
                ps.setInt(2, userId);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error adding category: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Retrieves category by primary key.
     */
    public Category getCategoryById(int categoryId) {
        String sql = "SELECT category_id, category_name, user_id FROM categories WHERE category_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, categoryId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Integer uId = rs.getObject("user_id") != null ? rs.getInt("user_id") : null;
                    return new Category(
                            rs.getInt("category_id"),
                            rs.getString("category_name"),
                            uId
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching category by ID: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }
}
