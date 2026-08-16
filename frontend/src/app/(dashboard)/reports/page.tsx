'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Download,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    api.getReportsMetrics(timeframe).then(setMetrics).catch(console.error);
  }, [timeframe]);

  if (!metrics) return <div className="p-8 text-center text-xs text-slate-400">Loading reports...</div>;

  const { kpis, trends, payer_performance } = metrics;

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Reports & Practice Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            First-pass clean claim rates, denial trends, and insurance payment performance.
          </p>
        </div>

        <a
          href="http://localhost:8000/api/v1/reports/export-csv"
          download="mediflow_report.csv"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#111827] rounded-3xl border border-slate-800 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved on 1st Try</span>
          <h3 className="text-2xl font-black text-white mt-1">{kpis.first_pass_rate}%</h3>
          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{kpis.first_pass_delta} vs last month</span>
        </div>
        <div className="p-5 bg-[#111827] rounded-3xl border border-slate-800 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Claims Denied Rate</span>
          <h3 className="text-2xl font-black text-white mt-1">{kpis.denial_rate}%</h3>
          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{kpis.denial_rate_delta} (Decreased)</span>
        </div>
        <div className="p-5 bg-[#111827] rounded-3xl border border-slate-800 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Days to Get Paid</span>
          <h3 className="text-2xl font-black text-white mt-1">{kpis.avg_days_in_ar} Days</h3>
          <span className="text-[11px] font-bold text-emerald-400 mt-1 block">{kpis.avg_days_delta} faster</span>
        </div>
        <div className="p-5 bg-[#111827] rounded-3xl border border-slate-800 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appeals Won Rate</span>
          <h3 className="text-2xl font-black text-white mt-1">{kpis.appeal_success_rate}%</h3>
          <span className="text-[11px] font-bold text-sky-400 mt-1 block">{kpis.appeal_success_delta} increase</span>
        </div>
      </div>

      {/* Chart: Trend Comparison */}
      <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card">
        <h3 className="text-sm font-bold text-white mb-4">First-Pass Acceptance vs Denial Rate Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', border: '1px solid #1E293B', color: '#FFF' }} />
              <Line type="monotone" dataKey="first_pass" stroke="#10B981" strokeWidth={3} name="First Pass %" />
              <Line type="monotone" dataKey="denials" stroke="#EF4444" strokeWidth={3} name="Denial Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payer Performance Table */}
      <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden p-6">
        <h3 className="text-sm font-bold text-white mb-4">Insurance Company Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3">Insurance Payer</th>
                <th className="pb-3">Claims Processed</th>
                <th className="pb-3">Approval Rate</th>
                <th className="pb-3">Avg Days to Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payer_performance.map((p: any) => (
                <tr key={p.payer} className="hover:bg-[#0D1322]/60">
                  <td className="py-3 font-bold text-white">{p.payer}</td>
                  <td className="py-3 text-slate-300">{p.claims}</td>
                  <td className="py-3 font-semibold text-emerald-400">{p.acceptance_rate}%</td>
                  <td className="py-3 text-slate-400">{p.avg_pay_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
