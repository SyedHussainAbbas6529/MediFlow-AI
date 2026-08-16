'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  Sparkles,
  FileCheck,
  Download,
  History,
  ChevronDown
} from 'lucide-react';

interface AiTextEditorProps {
  appealId: string;
  initialText: string;
  claimNumber: string;
  payerName: string;
  onApproved?: () => void;
}

export default function AiTextEditor({
  appealId,
  initialText,
  claimNumber,
  payerName,
  onApproved,
}: AiTextEditorProps) {
  const [text, setText] = useState(initialText);
  const [isRewriting, setIsRewriting] = useState(false);
  const [version, setVersion] = useState(1);
  const [diffSummary, setDiffSummary] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleRewrite = async (instruction: string) => {
    setIsRewriting(true);
    try {
      const res = await api.rewriteAppeal({
        appeal_id: appealId,
        instruction,
      });
      setText(res.appeal_letter_text);
      setVersion(res.version);
      setDiffSummary(res.diff_summary);
    } catch (err) {
      console.error('Rewrite error:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApproveAndExport = async () => {
    try {
      const res = await api.approveAppeal(appealId);
      setIsApproved(true);
      setPdfUrl(res.pdf_download_url);
      if (onApproved) onApproved();
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  return (
    <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden flex flex-col text-slate-100">
      {/* AI Toolbar */}
      <div className="px-4 py-3 bg-[#0D1322] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/80 text-sky-400 rounded-xl text-xs font-bold mr-2 border border-sky-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Improve with AI</span>
          </div>

          {[
            { label: 'More Formal', instruction: 'Make formal and professional tone' },
            { label: 'Shorter & Concise', instruction: 'Make concise and direct' },
            { label: 'Stronger Argument', instruction: 'Strengthen medical necessity arguments' },
            { label: 'Add Insurance Rules', instruction: 'Add CMS Medicare/Medicaid policy citations' },
          ].map((action) => (
            <button
              key={action.label}
              disabled={isRewriting || isApproved}
              onClick={() => handleRewrite(action.instruction)}
              className="px-2.5 py-1 bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/80 transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}

          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <span>Custom</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Version Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-[#090D16] px-2.5 py-0.5 rounded-lg border border-slate-800">
            <History className="w-3 h-3" />
            Version {version}
          </span>
        </div>
      </div>

      {/* Custom Instruction Input */}
      {showCustomInput && (
        <div className="px-4 py-2.5 bg-sky-950/20 border-b border-sky-900/40 flex items-center gap-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="e.g. Highlight that treatment was required for urgent emergency care..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-sky-900 bg-[#0D1322] text-white placeholder-slate-500"
          />
          <button
            onClick={() => {
              if (customInstruction) handleRewrite(customInstruction);
            }}
            disabled={isRewriting || !customInstruction}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
          >
            Apply
          </button>
        </div>
      )}

      {/* Diff Notification */}
      {diffSummary && (
        <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-900/40 text-emerald-300 text-[11px] font-medium flex items-center justify-between">
          <span>✨ {diffSummary}</span>
          <span className="text-[10px] text-emerald-400">Unsaved preview (Click Approve to lock & download)</span>
        </div>
      )}

      {/* Textarea */}
      <div className="p-4 flex-1">
        <textarea
          rows={16}
          disabled={isApproved}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full p-4 rounded-2xl bg-[#0D1322] text-slate-100 text-xs font-mono leading-relaxed border border-slate-800 outline-hidden resize-none focus:ring-2 focus:ring-sky-500/30"
        />
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-[#0D1322] border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {isApproved ? 'Letter locked and ready to send' : 'Human review required before sending'}
        </span>

        <div className="flex items-center gap-3">
          {pdfUrl ? (
            <a
              href={`http://localhost:8000${pdfUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Appeal PDF</span>
            </a>
          ) : (
            <button
              onClick={handleApproveAndExport}
              disabled={isApproved}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Approve & Create Appeal PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
