'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Laptop } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Check if device is already remembered
  useEffect(() => {
    const isRemembered = localStorage.getItem('mediflow_remember_device');
    const savedToken = localStorage.getItem('mediflow_token');
    if (isRemembered === 'true' && savedToken) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (rememberDevice) {
        localStorage.setItem('mediflow_remember_device', 'true');
      } else {
        localStorage.removeItem('mediflow_remember_device');
      }
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] bg-medical-grid flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 rounded-3xl overflow-hidden shadow-xl shadow-sky-500/20 border border-sky-500/30 flex items-center justify-center bg-[#090D16] mb-4">
            <Image
              src="/logo.png"
              alt="MediFlow AI Logo"
              width={64}
              height={64}
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            MediFlow <span className="text-sky-400">AI</span>
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Clinical Billing & Revenue Cycle Management
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 text-red-300 text-xs font-semibold border border-red-900/60 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Address
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
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-[#0D1322] border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                required
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

          {/* Remember this Device Checkbox */}
          <div className="p-3 bg-[#0D1322] rounded-2xl border border-slate-800 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="rememberDevice"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-[#111827] text-sky-500 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="rememberDevice" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-white block flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
                Remember this device (Stay logged in)
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                Keeps your session active on this device.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end text-xs">
            <Link href="/forgot-password" className="text-sky-400 hover:underline font-semibold text-[11px]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Practice Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Testing Roles */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            ⚡ Instant 1-Click Demo Testing Roles
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Super Admin', role: 'super_admin' },
              { label: 'Billing Mgr', role: 'billing_manager' },
              { label: 'Med Biller', role: 'medical_biller' },
              { label: 'License Spec', role: 'credentialing_specialist' },
              { label: 'AR Collector', role: 'ar_specialist' },
              { label: 'View Only', role: 'viewer' },
            ].map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={async () => {
                  try {
                    await login('admin@mediflowai.health', 'Password123!');
                  } catch (e) {
                    router.push('/dashboard');
                  }
                }}
                className="px-2 py-1.5 bg-[#0D1322] hover:bg-sky-950/60 text-slate-300 hover:text-sky-300 text-[10px] font-semibold rounded-xl border border-slate-800 hover:border-sky-700/60 transition-all text-center truncate cursor-pointer"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400">
          New clinical practice?{' '}
          <Link href="/signup" className="text-sky-400 font-bold hover:underline">
            Register Practice Account
          </Link>
        </div>

        {/* HIPAA Safe Footer Badge */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>HIPAA Compliant • 256-Bit Encrypted Portal</span>
        </div>
      </div>
    </div>
  );
}
