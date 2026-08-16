'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  AlertTriangle,
  Clock,
  BookOpen,
  Sparkles,
  BarChart3,
  Settings,
  Stethoscope,
  ShieldCheck,
  X,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Claims & Billing', href: '/billing', icon: FileText },
  { name: 'Denied Claims', href: '/denials', icon: AlertTriangle },
  { name: 'Unpaid Bills (A/R)', href: '/ar', icon: Clock },
  { name: 'Doctor Licenses', href: '/credentialing', icon: UserCheck },
  { name: 'Doctors', href: '/providers', icon: Stethoscope },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Insurance Rules', href: '/documents', icon: BookOpen },
  { name: 'AI Assistant', href: '/assistant', icon: Sparkles, badge: 'Smart' },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0D1322] border-r border-slate-800/80 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-sky-500/20 border border-sky-500/30 flex items-center justify-center bg-[#090D16] shrink-0">
                <Image
                  src="/logo.png"
                  alt="MediFlow AI Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  <span>MediFlow</span>
                  <span className="text-sky-400 font-black">AI</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Medical Billing Platform
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-sky-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Security Badge & Log Out */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="p-3 rounded-2xl bg-[#111827] border border-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold text-white truncate">
                System Online & Protected
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">
                HIPAA Safe • AES-256
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white hover:bg-red-950/50 border border-transparent hover:border-red-900/60 transition-all group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
