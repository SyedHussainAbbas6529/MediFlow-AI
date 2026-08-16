'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, KeyRound, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetData, setResetData] = useState<{ email: string; reset_link: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.forgotPassword(email);
      setResetData({
        email: res.email || email,
        reset_link: res.reset_link || `/reset-password?email=${encodeURIComponent(email)}`
      });
    } catch (err: any) {
      setError(err.message || 'Unable to find account. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] bg-medical-grid flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-sky-500/20 border border-sky-500/30 flex items-center justify-center bg-[#090D16] mb-3">
            <Image
              src="/logo.png"
              alt="MediFlow AI Logo"
              width={56}
              height={56}
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure password recovery for practice accounts
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 text-red-300 text-xs font-semibold border border-red-900/60 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {resetData ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password Reset Authorized</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                A secure password reset link has been generated for <strong className="text-white">{resetData.email}</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#0D1322] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Instant Security Action:</span>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-800">
                  Ready to Reset
                </span>
              </div>

              <Link
                href={resetData.reset_link}
                className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
              >
                <KeyRound className="w-4 h-4" />
                <span>Proceed to Set New Password</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="text-center text-xs text-slate-400 pt-2">
              <Link href="/login" className="text-sky-400 font-bold hover:underline">
                ← Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@practice.health"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0D1322] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Account...' : 'Generate Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-400 pt-2">
              Remember your password?{' '}
              <Link href="/login" className="text-sky-400 font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HIPAA Compliant • 256-Bit Encrypted Portal</span>
        </div>
      </div>
    </div>
  );
}
