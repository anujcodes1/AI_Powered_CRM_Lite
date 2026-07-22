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
    router.push('/login');
  };

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2 rounded-lg font-bold text-lg">
              CRM
            </span>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Lite AI
            </span>
          </Link>

          <div className="flex space-x-2">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                pathname === '/dashboard' || pathname === '/'
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/contacts"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                pathname.startsWith('/contacts')
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Contacts
            </Link>
            <Link
              href="/deals"
              className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                pathname.startsWith('/deals')
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Pipeline (Kanban)
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {token ? (
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-md shadow transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
