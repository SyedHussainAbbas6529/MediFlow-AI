'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ParticleCanvas from '@/components/canvas/ParticleCanvas';
import { ArrowRight, Mail, HeartPulse } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#090D16] text-slate-100 bg-medical-grid selection:bg-sky-500 selection:text-white">
      <ParticleCanvas />
      <div className="relative z-10 w-full max-w-md bg-[#111827]/90 backdrop-blur-2xl rounded-4xl p-8 shadow-2xl border border-sky-900/50">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mx-auto mb-3 animate-ecg-pulse">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Reset Your Password</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your email and we will send you a secure reset link.</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-2xl text-center space-y-2">
            <p>Password reset instructions have been sent to {email}.</p>
            <Link href="/login" className="inline-block mt-2 text-sky-400 font-bold hover:underline">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mediflowai.health"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0D1322] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden focus:ring-2 focus:ring-sky-500/40"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/25 flex items-center justify-center gap-2"
            >
              <span>Send Reset Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              <Link href="/login" className="text-sky-400 font-bold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
