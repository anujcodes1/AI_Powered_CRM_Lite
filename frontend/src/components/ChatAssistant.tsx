'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { sendChatMessage } from '../lib/api';

export default function ChatAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; sources?: string[] }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI CRM Assistant. Ask me anything about your contacts, deals, or recent notes.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Hide AI Assistant on login page or unauthenticated state
  if (pathname === '/login') {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(userText);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, sources: res.sources },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Sorry, I encountered an error connecting to the CRM assistant.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl font-medium text-xs tracking-wide transition-all transform hover:scale-105 active:scale-95"
        >
          <span className="text-base">✨</span>
          <span>AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[480px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-xs font-semibold text-slate-200">CRM AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">Grounded in:</span>
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                <span>Searching CRM context...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about contacts, deals, notes..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
