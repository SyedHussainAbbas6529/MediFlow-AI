'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useVoiceInput, useVoiceOutput } from '@/lib/voice-hooks';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  BookOpen,
  Copy,
  Bot,
  User as UserIcon,
  X
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  agentName?: string;
  citations?: Array<{
    document_title: string;
    page_number: number;
    chunk_id: string;
    snippet: string;
    relevance_score: number;
  }>;
  suggestedActions?: string[];
  isStreaming?: boolean;
}

export default function GeminiAssistantDrawer({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Hi! I am your **MediFlow AI Assistant**. I can help you check claim errors, write appeal letters for denied claims, check doctor license deadlines, and look up insurance rules with verified proof citations.',
      agentName: 'AI Assistant',
      suggestedActions: [
        '/appeal Write an appeal letter for claim #CLM-2026-9041',
        '/scrub Check codes and modifiers for CPT 99214',
        '/expirations Show doctor licenses expiring in 60 days',
        '/ar Show all overdue unpaid bills'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payerFilter, setPayerFilter] = useState<string>('All Payers');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { isListening, toggleListening } = useVoiceInput((transcript) => {
    setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
  });

  const { isPlaying, speak, stop } = useVoiceOutput();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.askAssistant(query, payerFilter === 'All Payers' ? undefined : payerFilter);

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        agentName: res.agent_name || 'AI Assistant',
        citations: res.citations || [],
        suggestedActions: res.suggested_actions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Sorry, I ran into an issue: ${err.message}. Please try asking again.`,
          agentName: 'AI Assistant'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-semibold">
                Verified Answers
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Ask any question about billing, claims, and insurance rules</p>
          </div>
        </div>

        {/* Payer Filter */}
        <div className="flex items-center gap-2">
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl outline-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <option value="All Payers">All Insurance Types</option>
            <option value="medicare">Medicare</option>
            <option value="medicaid">Medicaid</option>
            <option value="tricare">TRICARE</option>
            <option value="private">Private Insurance</option>
          </select>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-3xl text-xs leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-sky-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {m.text}
              </div>

              {/* Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {m.citations.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/60 text-[10px] text-sky-700 dark:text-sky-300"
                    >
                      <BookOpen className="w-3 h-3 text-sky-500" />
                      <span className="font-semibold">{c.document_title}</span>
                      <span className="text-slate-400">(page {c.page_number})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {m.sender === 'assistant' && (
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => (isPlaying ? stop() : speak(m.text))}
                    className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                    title="Read aloud"
                  >
                    {isPlaying ? <VolumeX className="w-3.5 h-3.5 text-sky-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(m.text)}
                    className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                    title="Copy text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Suggestions */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {m.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action)}
                      className="text-[11px] px-3 py-1 rounded-xl bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="animate-shimmer">Checking insurance rules and finding answers...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop microphone' : 'Talk with voice'}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type your question or use /appeal, /scrub, /expirations..."
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-hidden"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
