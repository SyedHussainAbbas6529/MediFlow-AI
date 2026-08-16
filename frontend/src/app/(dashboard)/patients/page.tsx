'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Search, Mail, Send, CheckCircle2 } from 'lucide-react';
import SendEmailModal from '@/components/ui/SendEmailModal';
import { useAuth } from '@/lib/auth-context';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{ isOpen: boolean; email: string; name: string } | null>(null);
  const { dataMode } = useAuth();

  // Form state
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1980-01-01');
  const [memberId, setMemberId] = useState('');

  const demoPatients = [
    { id: 'pat-1', first_name: 'Eleanor', last_name: 'Vance', dob: '1962-05-14', email: 'eleanor.vance@example.com', phone: '(555) 234-8901', insurance_member_id: 'MED-982341-A', payer_name: 'Medicare Part B' },
    { id: 'pat-2', first_name: 'Robert', last_name: 'Garcia', dob: '1978-11-23', email: 'robert.garcia@example.com', phone: '(555) 345-9012', insurance_member_id: 'BCBS-TX-77123', payer_name: 'BCBS of Texas' },
    { id: 'pat-3', first_name: 'Margaret', last_name: 'Thatcher', dob: '1955-09-02', email: 'm.thatcher@example.com', phone: '(555) 456-0123', insurance_member_id: 'AET-883921', payer_name: 'Aetna Health' },
    { id: 'pat-4', first_name: 'Lucas', last_name: 'Bennett', dob: '1990-03-17', email: 'lucas.bennett@example.com', phone: '(555) 567-1234', insurance_member_id: 'UHC-440192', payer_name: 'UnitedHealthcare' },
    { id: 'pat-5', first_name: 'Sophia', last_name: 'Martinez', dob: '1984-08-30', email: 'sophia.m@example.com', phone: '(555) 678-2345', insurance_member_id: 'CIG-901284', payer_name: 'Cigna Healthcare' }
  ];

  const load = () => {
    api.getPatients(search || undefined).then(setPatients).catch(console.error);
  };

  useEffect(() => {
    load();
  }, [search, dataMode]);

  const activePatients = patients.length > 0 ? patients : (dataMode === 'demo' ? demoPatients : []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createPatient({
      first_name: fn,
      last_name: ln,
      dob,
      email: email || `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
      phone: phone || '(555) 019-2834',
      insurance_member_id: memberId,
    });
    setShowModal(false);
    load();
  };

  const handleOpenEmailReminder = (patient: any) => {
    setEmailModalData({
      isOpen: true,
      email: patient.email || `${patient.first_name.toLowerCase()}.${patient.last_name.toLowerCase()}@example.com`,
      name: `${patient.first_name} ${patient.last_name}`
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Patients Registry (HIPAA Encrypted)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Patient demographic records, insurance member IDs, contact emails, and balance reminder dispatch.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Patient</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#111827] p-4 rounded-3xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient name, email, DOB, or Insurance Member ID..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-[#0D1322]/80">
                <th className="py-3 px-6">Patient Name</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Insurance Company</th>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-6 text-right">Email Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {activePatients.map((p) => {
                const patientEmail = p.email || `${p.first_name.toLowerCase()}.${p.last_name.toLowerCase()}@example.com`;
                return (
                  <tr key={p.id} className="hover:bg-[#0D1322]/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{p.first_name} {p.last_name}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>{patientEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{p.dob}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">{p.payer_name || 'Medicare Part B'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-sky-400 font-semibold">{p.insurance_member_id || 'MEM-892193'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.provider_name || 'Dr. Marcus Vance'}</td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenEmailReminder(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1322] hover:bg-sky-950 text-sky-400 rounded-xl text-xs font-semibold border border-slate-800 hover:border-sky-700 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Reminder</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-sm font-bold text-white">Register New Patient</h3>
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
                  <span>Email Address (For Balance Reminders)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 234-5678" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Insurance Member ID</label>
                <input type="text" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="BC9837261" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl text-xs font-semibold">Register Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Email Reminder Modal */}
      {emailModalData?.isOpen && (
        <SendEmailModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          defaultEmail={emailModalData.email}
          defaultName={emailModalData.name}
          recipientType="patient"
        />
      )}
    </div>
  );
}
