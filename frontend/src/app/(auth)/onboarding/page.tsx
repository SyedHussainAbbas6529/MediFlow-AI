'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ParticleCanvas from '@/components/canvas/ParticleCanvas';
import { Check, ArrowRight, Building, Users, Link2 } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#090D16] text-slate-100 bg-medical-grid selection:bg-sky-500 selection:text-white">
      <ParticleCanvas />

      <div className="relative z-10 w-full max-w-xl bg-[#111827]/90 backdrop-blur-2xl rounded-4xl p-8 shadow-2xl border border-sky-900/50">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Practice Details' },
            { num: 2, label: 'Invite Team' },
            { num: 3, label: 'Connect Insurance' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.num
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                    : 'bg-[#0D1322] text-slate-500 border border-slate-800'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step >= s.num ? 'text-white' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Practice Information</h2>
            <p className="text-xs text-slate-400">Confirm your clinic details for claim submissions.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Billing Tax ID / EIN</label>
                <input type="text" defaultValue="74-9823412" className="w-full px-3.5 py-2.5 text-xs bg-[#0D1322] border border-slate-700/80 rounded-2xl text-white outline-hidden focus:ring-2 focus:ring-sky-500/40" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Clinic Address</label>
                <input type="text" defaultValue="450 Medical Center Blvd, Suite 800, Austin, TX" className="w-full px-3.5 py-2.5 text-xs bg-[#0D1322] border border-slate-700/80 rounded-2xl text-white outline-hidden focus:ring-2 focus:ring-sky-500/40" />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 mt-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>Next: Invite Staff</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Invite Your Billing Staff</h2>
            <p className="text-xs text-slate-400">Add medical billers and license coordinators.</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="email" placeholder="biller@yourpractice.com" className="flex-1 px-3.5 py-2.5 text-xs bg-[#0D1322] border border-slate-700/80 rounded-2xl text-white outline-hidden" />
                <select className="text-xs bg-[#0D1322] border border-slate-700/80 rounded-2xl px-3 text-slate-200">
                  <option>Medical Biller</option>
                  <option>Billing Manager</option>
                  <option>License Specialist</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-xs text-slate-400">Back</button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Next: Connect Insurance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Connect Insurance Gateways</h2>
            <p className="text-xs text-slate-400">Enable fast electronic claim submissions and live payment tracking.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Waystar Gateway', 'Availity Portal', 'Athenahealth EHR', 'Medicare Part B'].map((p) => (
                <div key={p} className="p-3.5 rounded-2xl border border-sky-900/60 bg-[#0D1322] flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{p}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Ready</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 mt-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
