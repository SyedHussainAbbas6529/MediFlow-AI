'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Mail,
  Send
} from 'lucide-react';
import SendEmailModal from '@/components/ui/SendEmailModal';

export default function CredentialingPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any | null>(null);
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    email: string;
    name: string;
    subject: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    api.getProviders().then((data) => {
      setProviders(data);
      if (data.length > 0) {
        setSelectedProviderId(data[0].id);
        loadChecklist(data[0].id);
      }
    });
  }, []);

  const loadChecklist = (provId: string) => {
    api.getProviderChecklist(provId).then(setChecklist).catch(console.error);
  };

  const handleSelectProvider = (provId: string) => {
    setSelectedProviderId(provId);
    loadChecklist(provId);
  };

  const currentProvider = providers.find((p) => p.id === selectedProviderId);

  const handleOpenLicenseReminder = (cred: any) => {
    const docName = currentProvider ? `Dr. ${currentProvider.first_name} ${currentProvider.last_name}` : 'Doctor';
    const docEmail = currentProvider?.email || `dr.${currentProvider?.last_name?.toLowerCase() || 'provider'}@mediflowai.health`;

    setEmailModalData({
      isOpen: true,
      email: docEmail,
      name: docName,
      subject: `URGENT: ${cred.credential_type} Expiration Alert for ${docName}`,
      body: `Dear ${docName},\n\nThis is an automated license compliance reminder from MediFlow AI. Your ${cred.credential_type} is scheduled to expire on ${cred.expiration_date} (${cred.days_until_expiry} days remaining).\n\nPlease submit your updated certificate or license renewal to our credentialing portal to ensure uninterrupted insurance billing.\n\nBest regards,\nProvider Credentialing Department\nApex Medical Practice`
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Doctor Licenses & Renewals
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Keep doctor state licenses, DEA numbers, and certifications up to date with automated email alerts.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm p-4 space-y-3">
          <span className="text-xs font-bold text-white">Active Doctors</span>
          <div className="space-y-2 max-h-[75vh] overflow-y-auto">
            {providers.map((p) => {
              const isSelected = selectedProviderId === p.id;
              const docEmail = p.email || `dr.${p.last_name.toLowerCase()}@mediflowai.health`;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProvider(p.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-sky-950/50 border-sky-500 shadow-xs'
                      : 'bg-[#0D1322] border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">
                      Dr. {p.first_name} {p.last_name}
                    </p>
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
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.specialty}</p>
                  <p className="text-[10px] text-sky-400 font-mono mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {docEmail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {checklist && (
            <>
              {/* AI Enrollment Summary Card */}
              <div className="p-5 rounded-3xl bg-[#111827] border border-sky-900/40 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>AI License & Insurance Enrollment Summary</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {checklist.ai_summary}
                </div>
              </div>

              {/* Checklist Items Table */}
              <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden p-4">
                <h3 className="text-xs font-bold text-white mb-3">
                  License Status & Expiration Dates
                </h3>
                <div className="space-y-2.5">
                  {checklist.credentials?.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{c.credential_type}</p>
                        <p className="text-[11px] text-slate-400">
                          Expires: {c.expiration_date} ({c.days_until_expiry} days left)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            c.status === 'Active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>

                        <button
                          onClick={() => handleOpenLicenseReminder(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-400 rounded-xl text-xs font-semibold border border-sky-800/60 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email Alert</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Send Email Reminder Modal */}
      {emailModalData?.isOpen && (
        <SendEmailModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          defaultEmail={emailModalData.email}
          defaultName={emailModalData.name}
          recipientType="provider"
          defaultSubject={emailModalData.subject}
          defaultBody={emailModalData.body}
        />
      )}
    </div>
  );
}
