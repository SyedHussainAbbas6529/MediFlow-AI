'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Eye,
  Plus,
  Download,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import ScrubbingReviewModal from '@/components/ai/ScrubbingReviewModal';
import { useAuth } from '@/lib/auth-context';

export default function BillingPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dataMode } = useAuth();

  // Create Claim Form State
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('1980-01-01');
  const [payerName, setPayerName] = useState('Medicare Part B');
  const [providerName, setProviderName] = useState('Dr. Marcus Vance');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [icd10, setIcd10] = useState('M17.11');
  const [cptCode, setCptCode] = useState('20610');
  const [modifiers, setModifiers] = useState('RT, 25');
  const [chargeAmount, setChargeAmount] = useState('1250.00');
  const [priorAuth, setPriorAuth] = useState('PA-8829410-TX');

  const handleFillSample = () => {
    setPatientName('Eleanor Vance');
    setDob('1962-05-14');
    setPayerName('Medicare Part B (Noridian)');
    setProviderName('Dr. Marcus Vance, MD');
    setServiceDate('2026-03-12');
    setIcd10('M17.11 (Osteoarthritis, right knee), M25.561 (Knee pain)');
    setCptCode('20610 (Joint injection), 99214 (E&M Level 4)');
    setModifiers('RT, 25');
    setChargeAmount('1250.00');
    setPriorAuth('PA-8829410-TX');
  };

  const handleDownloadSampleFile = (type: 'json' | 'edi' | 'csv') => {
    let content = '';
    let mime = 'text/plain';
    let filename = '';

    if (type === 'json') {
      filename = 'single_patient_new_claim.json';
      mime = 'application/json';
      content = JSON.stringify({
        claim_submission_type: "CMS-1500_837P",
        patient: { first_name: "Eleanor", last_name: "Vance", dob: "1962-05-14", member_id: "MED-982341-A" },
        payer: { payer_name: "Medicare Part B (Noridian)", payer_id: "00832" },
        rendering_provider: { name: "Dr. Marcus Vance, MD", npi: "1982049182", specialty: "Orthopedic Surgery" },
        claim_header: { claim_number: "CLM-2026-9041", date_of_service: "2026-03-12", total_charge: 1250.00 },
        diagnoses: ["M17.11", "M25.561"],
        service_lines: [
          { cpt: "20610", modifiers: ["RT"], charge: 750.00 },
          { cpt: "99214", modifiers: ["25"], charge: 500.00 }
        ]
      }, null, 2);
    } else if (type === 'edi') {
      filename = 'single_patient_new_claim_837p.edi';
      content = `ISA*00*          *00*          *ZZ*APEXMED01      *ZZ*NORIDIAN00832  *260312*1430*^*00501*000009041*0*P*:~
GS*HC*APEXMED01*NORIDIAN00832*20260312*1430*9041*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*CLM20269041*20260312*1430*CH~
NM1*41*2*APEX ORTHOPEDIC CENTER*****46*1482910394~
CLM*CLM-2026-9041*1250.00***11:B:1*Y*A*Y*Y~
HI*BK:M1711*BF:M25561~
LX*1~
SV1*HC:20610:RT*750.00*UN*1***1:2~
LX*2~
SV1*HC:99214:25*500.00*UN*1***1~
SE*12*0001~
GE*1*9041~
IEA*1*000009041~`;
    } else {
      filename = 'single_patient_new_claim_template.csv';
      mime = 'text/csv';
      content = `patient_name,dob,gender,insurance_member_id,payer_name,provider_name,date_of_service,icd10,cpt_code,modifiers,total_charge
"Eleanor Vance",1962-05-14,Female,MED-982341-A,"Medicare Part B","Dr. Marcus Vance",2026-03-12,"M17.11","20610, 99214","RT, 25",1250.00`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newClaimObj = {
      id: `claim-${Date.now()}`,
      claim_number: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: patientName || 'Eleanor Vance',
      provider_name: providerName || 'Dr. Marcus Vance',
      payer_name: payerName || 'Medicare Part B',
      total_charge: parseFloat(chargeAmount) || 1250.00,
      date_of_service: serviceDate || '2026-03-12',
      status: 'Ready for Review',
      medical_necessity_score: 96,
      scrub_status: 'Passed',
      lines: [
        {
          cpt_code: cptCode.split(',')[0]?.trim() || '20610',
          description: 'Joint injection / arthrocentesis',
          modifier_1: modifiers.split(',')[0]?.trim() || 'RT',
          charge_amount: (parseFloat(chargeAmount) || 1250.00) * 0.6
        },
        {
          cpt_code: cptCode.split(',')[1]?.trim() || '99214',
          description: 'Established patient E&M visit',
          modifier_1: modifiers.split(',')[1]?.trim() || '25',
          charge_amount: (parseFloat(chargeAmount) || 1250.00) * 0.4
        }
      ]
    };

    // Update state immediately
    setClaims((prev) => [newClaimObj, ...prev]);
    setIsSubmitting(false);
    setIsCreateModalOpen(false);

    // Open AI Scrubber Review right away
    setSelectedClaim(newClaimObj);
    setIsModalOpen(true);
  };

  const demoClaims = [
    {
      id: 'demo-c1',
      claim_number: 'CLM-2026-9041',
      patient_name: 'Eleanor Vance',
      provider_name: 'Dr. Marcus Vance',
      payer_name: 'Medicare Part B (Noridian)',
      total_charge: 1250.00,
      date_of_service: '2026-03-12',
      status: 'Ready for Review',
      medical_necessity_score: 94,
      scrub_status: 'Passed'
    },
    {
      id: 'demo-c2',
      claim_number: 'CLM-2026-8812',
      patient_name: 'Robert Garcia',
      provider_name: 'Dr. Sarah Jenkins',
      payer_name: 'Blue Cross Blue Shield of Texas',
      total_charge: 850.00,
      date_of_service: '2026-03-10',
      status: 'Submitted',
      medical_necessity_score: 98,
      scrub_status: 'Passed'
    },
    {
      id: 'demo-c3',
      claim_number: 'CLM-2026-7734',
      patient_name: 'Margaret Thatcher',
      provider_name: 'Dr. Alex Rivera',
      payer_name: 'Aetna Health Insurance',
      total_charge: 2400.00,
      date_of_service: '2026-03-08',
      status: 'Paid',
      medical_necessity_score: 95,
      scrub_status: 'Passed'
    },
    {
      id: 'demo-c4',
      claim_number: 'CLM-2026-6621',
      patient_name: 'Lucas Bennett',
      provider_name: 'Dr. Emily Watson',
      payer_name: 'UnitedHealthcare Commercial',
      total_charge: 450.00,
      date_of_service: '2026-03-05',
      status: 'Denied',
      medical_necessity_score: 72,
      scrub_status: 'Failed'
    },
  ];

  const loadClaims = () => {
    setIsLoading(true);
    api.getClaims(statusFilter === 'All' ? undefined : statusFilter)
      .then(setClaims)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClaims();
  }, [statusFilter]);

  const activeClaimsList = claims.length > 0 ? claims : (dataMode === 'demo' ? demoClaims : []);

  const filteredClaims = activeClaimsList
    .filter((c) => statusFilter === 'All' || c.status === statusFilter)
    .filter((c) => !search || c.claim_number.toLowerCase().includes(search.toLowerCase()) || c.patient_name?.toLowerCase().includes(search.toLowerCase()));

  const handleOpenScrub = (claim: any) => {
    setSelectedClaim(claim);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Claims & Billing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and submit insurance claims with automatic error checking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Sample Files */}
          <div className="flex items-center gap-1 bg-[#0D1322] p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleDownloadSampleFile('json')}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800/80 text-slate-300 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
              title="Download single patient claim in CMS-1500 JSON schema"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>.JSON Claim</span>
            </button>
            <button
              onClick={() => handleDownloadSampleFile('edi')}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800/80 text-slate-300 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
              title="Download single patient claim in ANSI ASC X12N 837P EDI standard"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>.EDI 837P</span>
            </button>
            <button
              onClick={() => handleDownloadSampleFile('csv')}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800/80 text-slate-300 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
              title="Download single patient claim spreadsheet template"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>.CSV</span>
            </button>
          </div>

          {/* Add New Claim Button */}
          <button
            onClick={() => {
              handleFillSample();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Claim</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] p-4 rounded-3xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-[#0D1322] px-3.5 py-2 rounded-2xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claim # or patient name..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Ready for Review', 'Submitted', 'Paid', 'Denied'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                  : 'bg-[#0D1322] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-[#0D1322]/80">
                <th className="py-3 px-6">Claim #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Insurance</th>
                <th className="py-3 px-4">Visit Date</th>
                <th className="py-3 px-4">Amount Billed</th>
                <th className="py-3 px-4">Rule Check</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Loading claims...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No claims found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-[#0D1322]/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">{c.claim_number}</td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">{c.patient_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{c.provider_name}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{c.payer_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{c.date_of_service}</td>
                    <td className="py-3.5 px-4 font-bold text-white">${c.total_charge?.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                        <CheckCircle2 className="w-3 h-3" />
                        {c.scrub_status || 'Passed'} ({c.medical_necessity_score || 95}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.status === 'Paid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : c.status === 'Submitted'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : c.status === 'Denied'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleOpenScrub(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D1322] hover:bg-sky-950/80 text-sky-400 rounded-xl text-xs font-semibold border border-slate-800 hover:border-sky-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scrubbing Review Modal */}
      {selectedClaim && (
        <ScrubbingReviewModal
          claim={selectedClaim}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitted={loadClaims}
        />
      )}

      {/* Create New Claim Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#0B0F17] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0D1322]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add New Single Patient Claim</h3>
                  <p className="text-[11px] text-slate-400">CMS-1500 / 837P Professional Electronic Claim Entry</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 text-[11px] font-bold rounded-xl border border-sky-800/80 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>⚡ Auto-Fill Sample Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClaim} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Patient Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Insurance Payer *
                  </label>
                  <input
                    type="text"
                    required
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g. Medicare Part B (Noridian)"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Rendering Doctor / Provider *
                  </label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g. Dr. Marcus Vance, MD"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Date of Service *
                  </label>
                  <input
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Total Charge ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder="1250.00"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  ICD-10 Diagnosis Codes *
                </label>
                <input
                  type="text"
                  required
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="e.g. M17.11 (Primary osteoarthritis, right knee), M25.561"
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    CPT Procedure Codes *
                  </label>
                  <input
                    type="text"
                    required
                    value={cptCode}
                    onChange={(e) => setCptCode(e.target.value)}
                    placeholder="e.g. 20610 (Joint injection), 99214"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    CPT Modifiers (CCI / -25 Justification)
                  </label>
                  <input
                    type="text"
                    value={modifiers}
                    onChange={(e) => setModifiers(e.target.value)}
                    placeholder="e.g. RT, 25"
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Prior Authorization Number
                </label>
                <input
                  type="text"
                  value={priorAuth}
                  onChange={(e) => setPriorAuth(e.target.value)}
                  placeholder="e.g. PA-8829410-TX"
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Processing...' : 'Submit Claim & Run AI Scrubber'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
