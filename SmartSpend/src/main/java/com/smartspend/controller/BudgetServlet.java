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
import java.util.HashMap;
import java.util.Map;

/**
 * Controller: Handles budget setting, threshold calculation, and status alerts.
 */
@WebServlet("/api/budget")
public class BudgetServlet extends HttpServlet {
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

        Budget budget = budgetDAO.getBudget(userId, month, year);
        BigDecimal budgetAmount = (budget != null) ? budget.getAmount() : BigDecimal.ZERO;
        BigDecimal totalSpent = expenseDAO.getTotalExpenseForPeriod(userId, month, year);
        BigDecimal remaining = budgetAmount.subtract(totalSpent);

        double percent = 0.0;
        String status = "Normal";

        if (budgetAmount.compareTo(BigDecimal.ZERO) > 0) {
            percent = totalSpent.divide(budgetAmount, 4, RoundingMode.HALF_UP)
                               .multiply(BigDecimal.valueOf(100)).doubleValue();
            if (percent < 75.0) {
                status = "Normal";
            } else if (percent < 90.0) {
                status = "Warning";
            } else if (percent <= 100.0) {
                status = "Critical";
            } else {
                status = "Exceeded";
            }
        } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            status = "Exceeded";
            percent = 100.0;
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("month", month);
        resp.put("year", year);
        resp.put("budgetAmount", budgetAmount);
        resp.put("totalSpent", totalSpent);
        resp.put("remainingBudget", remaining);
        resp.put("usagePercent", Math.round(percent * 10.0) / 10.0);
        resp.put("budgetStatus", status);

        out.print(gson.toJson(resp));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
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

        Map<String, Object> resp = new HashMap<>();
        try {
            int month = Integer.parseInt(request.getParameter("month").trim());
            int year = Integer.parseInt(request.getParameter("year").trim());
            BigDecimal amount = new BigDecimal(request.getParameter("amount").trim());

            if (month < 1 || month > 12) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.put("error", "Month must be between 1 and 12");
                out.print(gson.toJson(resp));
                return;
            }

            if (year < 2000 || year > 2100) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.put("error", "Year is out of valid range");
                out.print(gson.toJson(resp));
                return;
            }

            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.put("error", "Budget amount must be greater than 0");
                out.print(gson.toJson(resp));
                return;
            }

            boolean success = budgetDAO.setOrUpdateBudget(userId, month, year, amount);
            if (success) {
                resp.put("success", true);
                resp.put("message", "Monthly budget updated successfully.");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.put("error", "Database error while updating budget.");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.put("error", "Invalid budget data: " + e.getMessage());
        }

        out.print(gson.toJson(resp));
    }
}
