'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ParticleCanvas from '@/components/canvas/ParticleCanvas';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  Laptop
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@mediflowai.health');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, switchRole, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If device is remembered or active session exists, go straight to dashboard
    const isRemembered = localStorage.getItem('mediflow_remember_device');
    const savedUser = localStorage.getItem('mediflow_user');
    if (isRemembered === 'true' && savedUser) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (rememberDevice) {
        localStorage.setItem('mediflow_remember_device', 'true');
      } else {
        localStorage.removeItem('mediflow_remember_device');
      }
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoRole = async (roleSlug: string) => {
    localStorage.setItem('mediflow_remember_device', 'true');
    await switchRole(roleSlug);
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#090D16] text-slate-100 bg-medical-grid selection:bg-sky-500 selection:text-white">
      <ParticleCanvas />

      {/* Floating Badges */}
      <div className="hidden lg:block absolute left-12 top-24 z-10 p-4 bg-[#111827]/90 backdrop-blur-xl rounded-3xl border border-sky-900/40 shadow-card animate-float">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center font-bold border border-sky-800/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">99.8% Claims Approved</p>
            <p className="text-[10px] text-slate-400">Automatic Rule & Error Check</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute right-12 bottom-24 z-10 p-4 bg-[#111827]/90 backdrop-blur-xl rounded-3xl border border-sky-900/40 shadow-card animate-float" style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center font-bold border border-indigo-800/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Protected & Encrypted</p>
            <p className="text-[10px] text-slate-400">HIPAA Safe Data Storage</p>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#111827]/90 backdrop-blur-2xl rounded-4xl p-8 shadow-2xl border border-sky-900/50">
        {/* Brand with Generated Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-16 h-16 rounded-3xl overflow-hidden shadow-xl shadow-sky-500/25 mb-3 border border-sky-500/40 bg-[#090D16] flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="MediFlow AI"
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
            Clinical Billing & Doctor License Center
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 text-red-300 text-xs font-semibold border border-red-900/60">
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
                placeholder="admin@mediflowai.health"
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
                Automatically opens your dashboard next time without typing passwords repeatedly.
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
            <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick One-Click Demo Role Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Instant One-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Super Admin', role: 'super_admin' },
              { label: 'Billing Manager', role: 'billing_manager' },
              { label: 'Medical Biller', role: 'medical_biller' },
              { label: 'License Specialist', role: 'credentialing_specialist' },
              { label: 'Payment Collector', role: 'ar_specialist' },
              { label: 'View Only', role: 'viewer' },
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => handleQuickDemoRole(r.role)}
                className="px-2.5 py-2 bg-[#0D1322] hover:bg-sky-950/60 text-slate-300 hover:text-sky-400 text-[11px] font-semibold rounded-xl border border-slate-800 hover:border-sky-700/60 transition-all truncate"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-sky-400 font-bold hover:underline">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
