'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword({
        email,
        token,
        new_password: newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      {/* Subtle Glow */}
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
          Set New Password
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Create a new secure password for your practice account
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 text-red-300 text-xs font-semibold border border-red-900/60 animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded-2xl text-xs space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
            <p className="font-bold text-emerald-200 text-sm">Password Successfully Updated!</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Your account password has been updated. You can now sign in with your new credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-[#0D1322] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-sky-400 transition-colors focus:outline-hidden"
                title={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-[#0D1322] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-sky-400 transition-colors focus:outline-hidden"
                title={showConfirmPassword ? 'Hide password' : 'View password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Updating Password...' : 'Save New Password'}</span>
            <KeyRound className="w-4 h-4" />
          </button>

          <div className="text-center text-xs text-slate-400 pt-2">
            <Link href="/login" className="text-sky-400 font-bold hover:underline">
              ← Back to Sign In
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#090D16] bg-medical-grid flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <Suspense fallback={<div className="text-white text-xs">Loading recovery portal...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
