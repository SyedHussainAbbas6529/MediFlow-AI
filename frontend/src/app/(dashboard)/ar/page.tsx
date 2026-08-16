'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Clock,
  Sparkles,
  ChevronRight,
  Send,
  Mail
} from 'lucide-react';
import SendEmailModal from '@/components/ui/SendEmailModal';

export default function ARFollowupPage() {
  const [summary, setSummary] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [activeBucket, setActiveBucket] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [scriptModal, setScriptModal] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<any | null>(null);
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    email: string;
    name: string;
    subject: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    api.getARSummary().then(setSummary).catch(console.error);
    api.getARFollowups().then(setFollowups).catch(console.error);
  }, []);

  const handleGenerateScript = async (rec: any) => {
    setSelectedRecord(rec);
    try {
      const res = await api.generateARScript(rec.id);
      setGeneratedScript(res);
      setScriptModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDirectEmail = (rec: any) => {
    const patientEmail = `${rec.patient_name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    setEmailModalData({
      isOpen: true,
      email: patientEmail,
      name: rec.patient_name,
      subject: `Overdue Payment Reminder: Claim #${rec.claim_number} ($${rec.outstanding_amount?.toFixed(2)})`,
      body: `Dear ${rec.patient_name},\n\nWe are reaching out regarding your healthcare visit on claim #${rec.claim_number} with ${rec.payer_name}.\n\nThe current outstanding balance of $${rec.outstanding_amount?.toFixed(2)} is now ${rec.aging_bucket} days past the initial statement date.\n\nPlease contact our billing office or submit payment through your patient portal to keep your account current.\n\nThank you,\nPatient Accounts & Billing Team\nApex Medical Practice`
    });
  };

  const filteredFollowups = activeBucket === 'All'
    ? followups
    : followups.filter((f) => f.aging_bucket.includes(activeBucket));

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Unpaid Bills & Follow-Ups (A/R)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Track overdue insurance payments and dispatch email payment reminders and call scripts.
        </p>
      </div>

      {/* Aging Buckets Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.buckets?.map((b: any) => (
            <div
              key={b.bucket}
              onClick={() => setActiveBucket(b.bucket.split(' ')[0])}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                activeBucket === b.bucket.split(' ')[0]
                  ? 'bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/20'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{b.bucket}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.urgency === 'critical'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : b.urgency === 'high'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-sky-950 text-sky-300 border border-sky-800'
                  }`}
                >
                  {b.claims_count} Claims
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-3">
                ${b.amount.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{b.percentage}% of unpaid portfolio</p>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Queue Table */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white">Overdue Claims Queue</span>
          <button
            onClick={() => setActiveBucket('All')}
            className="text-xs text-sky-400 font-semibold hover:underline"
          >
            Show All Overdue Claims
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-[#0D1322]/80">
                <th className="py-3 px-6">Claim #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4">Overdue Bracket</th>
                <th className="py-3 px-4">Days Waiting</th>
                <th className="py-3 px-4">Amount Due ($)</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredFollowups.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#0D1322]/60 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-white">{rec.claim_number}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-medium">{rec.patient_name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{rec.payer_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-[#0D1322] border border-slate-800 text-slate-300 font-semibold text-[11px]">
                      {rec.aging_bucket} Days
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{rec.days_in_ar} days</td>
                  <td className="py-3.5 px-4 font-black text-white">${rec.outstanding_amount?.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.priority === 'High'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDirectEmail(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 rounded-xl text-xs font-semibold border border-sky-800/60"
                      title="Send email reminder directly to patient/payer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => handleGenerateScript(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0D1322] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800"
                      title="View AI call script"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Script</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Outreach Modal */}
      {scriptModal && generatedScript && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Payer Outreach Script — {selectedRecord.claim_number}</span>
              </h3>
              <button onClick={() => setScriptModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Draft Email for Insurance Representative
                </label>
                <div className="p-3 bg-[#0D1322] rounded-2xl font-mono text-[11px] whitespace-pre-line border border-slate-800 text-slate-200">
                  {generatedScript.draft_email_body}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Call Script
                </label>
                <div className="p-3 bg-[#0D1322] rounded-2xl text-[11px] whitespace-pre-line border border-slate-800 text-slate-200">
                  {generatedScript.call_script}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setScriptModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
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
          defaultSubject={emailModalData.subject}
          defaultBody={emailModalData.body}
        />
      )}
    </div>
  );
}
