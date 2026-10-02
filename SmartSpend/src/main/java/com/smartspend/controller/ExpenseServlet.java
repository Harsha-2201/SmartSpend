package com.smartspend.controller;

import com.google.gson.Gson;
import com.smartspend.dao.ExpenseDAO;
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
import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller: Handles full CRUD operations, search, and filtering for Expenses.
 */
@WebServlet("/api/expenses")
public class ExpenseServlet extends HttpServlet {
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

        String idParam = request.getParameter("id");
        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int expId = Integer.parseInt(idParam.trim());
                Expense exp = expenseDAO.getExpenseById(expId, userId);
                if (exp != null) {
                    out.print(gson.toJson(exp));
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\":\"Expense not found or unauthorized\"}");
                }
            } catch (NumberFormatException e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"error\":\"Invalid expense ID\"}");
            }
            return;
        }

        // Search and Filters
        String search = request.getParameter("search");
        String catParam = request.getParameter("categoryId");
        String monthParam = request.getParameter("month");
        String yearParam = request.getParameter("year");
        String dateParam = request.getParameter("date");

        Integer categoryId = null;
        if (catParam != null && !catParam.trim().isEmpty()) {
            try {
                categoryId = Integer.parseInt(catParam.trim());
            } catch (NumberFormatException ignored) {}
        }

        Integer month = null;
        if (monthParam != null && !monthParam.trim().isEmpty()) {
            try {
                month = Integer.parseInt(monthParam.trim());
            } catch (NumberFormatException ignored) {}
        }

        Integer year = null;
        if (yearParam != null && !yearParam.trim().isEmpty()) {
            try {
                year = Integer.parseInt(yearParam.trim());
            } catch (NumberFormatException ignored) {}
        }

        List<Expense> expenses = expenseDAO.searchAndFilterExpenses(
                userId, search, categoryId, month, year, dateParam
        );

        out.print(gson.toJson(expenses));
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

        String action = request.getParameter("action");
        if (action == null) {
            action = "add";
        }

        Map<String, Object> result = new HashMap<>();

        try {
            if ("delete".equalsIgnoreCase(action)) {
                String idParam = request.getParameter("expenseId");
                if (idParam == null || idParam.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Expense ID is required for deletion");
                    out.print(gson.toJson(result));
                    return;
                }
                int expenseId = Integer.parseInt(idParam.trim());
                boolean deleted = expenseDAO.deleteExpense(expenseId, userId);
                if (deleted) {
                    result.put("success", true);
                    result.put("message", "Expense deleted successfully.");
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Failed to delete expense. Check permissions.");
                }
            } else if ("edit".equalsIgnoreCase(action) || "update".equalsIgnoreCase(action)) {
                int expenseId = Integer.parseInt(request.getParameter("expenseId").trim());
                int categoryId = Integer.parseInt(request.getParameter("categoryId").trim());
                BigDecimal amount = new BigDecimal(request.getParameter("amount").trim());
                String description = request.getParameter("description").trim();
                Date expenseDate = Date.valueOf(request.getParameter("expenseDate").trim());

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Amount must be greater than 0");
                    out.print(gson.toJson(result));
                    return;
                }

                Expense exp = new Expense();
                exp.setExpenseId(expenseId);
                exp.setUserId(userId);
                exp.setCategoryId(categoryId);
                exp.setAmount(amount);
                exp.setDescription(description);
                exp.setExpenseDate(expenseDate);

                boolean updated = expenseDAO.updateExpense(exp);
                if (updated) {
                    result.put("success", true);
                    result.put("message", "Expense updated successfully.");
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Failed to update expense. Verify ownership.");
                }
            } else {
                // Add Expense
                int categoryId = Integer.parseInt(request.getParameter("categoryId").trim());
                BigDecimal amount = new BigDecimal(request.getParameter("amount").trim());
                String description = request.getParameter("description").trim();
                Date expenseDate = Date.valueOf(request.getParameter("expenseDate").trim());

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Amount must be greater than 0");
                    out.print(gson.toJson(result));
                    return;
                }

                if (description.isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    result.put("error", "Description cannot be empty");
                    out.print(gson.toJson(result));
                    return;
                }

                Expense exp = new Expense(userId, categoryId, amount, description, expenseDate);
                boolean added = expenseDAO.addExpense(exp);
                if (added) {
                    result.put("success", true);
                    result.put("message", "Expense added successfully.");
                    result.put("expense", exp);
                } else {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    result.put("error", "Failed to save expense into database.");
                }
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            result.put("error", "Invalid input data: " + e.getMessage());
        }

        out.print(gson.toJson(result));
    }
}
