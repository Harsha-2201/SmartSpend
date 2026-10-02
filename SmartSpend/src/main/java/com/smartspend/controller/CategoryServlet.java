package com.smartspend.controller;

import com.google.gson.Gson;
import com.smartspend.dao.CategoryDAO;
import com.smartspend.model.Category;
import com.smartspend.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller: Manages global default and user-specific expense categories.
 */
@WebServlet("/api/categories")
public class CategoryServlet extends HttpServlet {
    private final CategoryDAO categoryDAO = new CategoryDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        int userId = 0;
        if (session != null && session.getAttribute("user") != null) {
            userId = ((User) session.getAttribute("user")).getUserId();
        }

        List<Category> categories = categoryDAO.getCategoriesForUser(userId);
        out.print(gson.toJson(categories));
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
            out.print("{\"error\":\"Unauthorized. Please log in.\"}");
            return;
        }

        User user = (User) session.getAttribute("user");
        String categoryName = request.getParameter("categoryName");

        Map<String, Object> resp = new HashMap<>();
        if (categoryName == null || categoryName.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.put("error", "Category name cannot be empty");
            out.print(gson.toJson(resp));
            return;
        }

        boolean success = categoryDAO.addCustomCategory(categoryName.trim(), user.getUserId());
        if (success) {
            resp.put("success", true);
            resp.put("message", "Custom category created successfully.");
        } else {
            response.setStatus(HttpServletResponse.SC_CONFLICT);
            resp.put("error", "Category already exists or cannot be created.");
        }

        out.print(gson.toJson(resp));
    }
}
