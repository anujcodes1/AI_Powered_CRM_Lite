'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  fetchContact,
  fetchContactNotes,
  createContactNote,
  fetchContactActivities,
  recalculateContactScore,
} from '../../../lib/api';
import { Contact, Note, ActivityLog } from '../../../types';

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;

  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Score calculation state
  const [calculatingScore, setCalculatingScore] = useState(false);

  const loadAll = async () => {
    try {
      const [c, n, a] = await Promise.all([
        fetchContact(contactId),
        fetchContactNotes(contactId),
        fetchContactActivities(contactId),
      ]);
      setContact(c);
      setNotes(n);
      setActivities(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [contactId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await createContactNote(contactId, { content: noteContent });
      setNoteContent('');
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleRecalculateScore = async () => {
    setCalculatingScore(true);
    try {
      const res = await recalculateContactScore(contactId);
      setContact((prev) =>
        prev
          ? {
              ...prev,
              lead_score: res.lead_score,
              ai_score_reason: res.ai_score_reason,
            }
          : null
      );
      await loadAll();
    } catch (err) {
      console.error('Failed to recalculate score:', err);
    } finally {
      setCalculatingScore(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading contact details...</div>;
  }

  if (!contact) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 space-y-4">
        <p>Contact not found.</p>
        <Link href="/contacts" className="text-blue-400 hover:underline">
          ← Back to Contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link href="/contacts" className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors">
        ← Back to Contacts
      </Link>

      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{contact.name}</h1>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold px-3 py-1 rounded-lg text-xs flex items-center space-x-1.5">
              <span>Score: {contact.lead_score ?? 0} / 100</span>
            </span>
          </div>

          {contact.ai_score_reason && (
            <p className="text-xs text-indigo-300/90 bg-indigo-950/40 border border-indigo-900/60 p-2.5 rounded-lg max-w-2xl">
              💡 <span className="font-semibold">AI Reasoning:</span> {contact.ai_score_reason}
            </p>
          )}

          <p className="text-xs text-slate-400">{contact.company || 'Independent Contact'}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
            <span>📧 {contact.email}</span>
            {contact.phone && <span>📞 {contact.phone}</span>}
          </div>
        </div>

        {/* Action Controls & Tags */}
        <div className="flex flex-col items-start md:items-end space-y-3 shrink-0">
          <button
            onClick={handleRecalculateScore}
            disabled={calculatingScore}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {calculatingScore ? (
              <>
                <span className="animate-spin text-sm">⚡</span>
                <span>Calculating Score...</span>
              </>
            ) : (
              <>
                <span>⚡ Recalculate Score</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <span key={tag} className="bg-slate-800 text-blue-300 border border-slate-700 px-3 py-1 rounded-md text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Left Notes, Right Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span>Notes & Communication</span>
            <span className="text-xs font-normal text-slate-400">{notes.length} note(s)</span>
          </h2>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              required
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Log a call summary, meeting notes, or follow-up task..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingNote}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow transition-all disabled:opacity-50"
              >
                {addingNote ? 'Adding Note...' : '+ Add Note'}
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3 pt-2">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No notes logged yet.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-slate-800/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <p className="text-[10px] text-slate-400 text-right">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Activity Timeline
          </h2>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic pl-8">No activities recorded.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative flex items-start space-x-3 pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900" />

                  <div className="bg-slate-800/40 border border-slate-800/80 rounded-xl p-3 flex-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="uppercase font-bold tracking-wider text-blue-400">{act.type}</span>
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{act.description}</p>
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
