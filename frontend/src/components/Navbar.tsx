'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/login';
  };

  // Hide Navbar completely on Login Page
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Brand + Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xs shadow-[0_0_15px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform duration-200">
              CRM
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              CRM Lite <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">AI</span>
            </span>
          </Link>

          <nav className="flex items-center space-x-1 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/contacts"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname.startsWith('/contacts')
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Contacts
            </Link>
            <Link
              href="/deals"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                pathname === '/deals'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Pipeline (Kanban)
            </Link>
          </nav>
        </div>

        {/* Right Auth Action */}
        <div>
          {token ? (
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>Log Out</span>
              <span className="text-slate-500 text-xs">↳</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
