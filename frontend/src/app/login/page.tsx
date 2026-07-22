'use client';

import React, { useState } from 'react';
import { signupUser, loginUser } from '../../lib/api';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isSignup) {
        res = await signupUser(email.trim(), password, fullName.trim() || undefined);
      } else {
        res = await loginUser(email.trim(), password);
      }

      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        window.location.href = '/dashboard';
      } else {
        setError('Authentication server returned invalid response format.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to authenticate. Ensure FastAPI backend is running on http://127.0.0.1:8000');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'founder@acme.com';
    const demoPassword = 'Password123!';
    const demoName = 'Acme Founder';

    try {
      // First try logging in
      let res = await loginUser(demoEmail, demoPassword).catch(() => null);

      // If login fails, auto-create demo user via signup
      if (!res || !res.access_token) {
        res = await signupUser(demoEmail, demoPassword, demoName);
      }

      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        window.location.href = '/dashboard';
      } else {
        setError('Demo login failed. Make sure FastAPI server is running on http://127.0.0.1:8000');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col items-center justify-center relative overflow-hidden py-12">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo Badge */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 p-0.5 shadow-[0_0_30px_rgba(79,70,229,0.35)] mb-4 transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                CRM
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CRM Lite <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Next-gen intelligent sales pipeline & automated AI contact insights.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/60 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                !isSignup
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                isSignup
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-4 bg-red-950/90 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm shrink-0">⚠️</span>
              <div className="leading-relaxed">
                <p className="font-semibold text-red-300 mb-0.5">Authentication Exception</p>
                <p className="text-red-200/90">{error}</p>
              </div>
            </div>
          )}

          {/* Quick Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mb-5 py-2.5 px-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 rounded-2xl text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-all group shadow-sm disabled:opacity-50"
          >
            <span className="text-sm group-hover:scale-110 transition-transform">⚡</span>
            <span>1-Click Demo Sign In (Auto-Fill & Access)</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider absolute">
              or credentials
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Founder"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] transition-all duration-300 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : isSignup ? (
                'Create Workspace Account'
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Single-tenant secure isolation • FastAPI REST + SQLite/PostgreSQL
        </p>
      </div>
    </div>
  );
}
