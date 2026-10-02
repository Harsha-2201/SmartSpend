import React, { useState } from 'react';
import { Expense, Category } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RotateCcw,
  Receipt,
  AlertCircle
} from 'lucide-react';

interface ExpensesViewProps {
  currentUserId: number;
  expenses: Expense[];
  categories: Category[];
  onAddExpense: (expense: Omit<Expense, 'expenseId' | 'createdAt'>) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: number) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  currentUserId,
  expenses,
  categories,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);

  // Only current user's expenses
  const userExpenses = expenses.filter(e => e.userId === currentUserId);

  // Filter & Search logic matching DAO query
  const filteredExpenses = userExpenses.filter(e => {
    // Search description or category
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchCat = e.categoryName.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }

    // Category filter
    if (selectedCategory && e.categoryId !== parseInt(selectedCategory, 10)) {
      return false;
    }

    // Exact Date filter
    if (selectedDate && e.expenseDate !== selectedDate) {
      return false;
    }

    // Month & Year filter (if exact date not specified)
    if (!selectedDate) {
      const parts = e.expenseDate.split('-');
      const expYear = parseInt(parts[0], 10);
      const expMonth = parseInt(parts[1], 10);

      if (selectedMonth && expMonth !== parseInt(selectedMonth, 10)) {
        return false;
      }
      if (selectedYear && expYear !== parseInt(selectedYear, 10)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedDate('');
  };

  const openAddModal = () => {
    setFormAmount('');
    setFormCategory(categories[0]?.categoryId.toString() || '1');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormAmount(exp.amount.toString());
    setFormCategory(exp.categoryId.toString());
    setFormDescription(exp.description);
    setFormDate(exp.expenseDate);
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description cannot be empty');
      return;
    }

    const cat = categories.find(c => c.categoryId === parseInt(formCategory, 10));
    onAddExpense({
      userId: currentUserId,
      categoryId: parseInt(formCategory, 10),
      categoryName: cat?.categoryName || 'Other',
      amount: amountNum,
      description: formDescription.trim(),
      expenseDate: formDate,
    });

    setIsAddModalOpen(false);
    setAlertSuccess('Expense added successfully.');
    setTimeout(() => setAlertSuccess(null), 3500);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Description cannot be empty');
      return;
    }

    const cat = categories.find(c => c.categoryId === parseInt(formCategory, 10));
    onEditExpense({
      ...editingExpense,
      categoryId: parseInt(formCategory, 10),
      categoryName: cat?.categoryName || editingExpense.categoryName,
      amount: amountNum,
      description: formDescription.trim(),
      expenseDate: formDate,
    });

    setEditingExpense(null);
    setAlertSuccess('Expense updated successfully.');
    setTimeout(() => setAlertSuccess(null), 3500);
  };

  const handleDelete = (id: number) => {
    onDeleteExpense(id);
    setDeleteConfirmId(null);
    setAlertSuccess('Expense deleted successfully.');
    setTimeout(() => setAlertSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expense Management</h2>
          <p className="text-xs text-slate-600">Search, filter, and modify individual transactions with complete privacy.</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Daily Expense
        </button>
      </div>

      {/* Search and Multi-Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          Search & Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Description / Category</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-600" />
              <input
                type="text"
                placeholder="e.g. Lunch, Metro, Books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            >
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Exact Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Exact Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-600">
            Showing <strong className="text-slate-800">{filteredExpenses.length}</strong> of {userExpenses.length} expenses
          </span>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Expense History Table</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
            {filteredExpenses.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredExpenses.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.expenseId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {exp.expenseDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 font-medium">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                      ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp.expenseId)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-slate-600">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">No expenses found matching your criteria</p>
              <p className="text-xs text-slate-600 mt-1">Try resetting search filters or logging a new expense.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {(isAddModalOpen || editingExpense) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingExpense ? 'Edit Expense' : 'Log New Expense'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
                className="text-slate-600 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingExpense ? handleSaveEdit : handleSaveAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 250.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch at college cafeteria"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Section 13) */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Confirm Deletion</h4>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this expense?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
