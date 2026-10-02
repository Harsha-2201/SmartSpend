package com.smartspend.model;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * Budget Entity Model
 * Represents a monthly budget limit set by a user for a given month and year.
 */
public class Budget {
    private int budgetId;
    private int userId;
    private int month;
    private int year;
    private BigDecimal amount;
    private Timestamp createdAt;

    public Budget() {
    }

    public Budget(int budgetId, int userId, int month, int year, BigDecimal amount, Timestamp createdAt) {
        this.budgetId = budgetId;
        this.userId = userId;
        this.month = month;
        this.year = year;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public Budget(int userId, int month, int year, BigDecimal amount) {
        this.userId = userId;
        this.month = month;
        this.year = year;
        this.amount = amount;
    }

    public int getBudgetId() {
        return budgetId;
    }

    public void setBudgetId(int budgetId) {
        this.budgetId = budgetId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Budget{" +
                "budgetId=" + budgetId +
                ", userId=" + userId +
                ", month=" + month +
                ", year=" + year +
                ", amount=" + amount +
                '}';
    }
}
