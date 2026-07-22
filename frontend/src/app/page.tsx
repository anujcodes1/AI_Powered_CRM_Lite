'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-pulse">
          <span className="text-xl font-black text-white">CRM</span>
        </div>
        <p className="text-xs font-medium text-slate-400 tracking-wide">Loading workspace...</p>
      </div>
    </div>
  );
}
