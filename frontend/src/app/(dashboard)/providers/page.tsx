'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Search, Stethoscope, Mail, Send } from 'lucide-react';
import SendEmailModal from '@/components/ui/SendEmailModal';
import { useAuth } from '@/lib/auth-context';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{ isOpen: boolean; email: string; name: string } | null>(null);
  const { dataMode } = useAuth();

  // Form state
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [npi, setNpi] = useState('');
  const [specialty, setSpecialty] = useState('Orthopedic Surgery');

  const demoProviders = [
    { id: 'prov-1', first_name: 'Marcus', last_name: 'Vance', specialty: 'Orthopedic Surgery', readiness_status: 'Ready', readiness_score: 96, npi: '1982049182', email: 'dr.vance@mediflowai.health', phone: '(555) 304-9182', claims_count: 142 },
    { id: 'prov-2', first_name: 'Sarah', last_name: 'Jenkins', specialty: 'Internal Medicine', readiness_status: 'Ready', readiness_score: 92, npi: '1092834710', email: 'dr.jenkins@mediflowai.health', phone: '(555) 492-0193', claims_count: 88 },
    { id: 'prov-3', first_name: 'Alex', last_name: 'Rivera', specialty: 'Cardiology', readiness_status: 'Conditional', readiness_score: 84, npi: '1482910394', email: 'dr.rivera@mediflowai.health', phone: '(555) 782-9012', claims_count: 65 },
    { id: 'prov-4', first_name: 'Emily', last_name: 'Watson', specialty: 'Pediatrics', readiness_status: 'Ready', readiness_score: 98, npi: '1728394019', email: 'dr.watson@mediflowai.health', phone: '(555) 891-2304', claims_count: 42 },
    { id: 'prov-5', first_name: 'James', last_name: 'Chen', specialty: 'Dermatology', readiness_status: 'Action Needed', readiness_score: 68, npi: '1839201948', email: 'dr.chen@mediflowai.health', phone: '(555) 671-8923', claims_count: 19 },
  ];

  const load = () => {
    api.getProviders().then(setProviders).catch(console.error);
  };

  useEffect(() => {
    load();
  }, [dataMode]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProvider({
      first_name: fn,
      last_name: ln,
      email: email || `dr.${ln.toLowerCase()}@mediflowai.health`,
      phone: phone || '(555) 304-9182',
      npi,
      specialty,
    });
    setShowAddModal(false);
    load();
  };

  const handleOpenEmail = (p: any) => {
    setEmailModalData({
      isOpen: true,
      email: p.email || `dr.${p.last_name.toLowerCase()}@mediflowai.health`,
      name: `Dr. ${p.first_name} ${p.last_name}`,
    });
  };

  const activeProviders = providers.length > 0 ? providers : (dataMode === 'demo' ? demoProviders : []);

  const filtered = search
    ? activeProviders.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) || p.npi?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase()))
    : activeProviders;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Doctors Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Doctor profiles, National Provider Identifiers (NPI), contact emails, and license status.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctor name, email, specialty, or NPI..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-hidden"
        />
      </div>

      {/* Grid of Doctors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const docEmail = p.email || `dr.${p.last_name.toLowerCase()}@mediflowai.health`;
          return (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-[#111827] border border-slate-800 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-950/80 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-800/40">
                      {p.first_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Dr. {p.first_name} {p.last_name}
                      </h3>
                      <p className="text-[11px] text-sky-400 font-medium">{p.specialty}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.readiness_status === 'Ready'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {p.readiness_status === 'Ready' ? '✓ Ready' : 'Review Needed'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-sky-400" /> Email:</span>
                    <strong className="text-slate-200 font-mono text-[10px] truncate max-w-[150px]">{docEmail}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>NPI Number:</span>
                    <strong className="text-white">{p.npi}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>License Ready Score:</span>
                    <strong className="text-emerald-400">{p.readiness_score}%</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenEmail(p)}
                  className="py-2 bg-[#0D1322] hover:bg-sky-950 text-sky-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 hover:border-sky-700 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Email</span>
                </button>
                <a
                  href={`/credentialing`}
                  className="py-2 bg-[#0D1322] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center border border-slate-800 transition-colors"
                >
                  Check Licenses
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-sm font-bold text-white">Add New Doctor</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name</label>
                  <input type="text" value={fn} onChange={(e) => setFn(e.target.value)} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                  <input type="text" value={ln} onChange={(e) => setLn(e.target.value)} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-sky-400" />
                  <span>Doctor Email (For License Alerts & Reminders)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.smith@mediflowai.health"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">NPI (10 digits)</label>
                <input type="text" value={npi} onChange={(e) => setNpi(e.target.value)} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Specialty</label>
                <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl text-xs font-semibold">Save Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {emailModalData?.isOpen && (
        <SendEmailModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          defaultEmail={emailModalData.email}
          defaultName={emailModalData.name}
          recipientType="provider"
          defaultSubject={`Clinical & License Notice for ${emailModalData.name}`}
        />
      )}
    </div>
  );
}
