import React, { useState } from 'react';
import { Expense } from '../types';
import { calculateBudgetUtilization } from '../utils/budgetUtils';
import { 
  Target, 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Info,
  Calendar,
  Save,
  Check
} from 'lucide-react';

interface BudgetViewProps {
  currentUserId: number;
  monthlyBudget: number;
  selectedMonth: number;
  selectedYear: number;
  expenses: Expense[];
  onSetBudget: (month: number, year: number, amount: number) => void;
  onPeriodChange: (month: number, year: number) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  currentUserId,
  monthlyBudget,
  selectedMonth,
  selectedYear,
  expenses,
  onSetBudget,
  onPeriodChange,
}) => {
  const [inputAmount, setInputAmount] = useState<string>(monthlyBudget > 0 ? monthlyBudget.toString() : '10000');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Compute total spent in selected month/year for this user
  const userExpenses = expenses.filter(e => {
    if (e.userId !== currentUserId) return false;
    const parts = e.expenseDate.split('-');
    return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
  });

  const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;

  // Single source of truth calculation
  const budgetCalc = calculateBudgetUtilization(monthlyBudget, totalSpent);
  const { hasBudget, formattedPercentage, barWidth, deficit, statusInfo } = budgetCalc;
  const status = statusInfo ? statusInfo.status : 'Normal';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputAmount);
    if (!isNaN(val) && val > 0) {
      onSetBudget(selectedMonth, selectedYear, val);
      setSuccessMsg('Monthly budget updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Monthly Budget & Thresholds</h2>
          <p className="text-xs text-slate-600">Configure target spending limits and monitor threshold alarms.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-600" />
          <select
            value={selectedMonth}
            onChange={(e) => onPeriodChange(parseInt(e.target.value, 10), selectedYear)}
            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden"
          >
            {monthNames.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => onPeriodChange(selectedMonth, parseInt(e.target.value, 10))}
            className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-hidden ml-1"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Budget Setting Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Set Spending Limit</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Period
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Budget Quota (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-600 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 10000.00"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-base font-bold border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Allocated monthly spending limit for this period.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Monthly Budget
            </button>
          </form>
        </div>

        {/* Budget Health & Threshold Monitor */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Budget Health Status</h3>
              <p className="text-xs text-slate-600">Calculated dynamically from recorded expenses</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors duration-300 ${
              hasBudget && statusInfo ? `${statusInfo.backgroundColor} ${statusInfo.textColor}` : 'bg-slate-100 text-slate-600'
            }`}>
              {hasBudget && statusInfo ? statusInfo.badgeText : 'No Budget Set'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Monthly Budget:</span>
              <strong className="text-slate-900 font-extrabold text-base">
                ₹{monthlyBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total Spent this Month:</span>
              <strong className="text-rose-600 font-extrabold text-base">
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800">Remaining Budget:</span>
              <strong className={`font-extrabold text-lg ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                ₹{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {/* Visual Bar */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Usage Progress</span>
                <span className="text-slate-900 font-extrabold">
                  {hasBudget ? `${formattedPercentage} utilized` : 'No budget set'}
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full ${
                    hasBudget && statusInfo ? statusInfo.barColor : 'bg-slate-300'
                  }`}
                  style={{ 
                    width: `${hasBudget ? barWidth : 0}%`,
                    transition: 'width 0.5s ease, background-color 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Deficit Banner if Exceeded */}
            {hasBudget && statusInfo?.showDeficit && deficit > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl transition-all">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Budget exceeded by ₹{deficit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Threshold Explanation Box (Section 18) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              Four-Tier Threshold Classification:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
              <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                hasBudget && status === 'Normal' ? 'bg-emerald-100/70 text-emerald-900 font-bold' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Below 75%:</strong> Normal (Safe)</span>
              </div>
              <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                hasBudget && status === 'Warning' ? 'bg-amber-100/70 text-amber-900 font-bold' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span><strong>75%–89%:</strong> Warning (Approaching)</span>
              </div>
              <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                hasBudget && status === 'Critical' ? 'bg-orange-100/70 text-orange-900 font-bold' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span><strong>90%–100%:</strong> Critical (Exhaustion)</span>
              </div>
              <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                hasBudget && status === 'Exceeded' ? 'bg-rose-100/70 text-rose-900 font-bold' : ''
              }`}>
                <div className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                <span><strong>Above 100%:</strong> Exceeded (Deficit)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
