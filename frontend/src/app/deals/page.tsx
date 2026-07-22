'use client';

import React, { useEffect, useState } from 'react';
import { fetchDeals, createDeal, updateDeal, deleteDeal, fetchContacts } from '../../lib/api';
import { Deal, DealStage, Contact } from '../../types';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'border-t-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'border-t-amber-500' },
  { key: 'proposal', label: 'Proposal', color: 'border-t-purple-500' },
  { key: 'won', label: 'Won', color: 'border-t-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'border-t-rose-500' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [value, setValue] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [d, c] = await Promise.all([fetchDeals(), fetchContacts()]);
      setDeals(d);
      setContacts(c);
      if (c.length > 0 && !contactId) {
        setContactId(c[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;
    setSubmitting(true);
    try {
      await createDeal({ title, contact_id: contactId, stage, value: Number(value) });
      setIsModalOpen(false);
      setTitle('');
      setValue(0);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      await updateDeal(dealId, { stage: newStage });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      await deleteDeal(dealId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPipelineValue = deals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Deals Pipeline</h1>
          <p className="text-xs text-slate-400">
            Total Pipeline Value:{' '}
            <span className="text-emerald-400 font-bold">${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all"
        >
          + Add Deal
        </button>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading Kanban board...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map((s) => {
            const stageDeals = deals.filter((d) => d.stage === s.key);
            const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div
                key={s.key}
                className={`bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 border-t-4 ${s.color} flex flex-col min-h-[500px] shadow-lg`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">{s.label}</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    ${stageTotal.toLocaleString()}
                  </span>
                </div>

                {/* Stage Deal Cards */}
                <div className="space-y-3 flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="text-[11px] text-slate-600 italic text-center pt-8">No deals</div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/60 p-3.5 rounded-xl space-y-2 transition-all shadow hover:shadow-md group"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-white leading-snug">{deal.title}</h4>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="text-slate-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>

                        <p className="text-[11px] font-semibold text-emerald-400">
                          ${Number(deal.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>

                        {deal.contact && (
                          <p className="text-[10px] text-slate-400 truncate">
                            👤 {deal.contact.name} ({deal.contact.company || 'No Company'})
                          </p>
                        )}

                        {/* Stage Selector */}
                        <div className="pt-1">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                          >
                            {STAGES.map((st) => (
                              <option key={st.key} value={st.key}>
                                Move to: {st.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Deal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enterprise License Renewal"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Associated Contact *</label>
                <select
                  required
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {contacts.length === 0 ? (
                    <option value="">No contacts available (Create a contact first)</option>
                  ) : (
                    contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deal Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as DealStage)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {STAGES.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Value ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  placeholder="5000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || contacts.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
