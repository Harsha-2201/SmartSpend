import React, { useState, useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import { Expense, Category } from '../types';
import { calculateBudgetUtilization } from '../utils/budgetUtils';
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Plus, 
  Calendar,
  ArrowRight,
  FlaskConical,
  RotateCcw
} from 'lucide-react';

Chart.register(ArcElement, Tooltip, Legend, PieController);

interface DashboardViewProps {
  currentUserId: number;
  userName: string;
  userEmail: string;
  expenses: Expense[];
  categories: Category[];
  monthlyBudget: number;
  selectedMonth: number;
  selectedYear: number;
  onPeriodChange: (month: number, year: number) => void;
  onNavigateToExpenses: () => void;
  onOpenAddExpense: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Education: '#6366f1',
  Shopping: '#ec4899',
  Entertainment: '#8b5cf6',
  Health: '#10b981',
  Bills: '#ef4444',
  Travel: '#06b6d4',
  Other: '#64748b'
};

const DEFAULT_PALETTE = ['#f59e0b', '#3b82f6', '#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#64748b', '#84cc16'];

export interface BudgetStatusInfo {
  status: 'Normal' | 'Warning' | 'Critical' | 'Exceeded';
  color: 'emerald' | 'amber' | 'orange' | 'rose';
  backgroundColor: string;
  textColor: string;
  barColor: string;
  showDeficit: boolean;
  badgeText: string;
}

/**
 * Dynamic status determination based on utilization percentage:
 * - < 75%: Emerald green (Normal)
 * - 75% to 89.99%: Amber / yellow (Warning)
 * - 90% to 100%: Orange (Critical)
 * - > 100%: Deep red / rose (Exceeded)
 */
export function getBudgetStatus(utilizationPercentage: number): BudgetStatusInfo {
  if (utilizationPercentage < 75) {
    return {
      status: 'Normal',
      color: 'emerald',
      backgroundColor: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      showDeficit: false,
      badgeText: 'Normal'
    };
  } else if (utilizationPercentage < 90) {
    return {
      status: 'Warning',
      color: 'amber',
      backgroundColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      barColor: 'bg-amber-500',
      showDeficit: false,
      badgeText: 'Warning'
    };
  } else if (utilizationPercentage <= 100) {
    return {
      status: 'Critical',
      color: 'orange',
      backgroundColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      barColor: 'bg-orange-500',
      showDeficit: false,
      badgeText: 'Critical'
    };
  } else {
    return {
      status: 'Exceeded',
      color: 'rose',
      backgroundColor: 'bg-rose-100',
      textColor: 'text-rose-700',
      barColor: 'bg-rose-600',
      showDeficit: true,
      badgeText: 'Exceeded'
    };
  }
}

export interface MonthlyBudgetUtilizationProps {
  monthlyBudget: number;
  totalSpent: number;
}

/**
 * Dynamic Monthly Budget Utilization Component
 * Replaces static progress bar with dynamic getBudgetStatus logic,
 * colored progress bar, status badge, deficit banner, and overflow protection.
 */
export const MonthlyBudgetUtilization: React.FC<MonthlyBudgetUtilizationProps> = ({
  monthlyBudget,
  totalSpent
}) => {
  const [simulation, setSimulation] = useState<{ budget: number; spent: number; label: string } | null>(null);
  const [showTestCases, setShowTestCases] = useState<boolean>(false);

  const activeBudget = simulation !== null ? simulation.budget : monthlyBudget;
  const activeSpent = simulation !== null ? simulation.spent : totalSpent;

  const hasBudget = activeBudget > 0;
  const utilizationPercentage = hasBudget ? (activeSpent / activeBudget) * 100 : 0;
  const statusInfo = getBudgetStatus(utilizationPercentage);
  
  // Deficit calculation: totalSpent - monthlyBudget when utilization > 100%
  const deficit = Math.max(0, activeSpent - activeBudget);

  // Bar width clamped to 100% to ensure no container overflow
  const barWidth = Math.min(Math.max(0, utilizationPercentage), 100);

  const formattedPercentage = utilizationPercentage % 1 === 0
    ? `${utilizationPercentage.toFixed(0)}%`
    : `${Number(utilizationPercentage.toFixed(2))}%`;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Monthly Budget Utilization</span>
          {hasBudget ? (
            <span className="text-xs text-slate-600 font-medium">
              ({formattedPercentage} of ₹{activeBudget.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} used)
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              No budget set
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {simulation && (
            <button
              onClick={() => setSimulation(null)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors border border-indigo-200"
              title="Reset to live database values"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Real Data
            </button>
          )}

          {hasBudget ? (
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors duration-300 ${statusInfo.backgroundColor} ${statusInfo.textColor}`}>
              {statusInfo.badgeText}
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              No budget set
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Progress Bar with Clamped Width and Transition Effects */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            hasBudget ? statusInfo.barColor : 'bg-slate-300'
          }`}
          style={{ 
            width: `${hasBudget ? barWidth : 0}%`,
            transition: 'width 0.5s ease, background-color 0.3s ease',
            backgroundColor: '#ff7b20'
          }}
        />
      </div>

      {/* Deficit calculation displayed when utilization > 100% */}
      {hasBudget && utilizationPercentage > 100 && deficit > 0 && (
        <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl transition-all">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Budget exceeded by ₹{deficit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Threshold Labels Below Bar with Active Highlight */}
      <div className="flex flex-wrap justify-between items-center text-[11px] pt-1 gap-2 border-t border-slate-100">
        <span className={`transition-all duration-300 flex items-center gap-1.5 ${
          hasBudget && statusInfo.status === 'Normal' ? 'font-bold text-emerald-700' : 'text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            hasBudget && statusInfo.status === 'Normal' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
          }`} />
          Safe (&lt;75%)
        </span>

        <span className={`transition-all duration-300 flex items-center gap-1.5 ${
          hasBudget && statusInfo.status === 'Warning' ? 'font-bold text-amber-700' : 'text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            hasBudget && statusInfo.status === 'Warning' ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-slate-300'
          }`} />
          Warning (75–89%)
        </span>

        <span className={`transition-all duration-300 flex items-center gap-1.5 ${
          hasBudget && statusInfo.status === 'Critical' ? 'font-bold text-orange-700' : 'text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            hasBudget && statusInfo.status === 'Critical' ? 'bg-orange-500 ring-2 ring-orange-200' : 'bg-slate-300'
          }`} />
          Critical (90–100%)
        </span>

        <span className={`transition-all duration-300 flex items-center gap-1.5 ${
          hasBudget && statusInfo.status === 'Exceeded' ? 'font-bold text-rose-700' : 'text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            hasBudget && statusInfo.status === 'Exceeded' ? 'bg-rose-600 ring-2 ring-rose-200' : 'bg-slate-300'
          }`} />
          Exceeded (&gt;100%)
        </span>
      </div>

      {/* Quick Verification Toolbar for Test Cases 1-8 */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-indigo-600" />
            Live Threshold Test Matrix:
          </span>
          <button
            onClick={() => setShowTestCases(!showTestCases)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            {showTestCases ? 'Hide Test Cases ▲' : 'Show 8 Test Presets ▼'}
          </button>
        </div>

        {showTestCases && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] animate-in fade-in duration-200">
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 4250, label: 'Case 1: 42.5% Normal' })}
              className="py-1 px-2 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-emerald-800 font-medium transition-colors"
            >
              1. 42.5% (Normal)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 7500, label: 'Case 2: 75% Warning' })}
              className="py-1 px-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-amber-800 font-medium transition-colors"
            >
              2. 75% (Warning)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 8999, label: 'Case 3: 89.99% Warning' })}
              className="py-1 px-2 text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-amber-800 font-medium transition-colors"
            >
              3. 89.99% (Warning)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 9000, label: 'Case 4: 90% Critical' })}
              className="py-1 px-2 text-left bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md text-orange-800 font-medium transition-colors"
            >
              4. 90% (Critical)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 10000, label: 'Case 5: 100% Critical' })}
              className="py-1 px-2 text-left bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md text-orange-800 font-medium transition-colors"
            >
              5. 100% (Critical)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 12500, label: 'Case 6: 125% Exceeded' })}
              className="py-1 px-2 text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md text-rose-800 font-medium transition-colors"
            >
              6. 125% (Exceeded)
            </button>
            <button
              onClick={() => setSimulation({ budget: 10000, spent: 0, label: 'Case 7: 0% Normal' })}
              className="py-1 px-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium transition-colors"
            >
              7. 0% (Normal)
            </button>
            <button
              onClick={() => setSimulation({ budget: 0, spent: 500, label: 'Case 8: No Budget Set' })}
              className="py-1 px-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-800 font-medium transition-colors"
            >
              8. ₹0 (No budget set)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUserId,
  userName,
  userEmail,
  expenses,
  categories,
  monthlyBudget,
  selectedMonth,
  selectedYear,
  onPeriodChange,
  onNavigateToExpenses,
  onOpenAddExpense,
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Filter expenses for selected user, month, and year
  const userExpenses = expenses.filter(e => {
    if (e.userId !== currentUserId) return false;
    const parts = e.expenseDate.split('-');
    const expYear = parseInt(parts[0], 10);
    const expMonth = parseInt(parts[1], 10);
    return expMonth === selectedMonth && expYear === selectedYear;
  });

  const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const expenseCount = userExpenses.length;

  // Group by category
  const categoryTotals: Record<string, number> = {};
  userExpenses.forEach(e => {
    categoryTotals[e.categoryName] = (categoryTotals[e.categoryName] || 0) + e.amount;
  });

  const categoryNames = Object.keys(categoryTotals);
  const categoryValues = Object.values(categoryTotals);

  // Recent 5 expenses for this user
  const recentExpenses = [...expenses]
    .filter(e => e.userId === currentUserId)
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 5);

  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (categoryNames.length === 0) return;

    const backgroundColors = categoryNames.map((name, idx) => 
      CATEGORY_COLORS[name] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]
    );

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categoryNames,
        datasets: [{
          data: categoryValues,
          backgroundColor: backgroundColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                size: 11,
                weight: 'bold',
                family: 'inherit'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw as number;
                const total = categoryValues.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${label}: ₹${val.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [categoryNames.join(','), categoryValues.join(',')]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Personal Finance Overview
            </span>
            <span className="text-xs text-slate-600">Logged in as <strong className="text-slate-800">{userName}</strong> ({userEmail})</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Financial Dashboard — {monthNames[selectedMonth - 1]} {selectedYear}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-600" />
            <select
              aria-label="Select Month"
              value={selectedMonth}
              onChange={(e) => onPeriodChange(parseInt(e.target.value, 10), selectedYear)}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Select Year"
              value={selectedYear}
              onChange={(e) => onPeriodChange(selectedMonth, parseInt(e.target.value, 10))}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden ml-1"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monthly Budget</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            Allocated for {monthNames[selectedMonth - 1]}
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Spent</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            Sum of all expenses this month
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${remainingBudget < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Remaining Budget</span>
            {remainingBudget < 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className={`text-2xl font-extrabold ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            ₹{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {remainingBudget < 0 ? 'Over budget deficit!' : 'Available surplus to spend'}
          </div>
        </div>

        {/* Number of Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Number of Expenses</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {expenseCount}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            Recorded transactions
          </div>
        </div>
      </div>

      {/* Dynamic Monthly Budget Utilization Component */}
      <MonthlyBudgetUtilization
        monthlyBudget={monthlyBudget}
        totalSpent={totalSpent}
      />

      {/* Main Split: Circular Pie Chart & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circular Pie Chart Card (Section 8 & 9) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Expense Distribution</h3>
              <p className="text-xs text-slate-600">Circular pie chart powered by Chart.js</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {categoryNames.length} Categories
            </span>
          </div>

          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            {categoryNames.length > 0 ? (
              <canvas ref={chartCanvasRef} className="max-h-[300px]" />
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm">No expenses recorded for this month</p>
                <p className="text-xs text-slate-600 mt-1">Add expenses to generate the circular pie chart breakdown.</p>
                <button
                  onClick={onOpenAddExpense}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                >
                  ➕ Add First Expense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses List (Section 9) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Expenses</h3>
              <p className="text-xs text-slate-600">Latest recorded transactions</p>
            </div>
            <button
              onClick={onNavigateToExpenses}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentExpenses.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-600">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentExpenses.map((exp) => (
                    <tr key={exp.expenseId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                        {exp.expenseDate}
                      </td>
                      <td className="py-2.5">
                        <span 
                          className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[exp.categoryName] || '#6366f1'}18`,
                            color: CATEGORY_COLORS[exp.categoryName] || '#4338ca'
                          }}
                        >
                          {exp.categoryName}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-700 max-w-[160px] truncate">
                        {exp.description}
                      </td>
                      <td className="py-2.5 text-xs font-bold text-slate-900 text-right whitespace-nowrap">
                        ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No expenses logged yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
