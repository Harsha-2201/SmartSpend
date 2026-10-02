export interface User {
  userId: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  userId: number | null; // null for default system categories
}

export interface Expense {
  expenseId: number;
  userId: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  description: string;
  expenseDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  budgetId: number;
  userId: number;
  month: number; // 1-12
  year: number;
  amount: number;
  createdAt: string;
}

export type BudgetStatus = 'Normal' | 'Warning' | 'Critical' | 'Exceeded';

export interface CategorySpendSummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyReportData {
  month: number;
  year: number;
  monthlyBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  expenseCount: number;
  highestCategory: string;
  highestAmount: number;
  avgDailySpending: number;
  daysInMonth: number;
  categoryBreakdown: CategorySpendSummary[];
}
