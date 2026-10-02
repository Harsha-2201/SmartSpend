package com.smartspend.controller;

import com.smartspend.dao.UserDAO;
import com.smartspend.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Controller: Handles user login authentication and session creation.
 */
@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            response.sendRedirect("dashboard.html");
            return;
        }
        response.sendRedirect("login.html");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        // Input validation
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.sendRedirect("login.html?error=Please%20enter%20both%20email%20and%20password");
            return;
        }

        User user = userDAO.authenticate(email.trim(), password);

        if (user != null) {
            // Authentication successful -> Create secure session
            HttpSession session = request.getSession(true);
            session.setAttribute("user", user);
            session.setAttribute("userId", user.getUserId());
            session.setAttribute("userName", user.getName());
            session.setAttribute("userEmail", user.getEmail());

            // Set session timeout (30 minutes)
            session.setMaxInactiveInterval(30 * 60);

            response.sendRedirect("dashboard.html");
        } else {
            // Authentication failed
            response.sendRedirect("login.html?error=Invalid%20email%20or%20password");
        }
    }
}
