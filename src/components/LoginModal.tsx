import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { INITIAL_USERS } from '../data/mockData';
import { LogIn, Lock, User as UserIcon, Shield, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onOpenAuditLogs?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenAuditLogs,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const users = storageService.getUsers();

  const handleQuickLogin = (user: User) => {
    storageService.setCurrentUser(user, false);
    onLoginSuccess(user);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (found) {
      storageService.setCurrentUser(found, true);
      onLoginSuccess(found);
      onClose();
    } else {
      setErrorMsg('Invalid email or password. You can also click any Quick Login preset below.');
    }
  };

  const handleExplicitLogout = () => {
    if (confirm('Sign out and lock current POS session?')) {
      storageService.logout();
      // Re-assign default cashier or prompt sign-in
      const cashier = users.find((u) => u.role === 'CASHIER') || users[0];
      storageService.setCurrentUser(cashier, false);
      onLoginSuccess(cashier);
      onClose();
    }
  };

  return (
    <div
      id="login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">User Authentication</h2>
              <p className="text-xs text-slate-500">Sign in to change roles or active session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick switch presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            1-Click Demo Profiles
          </span>
          <div className="space-y-2">
            {INITIAL_USERS.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  id={`quick-login-${u.role.toLowerCase()}`}
                  onClick={() => handleQuickLogin(u)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-sm">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.role === 'ADMIN' ? (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ADMIN
                      </span>
                    ) : u.role === 'MANAGER' ? (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        MANAGER
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        CASHIER
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-medium">Or enter credentials</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email / Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Sign In to Session
          </button>
        </form>

        {/* Session actions & Audit Log Link */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          {onOpenAuditLogs && (
            <button
              id="modal-view-auth-history-btn"
              onClick={() => {
                onClose();
                onOpenAuditLogs();
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              View Login & Logout History
            </button>
          )}

          <button
            id="modal-signout-btn"
            onClick={handleExplicitLogout}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors ml-auto flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            End Active Session
          </button>
        </div>
      </div>
    </div>
  );
};
