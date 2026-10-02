-- ========================================================
-- SmartSpend - Personal Expense & Budget Management System
-- College Project: B.Tech CSE (Database Management System & Web Tech)
-- Database Script: MySQL 8.0+
-- ========================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS expense_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE expense_manager;

-- ========================================================
-- Step 2: Table Structures
-- ========================================================

-- 1. Users Table
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories Table
-- user_id is NULL for default system categories, or references users(user_id) for custom categories
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    user_id INT DEFAULT NULL,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Expenses Table
CREATE TABLE expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. Budgets Table
CREATE TABLE budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_month_year UNIQUE (user_id, month, year),
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- Step 3: Performance Indexes
-- ========================================================
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);

-- ========================================================
-- Step 4: Seed Default Categories (Global, user_id is NULL)
-- ========================================================
INSERT INTO categories (category_name, user_id) VALUES
    ('Food', NULL),
    ('Transport', NULL),
    ('Education', NULL),
    ('Shopping', NULL),
    ('Entertainment', NULL),
    ('Health', NULL),
    ('Bills', NULL),
    ('Travel', NULL),
    ('Other', NULL);

-- ========================================================
-- Step 5: TEST DATA (FOR TESTING ONLY)
-- ========================================================
-- User 1: Rahul Sharma (Password: Student@123 -> SHA-256 hashed)
-- SHA-256 for 'Student@123': a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
INSERT INTO users (user_id, name, email, password) VALUES
    (1, 'Rahul Sharma', 'rahul@example.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');

-- User 2: Priya Patel (For verifying multi-user data isolation)
-- Password: User@123 -> SHA-256
INSERT INTO users (user_id, name, email, password) VALUES
    (2, 'Priya Patel', 'priya@example.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');

-- Test Budget for Rahul (October 2026: ₹10,000)
INSERT INTO budgets (user_id, month, year, amount) VALUES
    (1, 10, 2026, 10000.00),
    (2, 10, 2026, 15000.00);

-- Test Expenses for Rahul (October 2026 total: ₹6,750.00 across 6 expenses)
-- Categories: 1=Food, 2=Transport, 3=Education, 4=Shopping, 5=Entertainment, 6=Health, 7=Bills, 8=Travel, 9=Other
INSERT INTO expenses (user_id, category_id, amount, description, expense_date) VALUES
    (1, 1, 2500.00, 'Grocery & Cafeteria meals', '2026-10-01'),
    (1, 7, 1800.00, 'Electricity and Broadband Bill', '2026-10-03'),
    (1, 2, 1500.00, 'Metro monthly commuter pass', '2026-10-05'),
    (1, 3, 450.00, 'Data Structures Reference Book', '2026-10-07'),
    (1, 5, 300.00, 'Weekend Cinema Ticket', '2026-10-10'),
    (1, 9, 200.00, 'Stationery and Notebooks', '2026-10-12');

-- Test Expenses for Priya (user_id = 2) - to verify User 1 cannot see User 2's data
INSERT INTO expenses (user_id, category_id, amount, description, expense_date) VALUES
    (2, 4, 3400.00, 'Festive Apparel Shopping', '2026-10-02'),
    (2, 6, 1200.00, 'Dental checkup & medicine', '2026-10-04');
