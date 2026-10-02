# SmartSpend — Personal Expense & Budget Management System
**College Project: 2nd Year B.Tech CSE (Database Management System & Web Technologies)**

SmartSpend is a complete, production-grade web application built to help individuals monitor their daily expenses, track monthly budgets, avoid overspending, and visualize financial habits with interactive category-wise charts.

---

## 🏗️ Architecture & Technology Stack

```
Frontend (HTML5, CSS3, Vanilla JavaScript, Chart.js)
   ↓ (HTTP Requests / Form Submissions / AJAX JSON)
Java Servlets (Controller Layer - Jakarta Servlet API)
   ↓ (POJO Models & Parameter Validation)
DAO Layer (UserDAO, ExpenseDAO, BudgetDAO, CategoryDAO)
   ↓ (Parameterized PreparedStatement Queries)
JDBC (MySQL Connector/J 8.2)
   ↓
MySQL Database (expense_manager)
```

- **Frontend:** Semantic HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES6+), Chart.js (v4.4+)
- **Backend:** Java 17+, Jakarta Servlets 5.0 (Apache Tomcat 10+), Gson for JSON serialization
- **Database:** MySQL 8.0+ with InnoDB storage engine, foreign keys with cascading, and indexes
- **Server:** Apache Tomcat 10.1+
- **Build Tool:** Apache Maven 3.8+

---

## 🗄️ Database Setup Instructions

1. Start your local MySQL service (via MySQL Command Line, MySQL Workbench, or XAMPP).
2. Open terminal and run:
   ```bash
   mysql -u root -p < database/expense_manager.sql
   ```
3. Verify that the `expense_manager` database and its tables (`users`, `categories`, `expenses`, `budgets`) are created.

---

## ⚙️ Configuration (Database Credentials)

Open `src/main/java/com/smartspend/util/DBConnection.java`:
```java
private static final String URL = "jdbc:mysql://localhost:3306/expense_manager?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
private static final String USER = "root";
private static final String PASSWORD = "YOUR_MYSQL_PASSWORD"; // <-- REPLACE WITH YOUR MYSQL PASSWORD
```

---

## 🚀 Build & Deployment Steps

### Step 1: Compile and Package WAR with Maven
In the root directory of `SmartSpend/`:
```bash
mvn clean package
```
This generates `target/SmartSpend.war`.

### Step 2: Deploy to Apache Tomcat
Copy the generated WAR file into your Tomcat `webapps/` directory:
```bash
# Example for Windows:
copy target\SmartSpend.war "C:\Program Files\Apache Software Foundation\Tomcat 10.1\webapps\"

# Example for Linux / macOS:
cp target/SmartSpend.war /opt/tomcat/webapps/
```

### Step 3: Start Tomcat Server
- Windows: Run `startup.bat` from Tomcat `bin/` directory.
- Linux/Mac: Run `./bin/startup.sh`.

### Step 4: Open in Web Browser
Navigate to:
```
http://localhost:8080/SmartSpend/
```

---

## 🧪 Pre-Seeded Academic Test Accounts

| Full Name | Email Address | Password | Role / Purpose |
|---|---|---|---|
| **Rahul Sharma** | `rahul@example.com` | `Student@123` | Pre-loaded with October 2026 budget (₹10,000) and 6 expenses (₹6,750 spent). |
| **Priya Patel** | `priya@example.com` | `Student@123` | Secondary user for demonstrating strict **Multi-User Data Isolation**. |
