'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Eye
} from 'lucide-react';
import ScrubbingReviewModal from '@/components/ai/ScrubbingReviewModal';

export default function BillingPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredClaims = search
    ? claims.filter((c) => c.claim_number.toLowerCase().includes(search.toLowerCase()) || c.patient_name?.toLowerCase().includes(search.toLowerCase()))
    : claims;

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
    </div>
  );
}
