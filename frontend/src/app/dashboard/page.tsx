'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchContacts, fetchDeals } from '../../lib/api';
import { Contact, Deal, DealStage } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const STAGE_COLORS: Record<DealStage, string> = {
  lead: '#3b82f6', // blue
  contacted: '#8b5cf6', // purple
  proposal: '#f59e0b', // amber
  won: '#10b981', // emerald
  lost: '#ef4444', // red
};

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        setLoading(true);
        setError('');
        const [contactsData, dealsData] = await Promise.all([
          fetchContacts(),
          fetchDeals(),
        ]);
        setContacts(contactsData);
        setDeals(dealsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute metrics
  const totalContacts = contacts.length;
  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  
  const contactsWithScore = contacts.filter((c) => c.lead_score !== undefined && c.lead_score !== null);
  const avgLeadScore = contactsWithScore.length > 0
    ? Math.round(contactsWithScore.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contactsWithScore.length)
    : 0;

  // Chart data: count by stage
  const stageCounts: Record<DealStage, number> = {
    lead: 0,
    contacted: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  };
  deals.forEach((d) => {
    if (stageCounts[d.stage] !== undefined) {
      stageCounts[d.stage] += 1;
    }
  });

  const chartData = (Object.keys(stageCounts) as DealStage[]).map((stage) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: stageCounts[stage],
    rawStage: stage,
  }));

  // "Needs Attention": Top 5 contacts with lowest lead_score or default score
  const needsAttention = [...contacts]
    .sort((a, b) => (a.lead_score ?? 50) - (b.lead_score ?? 50))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="h-10 w-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl max-w-md w-full">
          <span className="text-2xl mb-2 block">⚠️</span>
          <h3 className="text-sm font-bold text-red-300 mb-1">Workspace Connection Issue</h3>
          <p className="text-xs text-red-200/90 mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
          >
            Re-authenticate Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Executive CRM Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline metrics, lead activity scores, and AI recommendations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/contacts"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors shadow-sm"
          >
            + Add Contact
          </Link>
          <Link
            href="/deals"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
          >
            Kanban Board →
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Contacts</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalContacts}</span>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Active CRM
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Open Deals</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{openDeals.length}</span>
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              In Pipeline
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Deal Value</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">
              ${totalDealValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Pipeline
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-xl hover:border-slate-700/80 transition-all">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Lead Score</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{avgLeadScore} / 100</span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              AI Heuristic
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Deals Distribution by Stage</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Pipeline deal count across sales funnel</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Sync</span>
          </div>

          <div className="h-64 w-full">
            {deals.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No active deals in pipeline. Click "+ Add Deal" on Kanban board.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.rawStage]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Needs Attention Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Needs Attention</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Top 5 contacts requiring engagement</p>
            </div>
            <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
              Action Required
            </span>
          </div>

          <div className="space-y-3">
            {needsAttention.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No contacts added yet.</p>
            ) : (
              needsAttention.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between transition-all group block"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                      {contact.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {contact.company || contact.email}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Score: {contact.lead_score ?? 50}
                    </span>
                    <span className="text-slate-500 group-hover:text-slate-300 text-xs">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
