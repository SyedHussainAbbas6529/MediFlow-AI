'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('6M');
  const { dataMode } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    api.getDashboardMetrics()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <HeartPulse className="w-9 h-9 text-sky-400 animate-ecg-pulse" />
          <p className="text-sm font-semibold text-slate-300">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const isDemo = dataMode === 'demo';

  // Demo Dataset for Testing
  const demoKpis = {
    total_claims: { label: 'Total Claims Sent', value: '300', delta: '+12.4%', sparkline: [40, 55, 60, 78, 85, 92, 105, 120] },
    claims_billed: { label: 'Total Amount Billed', value: '$245,000', delta: '+8.2%', sparkline: [120000, 145000, 160000, 185000, 210000, 245000] },
    collections: { label: 'Money Received', value: '$205,000', delta: '+14.6%', sparkline: [95000, 110000, 130000, 155000, 180000, 205000] },
    denial_rate: { label: 'Denied Claims Rate', value: '4.2%', delta: '-2.1%', sparkline: [7.8, 6.5, 5.9, 5.2, 4.8, 4.2] },
    ar_outstanding: { label: 'Waiting to be Paid', value: '$39,000', delta: '-5.4%', sparkline: [65000, 58000, 52000, 48000, 42000, 39000] },
  };

  const demoRevenueOverview = [
    { month: 'Oct', billed: 145000, collected: 122000, ar_outstanding: 23000 },
    { month: 'Nov', billed: 162000, collected: 138000, ar_outstanding: 24000 },
    { month: 'Dec', billed: 178000, collected: 154000, ar_outstanding: 24000 },
    { month: 'Jan', billed: 195000, collected: 168000, ar_outstanding: 27000 },
    { month: 'Feb', billed: 210000, collected: 182000, ar_outstanding: 28000 },
    { month: 'Mar', billed: 245000, collected: 212000, ar_outstanding: 33000 },
  ];

  const demoClaimsByStatus = [
    { status: 'Paid', count: 195, percentage: 65, color: '#10B981' },
    { status: 'In Adjudication', count: 54, percentage: 18, color: '#6366F1' },
    { status: 'In Review', count: 33, percentage: 11, color: '#F59E0B' },
    { status: 'Denied', count: 18, percentage: 6, color: '#EF4444' },
  ];

  const demoProviderAudit = [
    { id: 'p1', name: 'Dr. Marcus Vance', specialty: 'Orthopedic Surgery', status: 'Ready', score: 96, npi: '1982049182', last_updated: 'Mar 12, 2026' },
    { id: 'p2', name: 'Dr. Sarah Jenkins', specialty: 'Internal Medicine', status: 'Ready', score: 92, npi: '1092834710', last_updated: 'Mar 10, 2026' },
    { id: 'p3', name: 'Dr. Alex Rivera', specialty: 'Cardiology', status: 'Conditional', score: 84, npi: '1482910394', last_updated: 'Mar 08, 2026' },
    { id: 'p4', name: 'Dr. Emily Watson', specialty: 'Pediatrics', status: 'Ready', score: 98, npi: '1728394019', last_updated: 'Mar 05, 2026' },
    { id: 'p5', name: 'Dr. James Chen', specialty: 'Dermatology', status: 'Action Needed', score: 68, npi: '1839201948', last_updated: 'Mar 01, 2026' },
  ];

  const demoExpiringSoon = [
    { id: 'c1', provider_name: 'Dr. Marcus Vance', credential_type: 'Texas State Medical License', expiration_date: '2026-04-20', days_left: 38, urgency: 'high' },
    { id: 'c2', provider_name: 'Dr. Sarah Jenkins', credential_type: 'DEA Registration Certificate', expiration_date: '2026-05-15', days_left: 64, urgency: 'medium' },
    { id: 'c3', provider_name: 'Dr. Alex Rivera', credential_type: 'CAQH Attestation Review', expiration_date: '2026-03-30', days_left: 14, urgency: 'high' },
  ];

  const kpis = isDemo ? demoKpis : (data.kpis || {
    total_claims: { label: 'Total Claims Sent', value: '0', delta: '+0.0%', sparkline: [0, 0, 0, 0, 0, 0] },
    claims_billed: { label: 'Total Amount Billed', value: '$0.00', delta: '+0.0%', sparkline: [0, 0, 0, 0, 0, 0] },
    collections: { label: 'Money Received', value: '$0.00', delta: '+0.0%', sparkline: [0, 0, 0, 0, 0, 0] },
    denial_rate: { label: 'Denied Claims Rate', value: '0.0%', delta: '0.0%', sparkline: [0, 0, 0, 0, 0, 0] },
    ar_outstanding: { label: 'Waiting to be Paid', value: '$0.00', delta: '0.0%', sparkline: [0, 0, 0, 0, 0, 0] },
  });

  const revenue_overview = isDemo ? demoRevenueOverview : (data.revenue_overview || []);
  const claims_by_status = isDemo ? demoClaimsByStatus : (data.claims_by_status || []);
  const provider_audit = isDemo ? demoProviderAudit : (data.provider_audit || []);
  const expiring_soon = isDemo ? demoExpiringSoon : (data.expiring_soon || []);
  const quick_prompts = data.quick_prompts || [];

  const SIMPLE_LABELS: Record<string, { title: string; subtitle: string; icon: any }> = {
    total_claims: { title: 'Total Claims Sent', subtitle: 'Claims sent to insurance', icon: FileText },
    claims_billed: { title: 'Total Amount Billed', subtitle: 'Total money requested', icon: DollarSign },
    collections: { title: 'Money Received', subtitle: 'Paid by insurance & patients', icon: TrendingUp },
    denial_rate: { title: 'Denied Claims Rate', subtitle: 'Claims rejected by insurance', icon: AlertTriangle },
    ar_outstanding: { title: 'Waiting to be Paid', subtitle: 'Unpaid bills being tracked', icon: Clock },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full border ${
              isDemo
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
              {isDemo ? 'Demo Mode (Sample Testing Data Active)' : 'Live Practice Operations (Clean State)'}
            </span>
            <span className="text-xs text-slate-400">
              {isDemo ? 'Interactive Sandbox' : 'HIPAA Secure • Real Data'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Practice Overview & Billing Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isDemo
              ? 'Viewing realistic sample testing dataset. Click the top-right toggle to switch to your live clean database.'
              : 'Real-time practice records, claim processing metrics, and clinical revenue cycle.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111827] border border-slate-800 rounded-2xl p-1 text-xs font-semibold shadow-xs">
            {['1 Month', '3 Months', '6 Months', '1 Year'].map((t, idx) => {
              const code = ['1M', '3M', '6M', '1Y'][idx];
              return (
                <button
                  key={t}
                  onClick={() => setTimeframe(code)}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    timeframe === code
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <Link
            href="/assistant"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards in Dark Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(kpis).map(([key, kpi]: [string, any]) => {
          const info = SIMPLE_LABELS[key] || { title: kpi.label, subtitle: '', icon: FileText };
          const Icon = info.icon;

          return (
            <div
              key={key}
              className="bg-[#111827] rounded-3xl p-5 border border-slate-800/90 shadow-card hover:border-sky-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center font-bold border border-sky-800/40">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                  <TrendingUp className="w-3 h-3" />
                  {kpi.delta}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {info.title}
                </p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {info.subtitle}
                </p>
              </div>

              {/* Sparkline */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-end gap-1 h-6">
                {kpi.sparkline?.map((val: number, idx: number) => {
                  const max = Math.max(...kpi.sparkline, 1);
                  const h = Math.max(15, (val / max) * 100);
                  return (
                    <div
                      key={idx}
                      style={{ height: `${h}%` }}
                      className="flex-1 bg-sky-900/40 rounded-xs hover:bg-sky-400 transition-colors"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Money Chart & Claims Donut in Dark Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Chart */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">
                Income & Payment Tracking
              </h2>
              <p className="text-xs text-slate-400">Total Billed, Money Collected, and Payments Still Waiting</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Billed
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Collected
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Waiting to be Paid
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_overview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '16px', border: '1px solid #1E293B', color: '#FFF' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="billed" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" dataKey="collected" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
                <Area type="monotone" dataKey="ar_outstanding" stroke="#F59E0B" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claims Status Donut */}
        <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-card flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Claims Status</h2>
            <p className="text-xs text-slate-400">Where all your claims stand right now</p>
          </div>

          <div className="relative h-56 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={claims_by_status.length > 0 ? claims_by_status : [{ status: 'No Claims Yet', count: 1, color: '#1E293B' }]}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(claims_by_status.length > 0 ? claims_by_status : [{ color: '#1E293B' }]).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #1E293B' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">
                {claims_by_status.reduce((sum: number, item: any) => sum + (item.count || 0), 0)}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Claims</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {claims_by_status.map((item: any) => (
              <div key={item.status} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="truncate">
                  <p className="text-[11px] font-semibold text-slate-200 truncate">{item.status}</p>
                  <p className="text-[10px] text-slate-400">{item.count} claims ({item.percentage}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Doctor Status Table + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Status Table */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-400" />
                <span>Doctor License & Enrollment Check</span>
              </h2>
              <p className="text-xs text-slate-400">Make sure all doctors are approved to bill insurance</p>
            </div>
            <Link href="/credentialing" className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1">
              <span>View All Doctors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {provider_audit.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-[#0D1322] rounded-2xl border border-slate-800">
              <Stethoscope className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No doctors added in Real Practice Mode yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click &quot;+ Create New&quot; at the top to add your first doctor profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-[#0D1322]">
                    <th className="py-3 px-3">Doctor</th>
                    <th className="py-3 px-3">Specialty</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Ready Score</th>
                    <th className="py-3 px-3">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {provider_audit.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#0D1322]/60 transition-colors">
                      <td className="py-3.5 px-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-950 text-sky-400 font-bold flex items-center justify-center text-xs border border-sky-800/40">
                          {p.name.replace('Dr. ', '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400">Doctor ID: {p.npi}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">{p.specialty}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'Ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : p.status === 'Conditional'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {p.status === 'Ready' ? '✓ Ready to Bill' : p.status === 'Conditional' ? 'Review Needed' : 'Action Needed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-[#0D1322] rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                p.score > 90 ? 'bg-emerald-400' : p.score > 75 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${p.score}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200">{p.score}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{p.last_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Stack */}
        <div className="space-y-6">
          {/* AI Quick Help Card */}
          <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-indigo-800 text-white rounded-3xl p-6 shadow-xl shadow-sky-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-200 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight">AI Assistant Quick Help</h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                Instant Help
              </span>
            </div>

            <p className="text-xs text-sky-100 mb-4 leading-relaxed">
              Click any quick question below to get answers with exact rule citations:
            </p>

            <div className="space-y-1.5 mb-5">
              {quick_prompts.map((q: any, idx: number) => (
                <Link
                  key={idx}
                  href={`/assistant`}
                  className="block p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors text-white/90 truncate"
                >
                  &quot;{q.prompt}&quot;
                </Link>
              ))}
            </div>

            <Link
              href="/assistant"
              className="w-full py-2.5 bg-white text-indigo-700 hover:bg-sky-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>Open AI Assistant Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Expiring Soon Card */}
          <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Licenses Expiring Soon</span>
              </h3>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                {expiring_soon.length} Reminders
              </span>
            </div>

            {expiring_soon.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No licenses expiring soon.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expiring_soon.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.provider_name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{item.credential_type}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-1 rounded-xl shrink-0 border border-red-900">
                      {item.days_left} days left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
