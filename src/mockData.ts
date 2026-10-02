import { User, Category, Expense, Budget } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { categoryId: 1, categoryName: 'Food', userId: null },
  { categoryId: 2, categoryName: 'Transport', userId: null },
  { categoryId: 3, categoryName: 'Education', userId: null },
  { categoryId: 4, categoryName: 'Shopping', userId: null },
  { categoryId: 5, categoryName: 'Entertainment', userId: null },
  { categoryId: 6, categoryName: 'Health', userId: null },
  { categoryId: 7, categoryName: 'Bills', userId: null },
  { categoryId: 8, categoryName: 'Travel', userId: null },
  { categoryId: 9, categoryName: 'Other', userId: null },
];

export const INITIAL_USERS: User[] = [
  {
    userId: 1,
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Student@123
    createdAt: '2026-10-01 09:00:00'
  },
  {
    userId: 2,
    name: 'Priya Patel',
    email: 'priya@example.com',
    passwordHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // Student@123
    createdAt: '2026-10-01 10:30:00'
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { budgetId: 1, userId: 1, month: 10, year: 2026, amount: 10000.00, createdAt: '2026-10-01 09:05:00' },
  { budgetId: 2, userId: 2, month: 10, year: 2026, amount: 15000.00, createdAt: '2026-10-01 10:35:00' }
];

export const INITIAL_EXPENSES: Expense[] = [
  // User 1 (Rahul) October 2026 Expenses -> Total: ₹6,750 (Budget: ₹10,000, Remaining: ₹3,250, Count: 6)
  { expenseId: 1, userId: 1, categoryId: 1, categoryName: 'Food', amount: 2500.00, description: 'Monthly groceries & hostel mess meals', expenseDate: '2026-10-01', createdAt: '2026-10-01 11:00:00' },
  { expenseId: 2, userId: 1, categoryId: 7, categoryName: 'Bills', amount: 1800.00, description: 'Electricity bill & high-speed broadband recharge', expenseDate: '2026-10-03', createdAt: '2026-10-03 14:15:00' },
  { expenseId: 3, userId: 1, categoryId: 2, categoryName: 'Transport', amount: 1500.00, description: 'Monthly Metro commuter SmartCard recharge', expenseDate: '2026-10-05', createdAt: '2026-10-05 08:45:00' },
  { expenseId: 4, userId: 1, categoryId: 3, categoryName: 'Education', amount: 450.00, description: 'Data Structures & DBMS Reference Textbooks', expenseDate: '2026-10-07', createdAt: '2026-10-07 16:30:00' },
  { expenseId: 5, userId: 1, categoryId: 5, categoryName: 'Entertainment', amount: 300.00, description: 'Weekend Cinema Movie Ticket', expenseDate: '2026-10-10', createdAt: '2026-10-10 20:00:00' },
  { expenseId: 6, userId: 1, categoryId: 9, categoryName: 'Other', amount: 200.00, description: 'Lab assignment printouts & notebooks', expenseDate: '2026-10-12', createdAt: '2026-10-12 11:20:00' },

  // User 2 (Priya) Expenses (Ensures isolation proof)
  { expenseId: 7, userId: 2, categoryId: 4, categoryName: 'Shopping', amount: 3400.00, description: 'Diwali festive clothing purchase', expenseDate: '2026-10-02', createdAt: '2026-10-02 15:00:00' },
  { expenseId: 8, userId: 2, categoryId: 6, categoryName: 'Health', amount: 1200.00, description: 'Dental clinic consultation & prescription', expenseDate: '2026-10-04', createdAt: '2026-10-04 18:30:00' }
];
