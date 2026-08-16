'use client';

import React from 'react';
import Link from 'next/link';
import ParticleCanvas from '@/components/canvas/ParticleCanvas';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#090D16] text-slate-100 bg-medical-grid selection:bg-sky-500 selection:text-white">
      <ParticleCanvas />
      <div className="relative z-10 w-full max-w-md bg-[#111827]/90 backdrop-blur-2xl rounded-4xl p-8 shadow-2xl border border-sky-900/50 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Email Verified Successfully</h1>
        <p className="text-xs text-slate-400">
          Your practice account has been verified. You can now sign in to view your dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/25"
        >
          <span>Sign In to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
