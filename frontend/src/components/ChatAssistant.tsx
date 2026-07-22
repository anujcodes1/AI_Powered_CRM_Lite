'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: string[];
  timestamp: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI CRM Assistant. Ask me anything about your contacts, deals, notes, or recent activities (e.g., "Which deals haven\'t been touched recently?").',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const queryText = customText || input;
    if (!queryText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(queryText);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error reaching AI assistant';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Which deals haven't been touched in 2 weeks?",
    "Summarize my contacts and top companies",
    "List all deals in proposal stage",
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 transition-all hover:scale-105 border border-indigo-400/30 group"
        >
          <span className="text-lg">✨</span>
          <span className="font-bold text-xs pr-1">AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[520px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-lg text-xs">✨</span>
              <div>
                <h3 className="font-bold text-sm text-white leading-none">CRM AI Assistant</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">RAG Query over your workspace</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-base p-1 rounded-lg hover:bg-slate-700"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 space-y-1.5 shadow ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1 border-t border-slate-700/60">
                      <span className="text-[9px] text-slate-400">Sources:</span>
                      {m.sources.map((s, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-900/80 text-indigo-300 px-1.5 py-0.2 rounded border border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-800 p-2.5 rounded-xl max-w-[80%] text-slate-400">
                <span className="animate-spin text-sm">✨</span>
                <span>Searching CRM context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Prompts */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex space-x-1.5 shrink-0">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(undefined, p)}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[10px] px-2.5 py-1 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => handleSend(e)} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your CRM..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl text-xs shadow transition-all disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
