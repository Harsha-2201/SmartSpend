import React, { useState } from 'react';
import { Expense } from '../types';
import { calculateBudgetUtilization } from '../utils/budgetUtils';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Layers,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  Receipt,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ReportsViewProps {
  currentUserId: number;
  monthlyBudget: number;
  selectedMonth: number;
  selectedYear: number;
  expenses: Expense[];
  onPeriodChange: (month: number, year: number) => void;
  userName?: string;
  userEmail?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUserId,
  monthlyBudget,
  selectedMonth,
  selectedYear,
  expenses,
  onPeriodChange,
  userName,
  userEmail,
}) => {
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showItemizedList, setShowItemizedList] = useState<boolean>(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter for logged-in user in this period
  const userExpenses = expenses.filter(e => {
    if (e.userId !== currentUserId) return false;
    const parts = e.expenseDate.split('-');
    return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
  });

  const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const expenseCount = userExpenses.length;

  // Budget utilization metrics from single source of truth
  const budgetCalc = calculateBudgetUtilization(monthlyBudget, totalSpent);
  const { hasBudget, utilizationPercentage, formattedPercentage, deficit, statusInfo } = budgetCalc;

  // Category aggregation
  const catMap: Record<string, number> = {};
  userExpenses.forEach(e => {
    catMap[e.categoryName] = (catMap[e.categoryName] || 0) + e.amount;
  });

  // Highest spending category
  let highestCategory = 'None';
  let highestAmount = 0;
  Object.entries(catMap).forEach(([cat, amt]) => {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestCategory = cat;
    }
  });

  // Days in month calculation
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const avgDailySpending = totalSpent > 0 ? (totalSpent / daysInMonth) : 0;

  // Breakdown sorted by total descending
  const categoryBreakdown = Object.entries(catMap)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalSpent > 0 ? Math.round((amt / totalSpent) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  /**
   * Generates and triggers download of a CSV summary containing:
   * 1. Overview & Period Metadata
   * 2. Monthly Budget Utilization metrics
   * 3. Category-Wise Aggregation
   * 4. Itemized Transaction Records
   */
  const handleExportCSV = () => {
    const periodName = `${monthNames[selectedMonth - 1]}_${selectedYear}`;
    const filename = `SmartSpend_Report_${periodName}.csv`;

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];

    // Header & Metadata
    lines.push('SMARTSPEND PERSONAL EXPENSE & BUDGET REPORT');
    lines.push(`Generated Date,${new Date().toISOString().split('T')[0]}`);
    lines.push(`Reporting Period,${monthNames[selectedMonth - 1]} ${selectedYear}`);
    if (userName) lines.push(`User Name,${escapeCsv(userName)}`);
    if (userEmail) lines.push(`User Email,${escapeCsv(userEmail)}`);
    lines.push('');

    // Section 1: Budget Utilization Summary
    lines.push('=== MONTHLY BUDGET & UTILIZATION SUMMARY ===');
    lines.push(`Monthly Budget (INR),${monthlyBudget.toFixed(2)}`);
    lines.push(`Total Spent (INR),${totalSpent.toFixed(2)}`);
    lines.push(`Remaining Budget (INR),${remainingBudget.toFixed(2)}`);
    lines.push(`Utilization Percentage,${hasBudget ? formattedPercentage : 'No budget set'}`);
    lines.push(`Utilization Status,${hasBudget && statusInfo ? statusInfo.badgeText : 'No budget set'}`);
    lines.push(`Budget Deficit (INR),${deficit > 0 ? deficit.toFixed(2) : '0.00'}`);
    lines.push(`Total Transactions Recorded,${expenseCount}`);
    lines.push(`Average Daily Spending (INR),${avgDailySpending.toFixed(2)}`);
    lines.push(`Highest Category,${escapeCsv(highestCategory)}`);
    lines.push(`Highest Category Amount (INR),${highestAmount.toFixed(2)}`);
    lines.push('');

    // Section 2: Category-Wise Breakdown
    lines.push('=== CATEGORY BREAKDOWN ===');
    lines.push('Rank,Category Name,Total Amount (INR),Share of Spending (%)');
    if (categoryBreakdown.length > 0) {
      categoryBreakdown.forEach((item, idx) => {
        lines.push(`${idx + 1},${escapeCsv(item.category)},${item.amount.toFixed(2)},${item.percentage}%`);
      });
    } else {
      lines.push('No category spending recorded for this month');
    }
    lines.push('');

    // Section 3: Itemized Expenses
    lines.push('=== ITEMIZED EXPENSES ===');
    lines.push('Expense ID,Expense Date,Category,Description,Amount (INR)');
    if (userExpenses.length > 0) {
      userExpenses.forEach(exp => {
        lines.push(`${exp.expenseId},${escapeCsv(exp.expenseDate)},${escapeCsv(exp.categoryName)},${escapeCsv(exp.description)},${exp.amount.toFixed(2)}`);
      });
    } else {
      lines.push('No expense transactions recorded for this month');
    }

    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Report for ${monthNames[selectedMonth - 1]} ${selectedYear} exported successfully (${filename})`);
    setTimeout(() => setExportNotice(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button 
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Monthly Financial Reports</h2>
          <p className="text-xs text-slate-600">Comprehensive expenditure analytics, category rankings, and budget utilization</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-600" />
            <select
              aria-label="Select Report Month"
              value={selectedMonth}
              onChange={(e) => onPeriodChange(parseInt(e.target.value, 10), selectedYear)}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden"
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Select Report Year"
              value={selectedYear}
              onChange={(e) => onPeriodChange(selectedMonth, parseInt(e.target.value, 10))}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden ml-1"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Export Data Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Download CSV summary of monthly expenses and budget utilization"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Monthly Budget</span>
            {hasBudget && statusInfo ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.backgroundColor} ${statusInfo.textColor}`}>
                {statusInfo.badgeText}
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                No budget
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>Allocated ceiling</span>
            {hasBudget && (
              <span className="font-semibold text-indigo-600">{formattedPercentage} used</span>
            )}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Expenses</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-600 mt-1 block">Actual expenditure</span>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Remaining Budget</span>
          <div className={`text-2xl font-extrabold mt-2 ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            ₹{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-600 mt-1 block">
            {remainingBudget < 0 ? `Deficit of ₹${deficit.toLocaleString('en-IN')}` : 'Surplus balance'}
          </span>
        </div>

        {/* Total Transactions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Transactions</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">
            {expenseCount}
          </div>
          <span className="text-[11px] text-slate-600 mt-1 block">Recorded in this month</span>
        </div>
      </div>

      {/* Highlights (Highest Category & Average Daily Spending) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Highest Spending Category
            </span>
            <div className="text-xl font-extrabold text-indigo-700 mt-1">
              {highestCategory}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              ₹{highestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({totalSpent > 0 ? ((highestAmount / totalSpent) * 100).toFixed(1) : 0}% of expenses)
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            #1
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              Average Daily Spending
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{avgDailySpending.toFixed(2)} / day
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Calculated across {daysInMonth} days in {monthNames[selectedMonth - 1]}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Category-Wise Aggregation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Category-Wise Spending Breakdown</h3>
            <p className="text-xs text-slate-600">Ranked by highest to lowest expenditure</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {categoryBreakdown.length} Categories Active
            </span>
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              title="Export report CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {categoryBreakdown.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Share of Monthly Spending</th>
                  <th className="py-3 px-4 w-1/3">Visual Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.map((item, idx) => (
                  <tr key={item.category} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-xs text-slate-600">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-600 text-xs">
                      {item.percentage}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-slate-600">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No expenses recorded for this month</p>
              <p className="text-xs text-slate-600 mt-1">Select another month or record expenses to generate reporting tables.</p>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Expenses Table with Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div 
          onClick={() => setShowItemizedList(!showItemizedList)}
          className="p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Itemized Transactions List</h3>
              <p className="text-xs text-slate-600">Individual transaction records included in this monthly report</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {userExpenses.length} Records
            </span>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              {showItemizedList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showItemizedList && (
          <div className="overflow-x-auto">
            {userExpenses.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userExpenses.map(exp => (
                    <tr key={exp.expenseId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                        {exp.expenseDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs">
                          {exp.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-rose-600 text-right">
                        ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No individual expenses recorded for this month.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
