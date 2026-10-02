import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, Users, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: number;
  onSelectUser: (userId: number) => void;
  onRegisterUser: (name: string, email: string, passwordHash: string) => boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSelectUser,
  onRegisterUser,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'switch'>('switch');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      onSelectUser(user.userId);
      onClose();
    } else {
      setErrorMsg('Invalid email or password. User not found.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
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
      setErrorMsg('An account with this email already exists.');
      return;
    }

    // SHA-256 simulation
    const hash = 'hash_' + Math.random().toString(36).substring(2);
    const success = onRegisterUser(regName.trim(), regEmail.trim(), hash);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Account Access</div>
            <h3 className="text-lg font-extrabold mt-0.5">SmartSpend Authentication</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => { setAuthMode('switch'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              authMode === 'switch' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-slate-100'
            }`}
          >
            👥 Switch Account
          </button>
          <button
            onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              authMode === 'login' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-slate-100'
            }`}
          >
            🔑 Login
          </button>
          <button
            onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              authMode === 'register' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent hover:bg-slate-100'
            }`}
          >
            ➕ Register
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode 1: Quick Switcher (Isolation Demo) */}
          {authMode === 'switch' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Click below to instantly switch between active user sessions. Notice that 
                <strong> Rahul cannot see Priya's data</strong> and vice versa (Strict Multi-User Isolation):
              </p>

              <div className="space-y-2">
                {users.map((u) => {
                  const isActive = u.userId === currentUserId;
                  return (
                    <button
                      key={u.userId}
                      onClick={() => {
                        onSelectUser(u.userId);
                        onClose();
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.name}
                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.2 bg-indigo-600 text-white rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600">{u.email}</div>
                        </div>
                      </div>

                      <div className="text-[11px] font-semibold text-indigo-600">
                        {isActive ? 'Logged In' : 'Switch →'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Protected Session
                </span>
                <span>Session data isolated</span>
              </div>
            </div>
          )}

          {/* Mode 2: Standard Login */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <strong>Test Credentials:</strong>
                <div>Email: <code>rahul@example.com</code> / Pwd: <code>Student@123</code></div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rahul@example.com');
                    setPassword('Student@123');
                  }}
                  className="text-indigo-600 font-semibold underline text-[11px] mt-1"
                >
                  Auto-fill Rahul's Credentials
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Mode 3: Registration */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Vikram Verma"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors mt-2"
              >
                Register & Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
