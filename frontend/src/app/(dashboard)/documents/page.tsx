'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, UploadCloud, Search, CheckCircle2 } from 'lucide-react';
import FileDropzone from '@/components/ui/FileDropzone';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Payer Policy');

  const load = () => {
    api.getDocuments().then(setDocuments).catch(console.error);
    api.getPayerPolicies().then(setPolicies).catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredDocs = search
    ? documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : documents;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Insurance Rules & Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search guidelines, Medicare LCD policies, Medicaid fee schedules, and clinical rules.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {showUpload && (
        <div className="p-6 bg-[#111827] rounded-3xl border border-sky-900/60 shadow-lg space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-white">Upload & Save Document</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Document Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Medicare LCD L34988" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white">
                <option>Payer Policy</option>
                <option>SOP Guidelines</option>
                <option>Clinical Rules</option>
                <option>Fee Schedule</option>
              </select>
            </div>
          </div>
          <FileDropzone onExtracted={() => { load(); setShowUpload(false); }} />
        </div>
      )}

      {/* Search */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search insurance rules, CPT coverage, or clinical guidelines..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-hidden"
        />
      </div>

      {/* Grid of Ingested Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-3xl bg-[#111827] border border-slate-800 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center font-bold border border-sky-800/40">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/40">
                  {doc.category}
                </span>
              </div>

              <h3 className="text-xs font-bold text-white mt-3 line-clamp-2">
                {doc.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{doc.payer_name}</p>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Indexed Chunks:</span>
                  <strong className="text-white">{doc.chunk_count || 3} sections</strong>
                </div>
                <div className="flex justify-between">
                  <span>AI Citations Used:</span>
                  <strong className="text-sky-400">{doc.citations_count || 12} times</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for AI Assistant
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
