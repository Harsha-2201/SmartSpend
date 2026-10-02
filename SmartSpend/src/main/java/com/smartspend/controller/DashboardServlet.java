package com.smartspend.controller;

import com.google.gson.Gson;
import com.smartspend.dao.BudgetDAO;
import com.smartspend.dao.ExpenseDAO;
import com.smartspend.model.Budget;
import com.smartspend.model.Expense;
import com.smartspend.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller: Aggregates dashboard metrics, circular pie chart data, and recent expenses.
 */
@WebServlet("/api/dashboard")
public class DashboardServlet extends HttpServlet {
    private final BudgetDAO budgetDAO = new BudgetDAO();
    private final ExpenseDAO expenseDAO = new ExpenseDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("user") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Unauthorized. Please log in.");
            out.print(gson.toJson(err));
            return;
        }

        User user = (User) session.getAttribute("user");
        int userId = user.getUserId();

        // Parse month and year with fallback to current date
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int year = today.getYear();

        String monthParam = request.getParameter("month");
        String yearParam = request.getParameter("year");

        if (monthParam != null && !monthParam.trim().isEmpty()) {
            try {
                month = Integer.parseInt(monthParam.trim());
            } catch (NumberFormatException ignored) {}
        }
        if (yearParam != null && !yearParam.trim().isEmpty()) {
            try {
                year = Integer.parseInt(yearParam.trim());
            } catch (NumberFormatException ignored) {}
        }

        // 1. Fetch Budget
        Budget budget = budgetDAO.getBudget(userId, month, year);
        BigDecimal budgetAmount = (budget != null) ? budget.getAmount() : BigDecimal.ZERO;

        // 2. Fetch Total Spent
        BigDecimal totalSpent = expenseDAO.getTotalExpenseForPeriod(userId, month, year);

        // 3. Calculate Remaining Budget
        BigDecimal remainingBudget = budgetAmount.subtract(totalSpent);

        // 4. Calculate Budget Usage Percentage & Status
        double usagePercent = 0.0;
        String status = "Normal";

        if (budgetAmount.compareTo(BigDecimal.ZERO) > 0) {
            usagePercent = totalSpent.divide(budgetAmount, 4, RoundingMode.HALF_UP)
                                     .multiply(BigDecimal.valueOf(100))
                                     .doubleValue();
            if (usagePercent < 75.0) {
                status = "Normal";
            } else if (usagePercent < 90.0) {
                status = "Warning";
            } else if (usagePercent <= 100.0) {
                status = "Critical";
            } else {
                status = "Exceeded";
            }
        } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            status = "Exceeded"; // Spent money without setting a budget
            usagePercent = 100.0;
        }

        // 5. Fetch Count of Expenses
        int expenseCount = expenseDAO.getExpenseCountForPeriod(userId, month, year);

        // 6. Circular Pie Chart Category Data
        Map<String, BigDecimal> categoryDistribution = expenseDAO.getCategoryWiseSpending(userId, month, year);

        // 7. Recent Expenses List
        List<Expense> recentExpenses = expenseDAO.getRecentExpenses(userId, 5);

        // Construct complete dynamic response
        Map<String, Object> data = new HashMap<>();
        data.put("userName", user.getName());
        data.put("userEmail", user.getEmail());
        data.put("month", month);
        data.put("year", year);
        data.put("monthlyBudget", budgetAmount);
        data.put("totalSpent", totalSpent);
        data.put("remainingBudget", remainingBudget);
        data.put("expenseCount", expenseCount);
        data.put("usagePercent", Math.round(usagePercent * 10.0) / 10.0);
        data.put("budgetStatus", status);
        data.put("categoryDistribution", categoryDistribution);
        data.put("recentExpenses", recentExpenses);

        out.print(gson.toJson(data));
        out.flush();
    }
}
