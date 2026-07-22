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
        res = await signupUser(email, password, fullName || undefined);
      } else {
        res = await loginUser(email, password);
      }

      if (res && res.access_token) {
        localStorage.setItem('token', res.access_token);
        window.location.href = '/dashboard';
      } else {
        setError('Authentication returned an invalid response structure.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-block p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-3">
            <span className="text-2xl font-black text-white tracking-wider">CRM</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {isSignup ? 'Create CRM Lite Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignup ? 'Sign up to manage contacts & AI workflows' : 'Log in to access your workspace and deals'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Founder"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="text-blue-400 font-semibold hover:underline ml-1"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
