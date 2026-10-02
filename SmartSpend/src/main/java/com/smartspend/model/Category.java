package com.smartspend.model;

/**
 * Category Entity Model
 * Represents expense categories (both default system categories and user-defined custom categories).
 */
public class Category {
    private int categoryId;
    private String categoryName;
    private Integer userId; // null if default global category

    public Category() {
    }

    public Category(int categoryId, String categoryName, Integer userId) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.userId = userId;
    }

    public Category(String categoryName, Integer userId) {
        this.categoryName = categoryName;
        this.userId = userId;
    }

    public int getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(int categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public boolean isDefaultCategory() {
        return userId == null || userId == 0;
    }

    @Override
    public String toString() {
        return "Category{" +
                "categoryId=" + categoryId +
                ", categoryName='" + categoryName + '\'' +
                ", userId=" + userId +
                '}';
    }
}
