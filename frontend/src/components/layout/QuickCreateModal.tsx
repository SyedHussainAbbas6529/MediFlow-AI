'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  X,
  FileText,
  UserPlus,
  ShieldPlus,
  Sparkles,
  ArrowRight,
  Mail
} from 'lucide-react';
import FileDropzone from '@/components/ui/FileDropzone';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickCreateModal({ isOpen, onClose, onSuccess }: QuickCreateModalProps) {
  const [activeTab, setActiveTab] = useState<'claim' | 'patient' | 'provider'>('claim');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Claim state
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [cptCode, setCptCode] = useState('99214');
  const [charge, setCharge] = useState('185.00');
  const [dos, setDos] = useState('2026-03-01');
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  // Patient state
  const [patFirst, setPatFirst] = useState('');
  const [patLast, setPatLast] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patDob, setPatDob] = useState('1985-04-12');
  const [patMemberId, setPatMemberId] = useState('');

  // Provider state
  const [provFirst, setProvFirst] = useState('');
  const [provLast, setProvLast] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provNpi, setProvNpi] = useState('');
  const [provSpecialty, setProvSpecialty] = useState('Orthopedic Surgery');

  if (!isOpen) return null;

  const handleExtraction = (extracted: any) => {
    if (extracted.extracted_fields) {
      const f = extracted.extracted_fields;
      if (f.patient_name) setPatientName(f.patient_name);
      if (f.date_of_service) setDos(f.date_of_service);
      if (f.total_charges) setCharge(String(f.total_charges));
      if (f.cpt_codes && f.cpt_codes.length > 0) setCptCode(f.cpt_codes[0]);
      if (f.member_id) setPatMemberId(f.member_id);
      setExtractedNotice(`AI Auto-Extracted ${Object.keys(f).length} fields with ${Math.round(extracted.confidence_score * 100)}% confidence.`);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const patients = await api.getPatients();
      const providers = await api.getProviders();
      const payers = await api.getPayers();

      const pId = patients[0]?.id || 'pat-1';
      const prId = providers[0]?.id || 'prov-1';
      const pyId = payers[0]?.id || 'payer-1';

      await api.intakeClaim({
        patient_id: pId,
        provider_id: prId,
        payer_id: pyId,
        date_of_service: dos,
        patient_email: patientEmail || undefined,
        lines: [
          {
            line_number: 1,
            cpt_code: cptCode,
            description: 'Office Visit / Outpatient Evaluation',
            units: 1,
            charge_amount: parseFloat(charge) || 185.0,
          },
        ],
      });

      setMessage('Claim successfully created and routed to Review Queue!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createPatient({
        first_name: patFirst || 'Eleanor',
        last_name: patLast || 'Vance',
        dob: patDob,
        email: patEmail || `${(patFirst || 'eleanor').toLowerCase()}@example.com`,
        phone: patPhone || '(555) 234-5678',
        insurance_member_id: patMemberId || 'MEM-892193',
      });
      setMessage('Patient registered successfully with email contact & reminder capability!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createProvider({
        first_name: provFirst || 'Marcus',
        last_name: provLast || 'Vance',
        npi: provNpi || '1982736451',
        email: provEmail || `dr.${(provLast || 'vance').toLowerCase()}@mediflowai.health`,
        specialty: provSpecialty,
      });
      setMessage('Doctor registered successfully with license email reminder alerts!');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-950/80 text-sky-400 flex items-center justify-center border border-sky-800/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New</h3>
              <p className="text-xs text-slate-400">Instantly create claims, patients, or doctors with email contact & reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-6 text-xs font-semibold">
          {[
            { id: 'claim', label: 'New Claim', icon: FileText },
            { id: 'patient', label: 'New Patient', icon: UserPlus },
            { id: 'provider', label: 'New Doctor', icon: ShieldPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  active
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Form */}
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 text-emerald-300 text-xs font-medium border border-emerald-800">
              {message}
            </div>
          )}

          {activeTab === 'claim' && (
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  AI Auto-Scan Document (Optional)
                </label>
                <FileDropzone onExtracted={handleExtraction} compact />
                {extractedNotice && (
                  <p className="text-[11px] text-sky-400 font-medium mt-1">
                    ✨ {extractedNotice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Date of Visit
                  </label>
                  <input
                    type="date"
                    value={dos}
                    onChange={(e) => setDos(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white outline-hidden focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Billing CPT Code
                  </label>
                  <input
                    type="text"
                    value={cptCode}
                    onChange={(e) => setCptCode(e.target.value)}
                    placeholder="e.g. 99214"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white outline-hidden focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={charge}
                    onChange={(e) => setCharge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white outline-hidden focus:ring-2 focus:ring-sky-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-400" />
                    <span>Patient Email (For Reminders)</span>
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-sky-500/20"
                >
                  {isSubmitting ? 'Checking...' : 'Save Claim'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'patient' && (
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={patFirst}
                    onChange={(e) => setPatFirst(e.target.value)}
                    placeholder="Eleanor"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={patLast}
                    onChange={(e) => setPatLast(e.target.value)}
                    placeholder="Vance"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-400" />
                    <span>Email Address (For Reminders & Statements)</span>
                  </label>
                  <input
                    type="email"
                    value={patEmail}
                    onChange={(e) => setPatEmail(e.target.value)}
                    placeholder="eleanor.vance@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={patPhone}
                    onChange={(e) => setPatPhone(e.target.value)}
                    placeholder="(555) 234-5678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={patDob}
                    onChange={(e) => setPatDob(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Insurance Member ID</label>
                  <input
                    type="text"
                    value={patMemberId}
                    onChange={(e) => setPatMemberId(e.target.value)}
                    placeholder="BC9837261"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl"
                >
                  {isSubmitting ? 'Saving...' : 'Register Patient & Enable Reminders'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'provider' && (
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={provFirst}
                    onChange={(e) => setProvFirst(e.target.value)}
                    placeholder="Marcus"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={provLast}
                    onChange={(e) => setProvLast(e.target.value)}
                    placeholder="Vance"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-400" />
                    <span>Doctor Email (For License Alerts & Reminders)</span>
                  </label>
                  <input
                    type="email"
                    value={provEmail}
                    onChange={(e) => setProvEmail(e.target.value)}
                    placeholder="dr.vance@mediflowai.health"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">NPI (10 digits)</label>
                  <input
                    type="text"
                    value={provNpi}
                    onChange={(e) => setProvNpi(e.target.value)}
                    placeholder="1982736451"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={provSpecialty}
                    onChange={(e) => setProvSpecialty(e.target.value)}
                    placeholder="Orthopedic Surgery"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl"
                >
                  {isSubmitting ? 'Saving...' : 'Register Doctor & Enable Alerts'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
