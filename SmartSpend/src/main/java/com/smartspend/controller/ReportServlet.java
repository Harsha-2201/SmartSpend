package com.smartspend.controller;

import com.google.gson.Gson;
import com.smartspend.dao.BudgetDAO;
import com.smartspend.dao.ExpenseDAO;
import com.smartspend.model.Budget;
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
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller: Computes monthly analytics reports, category aggregation, and daily spending averages.
 */
@WebServlet("/api/reports")
public class ReportServlet extends HttpServlet {
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
            out.print("{\"error\":\"Unauthorized\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        int userId = user.getUserId();

        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        String mParam = request.getParameter("month");
        String yParam = request.getParameter("year");
        if (mParam != null) {
            try { month = Integer.parseInt(mParam.trim()); } catch (NumberFormatException ignored) {}
        }
        if (yParam != null) {
            try { year = Integer.parseInt(yParam.trim()); } catch (NumberFormatException ignored) {}
        }

        // 1. Budget & Expenses Totals
        Budget budget = budgetDAO.getBudget(userId, month, year);
        BigDecimal budgetAmount = (budget != null) ? budget.getAmount() : BigDecimal.ZERO;
        BigDecimal totalSpent = expenseDAO.getTotalExpenseForPeriod(userId, month, year);
        BigDecimal remainingBudget = budgetAmount.subtract(totalSpent);
        int expenseCount = expenseDAO.getExpenseCountForPeriod(userId, month, year);

        // 2. Category Aggregations
        Map<String, BigDecimal> categoryWise = expenseDAO.getCategoryWiseSpending(userId, month, year);

        // 3. Highest Spending Category
        String highestCategory = "None";
        BigDecimal highestAmount = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : categoryWise.entrySet()) {
            if (entry.getValue().compareTo(highestAmount) > 0) {
                highestAmount = entry.getValue();
                highestCategory = entry.getKey();
            }
        }

        // 4. Average Daily Spending
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
        BigDecimal avgDailySpending = BigDecimal.ZERO;
        if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            avgDailySpending = totalSpent.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);
        }

        // 5. Build structured list for category breakdown table with percentages
        List<Map<String, Object>> categoryList = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : categoryWise.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("category", entry.getKey());
            item.put("amount", entry.getValue());
            double pct = 0.0;
            if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
                pct = entry.getValue().divide(totalSpent, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();
            }
            item.put("percentage", Math.round(pct * 10.0) / 10.0);
            categoryList.add(item);
        }

        Map<String, Object> report = new HashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("monthlyBudget", budgetAmount);
        report.put("totalExpenses", totalSpent);
        report.put("remainingBudget", remainingBudget);
        report.put("expenseCount", expenseCount);
        report.put("highestCategory", highestCategory);
        report.put("highestAmount", highestAmount);
        report.put("avgDailySpending", avgDailySpending);
        report.put("daysInMonth", daysInMonth);
        report.put("categoryBreakdown", categoryList);

        out.print(gson.toJson(report));
    }
}
