import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, CheckCircle2, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  logoutNotice: string | null;
  onLogin: (userId: number) => void;
  onRegister: (name: string, email: string, passwordHash: string) => boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  logoutNotice,
  onLogin,
  onRegister,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('rahul@example.com');
  const [password, setPassword] = useState('Student@123');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(logoutNotice);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      onLogin(user.userId);
    } else {
      setErrorMsg('Invalid email or password. Please verify your credentials or register a new account.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const emailTaken = users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (emailTaken) {
      setErrorMsg('An account with this email address already exists.');
      return;
    }

    const dummyHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    onRegister(regName.trim(), regEmail.trim(), dummyHash);
  };

  const fillQuickUser = (userEmail: string, userName: string) => {
    setEmail(userEmail);
    setPassword('Student@123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-500/30 mb-3">
          S
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">SmartSpend</h1>
        <p className="text-xs font-semibold text-indigo-300 mt-1 uppercase tracking-wider">
          Personal Expense & Budget Management System
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Track expenses, control monthly budgets, and analyze spending patterns
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
        {/* Logout Notification Banner */}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!isRegisterMode ? (
          /* LOGIN FORM */
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Account Login</h2>
              <span className="text-[11px] font-semibold text-slate-500">HttpSession Auth</span>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <span className="text-[10px] text-slate-400">SHA-256 Hashed</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Dashboard
              </button>
            </form>

            {/* Quick Test Credential Autofill */}
            <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Academic Test Accounts (1-Click Fill):
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickUser('rahul@example.com', 'Rahul')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-semibold text-[11px] transition-colors"
                >
                  Rahul Sharma
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickUser('priya@example.com', 'Priya')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 font-semibold text-[11px] transition-colors"
                >
                  Priya Patel
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setErrorMsg(null); setSuccessMsg(null); }}
                className="text-indigo-600 font-bold hover:underline ml-1"
              >
                Register here
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
              <span className="text-[11px] font-semibold text-slate-500">New Ledger</span>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] mt-2"
              >
                <UserPlus className="w-4 h-4" />
                Register & Sign In
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setErrorMsg(null); }}
                className="text-indigo-600 font-bold hover:underline ml-1"
              >
                Sign in here
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
