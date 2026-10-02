package com.smartspend.controller;

import com.smartspend.dao.UserDAO;
import com.smartspend.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Controller: Handles user registration and validation.
 */
@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    private final UserDAO userDAO = new UserDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.sendRedirect("register.html");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String confirmPassword = request.getParameter("confirmPassword");

        // Validate required fields
        if (name == null || name.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty() ||
            confirmPassword == null || confirmPassword.trim().isEmpty()) {
            redirectWithError(response, "All fields are required.");
            return;
        }

        // Validate email format
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            redirectWithError(response, "Invalid email address format.");
            return;
        }

        // Validate password length
        if (password.length() < 6) {
            redirectWithError(response, "Password must be at least 6 characters long.");
            return;
        }

        // Validate password confirmation
        if (!password.equals(confirmPassword)) {
            redirectWithError(response, "Passwords do not match.");
            return;
        }

        // Check if email already exists
        if (userDAO.isEmailExists(email)) {
            redirectWithError(response, "An account with this email already exists.");
            return;
        }

        // Create and register new user
        User newUser = new User(name.trim(), email.trim(), password);
        boolean registered = userDAO.registerUser(newUser);

        if (registered) {
            String successMsg = URLEncoder.encode("Registration successful! Please login.", StandardCharsets.UTF_8);
            response.sendRedirect("login.html?success=" + successMsg);
        } else {
            redirectWithError(response, "Registration failed due to a database error. Please try again.");
        }
    }

    private void redirectWithError(HttpServletResponse response, String message) throws IOException {
        String encoded = URLEncoder.encode(message, StandardCharsets.UTF_8);
        response.sendRedirect("register.html?error=" + encoded);
    }
}
