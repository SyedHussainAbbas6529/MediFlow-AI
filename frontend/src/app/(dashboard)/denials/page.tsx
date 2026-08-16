'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  FileCheck,
  Sparkles,
  BookOpen
} from 'lucide-react';
import AiTextEditor from '@/components/ai/AiTextEditor';
import { useAuth } from '@/lib/auth-context';

export default function DenialsPage() {
  const [denials, setDenials] = useState<any[]>([]);
  const [selectedDenial, setSelectedDenial] = useState<any | null>(null);
  const [appealData, setAppealData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { dataMode } = useAuth();

  const demoDenials = [
    {
      id: 'den-demo-001',
      claim_number: 'CLM-2026-9041',
      patient_name: 'Eleanor Vance',
      payer_name: 'Medicare Part B (Noridian MAC)',
      total_charge: 1250.00,
      denial_code: 'CO-50',
      denial_reason: 'Non-covered service: medical necessity criteria not met according to payer LCD L33777.',
      status: 'Appeal Drafted',
      deadline_days: 45
    },
    {
      id: 'den-demo-002',
      claim_number: 'CLM-2026-6621',
      patient_name: 'Lucas Bennett',
      payer_name: 'UnitedHealthcare Commercial',
      total_charge: 450.00,
      denial_code: 'CO-16',
      denial_reason: 'Claim lacks valid prior-authorization number or referral code from primary care.',
      status: 'Action Required',
      deadline_days: 28
    },
    {
      id: 'den-demo-003',
      claim_number: 'CLM-2026-5510',
      patient_name: 'Sophia Martinez',
      payer_name: 'Blue Cross Blue Shield of Texas',
      total_charge: 680.00,
      denial_code: 'CO-97',
      denial_reason: 'Payment adjusted because this procedure is included in the primary surgical service.',
      status: 'Ready for Review',
      deadline_days: 60
    }
  ];

  const loadDenials = () => {
    setIsLoading(true);
    api.getDenials()
      .then((data) => {
        setDenials(data);
        const activeList = data.length > 0 ? data : (dataMode === 'demo' ? demoDenials : []);
        if (activeList.length > 0 && !selectedDenial) {
          handleSelectDenial(activeList[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDenials();
  }, [dataMode]);

  const activeDenialsList = denials.length > 0 ? denials : (dataMode === 'demo' ? demoDenials : []);

  const handleSelectDenial = async (denial: any) => {
    setSelectedDenial(denial);
    try {
      if (denial.id.startsWith('den-demo')) {
        setAppealData({
          denial_id: denial.id,
          denial_code: denial.denial_code,
          denial_reason: denial.denial_reason,
          appeal_letter_text: `Re: Level 1 Appeal for Claim #${denial.claim_number}\nPatient: ${denial.patient_name}\nPayer: ${denial.payer_name}\n\nDear Claims Appeals Department,\n\nWe are formally appealing the denial of Claim #${denial.claim_number} issued under Denial Code ${denial.denial_code} (${denial.denial_reason}).\n\nClinical Justification:\nThe treatment provided was medically necessary and met all diagnostic coverage criteria as documented in the attached clinical progress notes and operative records.\n\nPlease re-adjudicate this claim for full payment in accordance with published guidelines.\n\nSincerely,\nDr. Marcus Vance, MD\nApex Medical Healthcare`,
          cited_policy_title: 'Medicare LCD L33777 - Joint Injections & Conservative Care',
          status: 'Drafted'
        });
      } else {
        const appeal = await api.draftAppeal(denial.id);
        setAppealData(appeal);
      }
    } catch (err) {
      console.error('Appeal draft error:', err);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Denied Claims & Appeals
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Fix rejected claims and write appeal letters with AI help.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Denial Queue List */}
        <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white">Denied Claims Queue</span>
            <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-900/60">
              {activeDenialsList.length} Pending
            </span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto">
            {activeDenialsList.map((d) => {
              const isSelected = selectedDenial?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDenial(d)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500 shadow-xs'
                      : 'bg-[#0D1322] border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-900/60">
                      Reason: {d.denial_code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {d.approval_likelihood_score}% Win Likelihood
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white mt-2 truncate">
                    {d.claim_number} — {d.patient_name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {d.denial_reason}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{d.payer_name}</span>
                    <span className="font-semibold text-sky-400">{d.payer_policy_number}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Diagnosis + Appeal Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDenial && (
            <div className="p-4 rounded-3xl bg-[#111827] border border-sky-900/40 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Root-Cause Diagnosis</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedDenial.ai_interpreted_reason}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-300 bg-[#0D1322] px-2.5 py-1 rounded-xl border border-sky-900/60">
                  <BookOpen className="w-3.5 h-3.5" />
                  {selectedDenial.cited_policy_text || 'Medicare LCD L33777'}
                </span>
              </div>
            </div>
          )}

          {appealData && selectedDenial ? (
            <AiTextEditor
              appealId={appealData.id}
              initialText={appealData.appeal_letter_text}
              claimNumber={selectedDenial.claim_number}
              payerName={selectedDenial.payer_name}
              onApproved={loadDenials}
            />
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-[#111827] rounded-3xl border border-slate-800">
              Select a denied claim from the queue to review reasons and draft an appeal letter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
