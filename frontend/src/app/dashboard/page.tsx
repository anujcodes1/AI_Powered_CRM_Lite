'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchContacts, fetchDeals } from '../../lib/api';
import { Contact, Deal, DealStage } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STAGE_COLORS: Record<DealStage, string> = {
  lead: '#3b82f6',      // blue-500
  contacted: '#f59e0b', // amber-500
  proposal: '#a855f7',  // purple-500
  won: '#10b981',       // emerald-500
  lost: '#f43f5e',      // rose-500
};

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [contactsData, dealsData] = await Promise.all([
          fetchContacts(),
          fetchDeals(),
        ]);
        setContacts(contactsData);
        setDeals(dealsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute Stat Card Metrics
  const totalContacts = contacts.length;
  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const totalOpenDeals = openDeals.length;
  const totalDealValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);
  
  const contactsWithScore = contacts.filter((c) => c.lead_score !== undefined && c.lead_score !== null);
  const avgLeadScore = contactsWithScore.length > 0
    ? Math.round(contactsWithScore.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contactsWithScore.length)
    : 0;

  // Compute Deals by Stage Bar Chart Data
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

  const chartData = [
    { name: 'Lead', stage: 'lead' as DealStage, count: stageCounts.lead },
    { name: 'Contacted', stage: 'contacted' as DealStage, count: stageCounts.contacted },
    { name: 'Proposal', stage: 'proposal' as DealStage, count: stageCounts.proposal },
    { name: 'Won', stage: 'won' as DealStage, count: stageCounts.won },
    { name: 'Lost', stage: 'lost' as DealStage, count: stageCounts.lost },
  ];

  // Compute Needs Attention List: Top 5 contacts with lowest lead score or stalest updates
  const needsAttentionContacts = [...contacts]
    .sort((a, b) => (a.lead_score ?? 0) - (b.lead_score ?? 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading CRM executive dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">
          High-level metrics, pipeline distribution, and prioritized contacts needing attention.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contacts */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Contacts</span>
            <span className="p-2 bg-blue-950 text-blue-400 border border-blue-800 rounded-lg text-xs">👥</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalContacts}</span>
            <span className="text-[10px] text-slate-400">Active Directory</span>
          </div>
        </div>

        {/* Card 2: Open Deals */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Deals</span>
            <span className="p-2 bg-amber-950 text-amber-400 border border-amber-800 rounded-lg text-xs">📊</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">{totalOpenDeals}</span>
            <span className="text-[10px] text-slate-400">In Active Pipeline</span>
          </div>
        </div>

        {/* Card 3: Total Pipeline Value */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Value</span>
            <span className="p-2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs">💰</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              ${totalDealValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-400">Open Value</span>
          </div>
        </div>

        {/* Card 4: Average Lead Score */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Lead Score</span>
            <span className="p-2 bg-purple-950 text-purple-400 border border-purple-800 rounded-lg text-xs">⭐</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-purple-300 tracking-tight">{avgLeadScore} <span className="text-sm text-slate-500 font-normal">/ 100</span></span>
            <span className="text-[10px] text-slate-400">AI Engagement</span>
          </div>
        </div>
      </div>

      {/* Grid Section: Chart & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deals by Stage Bar Chart (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Pipeline Distribution by Stage</h2>
              <p className="text-xs text-slate-400">Deal count per stage across active sales pipeline</p>
            </div>
            <Link href="/deals" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              View Kanban →
            </Link>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: '#1e293b' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Attention List (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>⚠️ Needs Attention</span>
              </h2>
              <p className="text-xs text-slate-400">Top 5 contacts with lowest engagement score</p>
            </div>
            <Link href="/contacts" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              All Contacts →
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {needsAttentionContacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">No contacts in database.</p>
            ) : (
              needsAttentionContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-slate-800/60 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-semibold text-xs text-white group-hover:text-blue-400 truncate block"
                    >
                      {contact.name}
                    </Link>
                    <p className="text-[10px] text-slate-400 truncate">
                      {contact.company || contact.email}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      Score: {contact.lead_score ?? 0}
                    </span>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-xs text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
