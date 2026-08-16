'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Search,
  Plus,
  Shield,
  ChevronDown,
  Command,
  Menu,
  LogOut,
  FlaskConical,
  Activity,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickCreate: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function Header({
  onOpenQuickCreate,
  onOpenCommandPalette,
  onToggleMobileSidebar
}: HeaderProps) {
  const { user, logout, dataMode, toggleDataMode, switchRole } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const currentRole = user?.role || 'super_admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0D1322] border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 transition-colors w-full">
      {/* Left: Mobile Hamburger & Search Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Open Mobile Menu"
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#111827] border border-slate-800 lg:hidden shrink-0 transition-colors"
        >
          <Menu className="w-5 h-5 text-sky-400" />
        </button>

        {/* Search Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 flex items-center justify-between px-3 py-2 bg-[#111827] hover:bg-slate-800/80 text-slate-400 rounded-2xl text-xs border border-slate-800 transition-all shadow-xs group truncate"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-slate-300 truncate hidden sm:inline">Search claims, patients, rules...</span>
            <span className="text-slate-300 truncate sm:hidden">Search...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-[#0D1322] text-slate-400 rounded-md border border-slate-700">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Interactive Demo / Real Data Mode Toggle Button */}
        <button
          onClick={toggleDataMode}
          title="Click to toggle between Demo Testing Data and Live Clean Practice"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer ${
            dataMode === 'demo'
              ? 'bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border-amber-700/80'
              : 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/80'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dataMode === 'demo' ? 'bg-amber-400' : 'bg-emerald-400'
            } animate-pulse`}
          />
          {dataMode === 'demo' ? (
            <>
              <FlaskConical className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
              <span>Demo Testing</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
              <span>Live Practice</span>
            </>
          )}
        </button>

        {/* Create Button */}
        <button
          onClick={onOpenQuickCreate}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">+ Create New</span>
          <span className="sm:hidden font-bold">New</span>
        </button>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative pl-1 border-l border-slate-800 shrink-0">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden xl:block text-left truncate max-w-[130px]">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {user?.full_name || 'Practice User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{currentRole.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#111827] rounded-2xl shadow-2xl border border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Practice User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@practice.health'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 uppercase">
                    {currentRole.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    dataMode === 'demo' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {dataMode === 'demo' ? 'Demo Mode' : 'Live Mode'}
                  </span>
                </div>
              </div>

              {/* Demo Role Switcher Section */}
              <div className="py-2 border-b border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-sky-400" />
                  <span>Test Different Staff Roles:</span>
                </p>
                <div className="grid grid-cols-2 gap-1 px-1">
                  {[
                    { label: 'Super Admin', role: 'super_admin' },
                    { label: 'Billing Mgr', role: 'billing_manager' },
                    { label: 'Med Biller', role: 'medical_biller' },
                    { label: 'License Spec', role: 'credentialing_specialist' },
                    { label: 'AR Spec', role: 'ar_specialist' },
                    { label: 'Viewer', role: 'viewer' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setIsUserMenuOpen(false);
                      }}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-lg text-left truncate transition-colors ${
                        currentRole === r.role
                          ? 'bg-sky-500 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <a
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span>Practice Settings</span>
                </a>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white hover:bg-red-950/60 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
