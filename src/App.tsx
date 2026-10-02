import React, { useState, useEffect } from 'react';
import { User, Category, Expense, Budget } from './types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_USERS, 
  INITIAL_BUDGETS, 
  INITIAL_EXPENSES 
} from './mockData';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';
import { CategoriesView } from './components/CategoriesView';
import { AuthModal } from './components/AuthModal';
import { LoginView } from './components/LoginView';

import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  BarChart3, 
  Tags, 
  LogOut, 
  Users, 
  Menu, 
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function App() {
  // Authentication & Session State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('smartspend_is_logged_in');
    return saved !== null ? saved === 'true' : true;
  });

  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  // Persistence with LocalStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('smartspend_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<number>(() => {
    const saved = localStorage.getItem('smartspend_active_user');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('smartspend_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('smartspend_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('smartspend_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'budget' | 'reports' | 'categories'>('dashboard');

  // Selected Period (Defaults to October 2026 as per user's prompt specifications)
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('smartspend_is_logged_in', isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('smartspend_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smartspend_active_user', currentUserId.toString());
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('smartspend_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('smartspend_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('smartspend_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Current active user
  const currentUser = users.find(u => u.userId === currentUserId) || users[0];

  // Active user's budget for selected month and year
  const activeBudgetObj = budgets.find(
    b => b.userId === currentUserId && b.month === selectedMonth && b.year === selectedYear
  );
  const activeMonthlyBudget = activeBudgetObj ? activeBudgetObj.amount : 0;

  // Add Expense Handler
  const handleAddExpense = (newExpData: Omit<Expense, 'expenseId' | 'createdAt'>) => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.expenseId)) + 1 : 1;
    const newExpense: Expense = {
      ...newExpData,
      expenseId: newId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  // Edit Expense Handler
  const handleEditExpense = (updatedExp: Expense) => {
    setExpenses(prev => prev.map(e => e.expenseId === updatedExp.expenseId ? updatedExp : e));
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expenseId: number) => {
    setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
  };

  // Set Budget Handler
  const handleSetBudget = (month: number, year: number, amount: number) => {
    setBudgets(prev => {
      const idx = prev.findIndex(b => b.userId === currentUserId && b.month === month && b.year === year);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], amount };
        return copy;
      } else {
        const newBudget: Budget = {
          budgetId: prev.length > 0 ? Math.max(...prev.map(b => b.budgetId)) + 1 : 1,
          userId: currentUserId,
          month,
          year,
          amount,
          createdAt: new Date().toISOString()
        };
        return [...prev, newBudget];
      }
    });
  };

  // Add Category Handler
  const handleAddCategory = (categoryName: string) => {
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.categoryId)) + 1 : 1;
    const newCat: Category = {
      categoryId: newId,
      categoryName,
      userId: currentUserId
    };
    setCategories(prev => [...prev, newCat]);
  };

  // Register New User Handler
  const handleRegisterUser = (name: string, email: string, passwordHash: string) => {
    const newId = users.length > 0 ? Math.max(...users.map(u => u.userId)) + 1 : 1;
    const newUser: User = {
      userId: newId,
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newId);
    setIsLoggedIn(true);
    setLogoutNotice(null);
    return true;
  };

  // Login Handler
  const handleLogin = (userId: number) => {
    setCurrentUserId(userId);
    setIsLoggedIn(true);
    setLogoutNotice(null);
    setActiveTab('dashboard');
  };

  // Logout Handler (Invalidates session -> redirects to login page)
  const handlePerformLogout = () => {
    setShowLogoutConfirmModal(false);
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    setLogoutNotice('You have been successfully logged out. Session invalidated.');
  };

  // If user is not logged in, display the Login View
  if (!isLoggedIn) {
    return (
      <LoginView
        users={users}
        logoutNotice={logoutNotice}
        onLogin={handleLogin}
        onRegister={handleRegisterUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      <div className="flex flex-1">
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className="hidden lg:flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                S
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">
                  Smart<span className="text-indigo-400">Spend</span>
                </h1>
                <p className="text-[10px] text-slate-400 tracking-tight mt-1 font-medium">
                  Personal Expense & Budget System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'expenses'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'budget'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Budget</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Tags className="w-4 h-4" />
              <span>Categories</span>
            </button>

            {/* Logout Navigation Item */}
            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                onClick={() => setShowLogoutConfirmModal(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all font-semibold"
                title="Logout session and return to login page"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>

          {/* Current User & Isolation Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{currentUser ? currentUser.name : 'User'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser ? currentUser.email : ''}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 rounded-lg flex items-center justify-center gap-1 transition-colors"
                title="Switch between test accounts (Rahul / Priya)"
              >
                <Users className="w-3 h-3" />
                Switch
              </button>

              <button
                onClick={() => setShowLogoutConfirmModal(true)}
                className="py-1.5 px-2 bg-rose-950/50 hover:bg-rose-900/60 text-[11px] font-semibold text-rose-300 border border-rose-900/40 rounded-lg flex items-center justify-center gap-1 transition-colors"
                title="Logout current session"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE NAVIGATION DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-64 bg-slate-900 text-white p-5 flex flex-col z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-extrabold text-lg">SmartSpend</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-1 text-sm font-semibold flex-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'expenses', label: 'Expenses', icon: Receipt },
                  { id: 'budget', label: 'Budget', icon: Target },
                  { id: 'reports', label: 'Reports', icon: BarChart3 },
                  { id: 'categories', label: 'Categories', icon: Tags },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${
                      activeTab === item.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutConfirmModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-rose-400 hover:bg-rose-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-800 text-xs font-bold rounded-lg text-center"
                >
                  Switch User Account
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutConfirmModal(true);
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN APPLICATION CONTENT */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs text-slate-500 font-medium">Welcome, </span>
                <span className="text-sm font-bold text-slate-900">{currentUser ? currentUser.name : 'User'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                title="Switch between users"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Account</span>
              </button>

              {/* Dedicated Topbar Logout Button */}
              <button
                onClick={() => setShowLogoutConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors border border-rose-200"
                title="Logout from SmartSpend"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                currentUserId={currentUserId}
                userName={currentUser ? currentUser.name : 'User'}
                userEmail={currentUser ? currentUser.email : ''}
                expenses={expenses}
                categories={categories}
                monthlyBudget={activeMonthlyBudget}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onPeriodChange={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
                onNavigateToExpenses={() => setActiveTab('expenses')}
                onOpenAddExpense={() => setActiveTab('expenses')}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                currentUserId={currentUserId}
                expenses={expenses}
                categories={categories}
                onAddExpense={handleAddExpense}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetView
                currentUserId={currentUserId}
                monthlyBudget={activeMonthlyBudget}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                expenses={expenses}
                onSetBudget={handleSetBudget}
                onPeriodChange={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                currentUserId={currentUserId}
                userName={currentUser ? currentUser.name : 'User'}
                userEmail={currentUser ? currentUser.email : ''}
                monthlyBudget={activeMonthlyBudget}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                expenses={expenses}
                onPeriodChange={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                }}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                currentUserId={currentUserId}
                categories={categories}
                onAddCategory={handleAddCategory}
              />
            )}
          </main>
        </div>
      </div>

      {/* Account Login / Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
        onSelectUser={(uid) => {
          setCurrentUserId(uid);
          setIsLoggedIn(true);
        }}
        onRegisterUser={handleRegisterUser}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Confirm Logout</h4>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to log out of <strong>SmartSpend</strong>? Your current session will be invalidated and you will be redirected to the login page.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformLogout}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
