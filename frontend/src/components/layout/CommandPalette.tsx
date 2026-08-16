'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Users,
  UserCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle handled by parent or shortcut
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { title: 'View All Claims', href: '/billing', icon: FileText, category: 'Claims' },
    { title: 'Check Denied Claims & Appeals', href: '/denials', icon: FileText, category: 'Appeals' },
    { title: 'Track Unpaid Bills (A/R)', href: '/ar', icon: FileText, category: 'A/R' },
    { title: 'Doctor Licenses & Renewals', href: '/credentialing', icon: UserCheck, category: 'Doctors' },
    { title: 'Patients Registry', href: '/patients', icon: Users, category: 'Patients' },
    { title: 'Insurance Rules & Documents', href: '/documents', icon: BookOpen, category: 'Rules' },
    { title: 'Ask AI Assistant', href: '/assistant', icon: Sparkles, category: 'AI' },
  ];

  const filtered = search
    ? quickActions.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
    : quickActions;

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-400" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-hidden"
          />
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleSelect(item.href)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#0D1322] border border-transparent hover:border-slate-800 cursor-pointer transition-all text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0D1322] text-sky-400 flex items-center justify-center border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
