'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Link2,
  FileText,
  Save,
  Building,
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Mail,
  Phone,
  MapPin,
  Lock,
  LogOut,
  UserCheck,
  Shield
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'profile' | 'rbac' | 'integrations' | 'billing' | 'audit'>('profile');
  
  // Organization state
  const [org, setOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgTaxId, setOrgTaxId] = useState('');

  // Staff & Roles state
  const [staff, setStaff] = useState<any[]>([]);
  const [rolesData, setRolesData] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('medical_biller');

  // Integrations & Subscription state
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = () => {
    api.getOrgProfile().then((data) => {
      setOrg(data);
      setOrgName(data.name || '');
      setOrgEmail(data.email || '');
      setOrgPhone(data.phone || '');
      setOrgAddress(data.address || '');
      setOrgTaxId(data.tax_id || '');
    }).catch(console.error);

    api.getStaffMembers().then(setStaff).catch(console.error);

    api.getRolesMatrix().then((d) => {
      setRolesData(d);
      if (d.roles?.length > 0 && !selectedRoleId) {
        setSelectedRoleId(d.roles[0].id);
        setRolePerms(d.roles[0].permission_ids || []);
      }
    }).catch(console.error);

    api.getIntegrations().then(setIntegrations).catch(console.error);
    api.getSubscription().then(setSubscription).catch(console.error);
    api.getAuditLogs().then(setAuditLogs).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateOrgProfile({
        name: orgName,
        email: orgEmail,
        phone: orgPhone,
        address: orgAddress,
        tax_id: orgTaxId,
      });
      setSaveStatus('Practice profile saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = rolesData?.roles?.find((r: any) => r.id === roleId);
    setRolePerms(role?.permission_ids || []);
  };

  const handleTogglePermission = (permId: string) => {
    setRolePerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      await api.updateRolePermissions(selectedRoleId, rolePerms);
      setSaveStatus('Role permissions updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createStaffMember({
        full_name: inviteName,
        email: inviteEmail,
        role_slug: inviteRole,
      });
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setSaveStatus('Staff member invited successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleIntegration = async (pkey: string) => {
    await api.toggleIntegration(pkey);
    api.getIntegrations().then(setIntegrations).catch(console.error);
  };

  const handleUpgradePlan = async (tier: string) => {
    await api.updateSubscriptionTier(tier);
    setSaveStatus(`Plan upgraded to ${tier} successfully!`);
    setTimeout(() => setSaveStatus(null), 3000);
    api.getSubscription().then(setSubscription).catch(console.error);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header with Logout Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Settings & Practice Controls
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage practice profile, user account, staff roles & permissions, EHR gateways, and HIPAA logs.
          </p>
        </div>

        {/* Prominent User Logout Button in Settings Header */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-2xl text-xs font-bold transition-all shadow-md shadow-red-950/50 active:scale-95 shrink-0 self-start sm:self-auto group"
        >
          <LogOut className="w-4 h-4 text-red-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Log Out of Account</span>
        </button>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 text-emerald-300 text-xs font-semibold border border-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>✨ {saveStatus}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { id: 'profile', label: 'Practice & Account Profile', icon: Building },
          { id: 'rbac', label: 'Staff & Roles (RBAC)', icon: ShieldCheck },
          { id: 'integrations', label: 'EHR & Clearinghouses', icon: Link2 },
          { id: 'billing', label: 'Plan & Usage Limits', icon: CreditCard },
          { id: 'audit', label: 'HIPAA Security Log', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Practice & User Account Profile */}
      {tab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          {/* Current User Session & Logout Card */}
          <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-sky-500/20 shrink-0">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {user?.full_name || 'Dr. Alexander Vance'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 uppercase">
                    {user?.role?.replace('_', ' ') || 'Super Admin'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'admin@mediflowai.health'}</p>
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">● Session Active & Verified</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Sign Out / End Session</span>
            </button>
          </div>

          {/* Practice Information Form */}
          <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-sky-400" />
                  <span>Practice & Organization Information</span>
                </h3>
                <p className="text-xs text-slate-400">Clinical practice details used on claims, EOBs, and patient letters.</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                ✓ BAA Active
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Practice Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Apex Medical Practice"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Support & Billing Email</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="ops@apexmedical.health"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Phone</label>
                  <input
                    type="tel"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="+1 (800) 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tax ID / EIN</label>
                  <input
                    type="text"
                    value={orgTaxId}
                    onChange={(e) => setOrgTaxId(e.target.value)}
                    placeholder="XX-XXXX8921"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Clinic Physical Address</label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="450 Medical Center Blvd, Suite 800, Austin, TX 78701"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                />
              </div>

              <div className="p-4 bg-[#0D1322] border border-sky-900/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-sky-400" />
                  <div>
                    <p className="text-xs font-bold text-white">HIPAA Compliance & BAA Contract</p>
                    <p className="text-[11px] text-slate-400">AES-256 encrypted database with continuous audit logging</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold">Encrypted & Verified</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Practice Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Roles & Permissions */}
      {tab === 'rbac' && (
        <div className="space-y-6">
          {/* Staff Members List */}
          <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Staff User Accounts ({staff.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Authorized medical practice employees and billers.</p>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Invite Staff Member</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-[#0D1322]">
                    <th className="py-3 px-3">Staff Name</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Assigned Role</th>
                    <th className="py-3 px-3">Account Status</th>
                    <th className="py-3 px-3 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-[#0D1322]/60">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-800/40">
                          {s.full_name.charAt(0)}
                        </div>
                        <span>{s.full_name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{s.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800/60">
                          {s.role_name || s.role_slug}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-[11px]">{s.last_active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic RBAC Matrix Editor */}
          {rolesData && (
            <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Dynamic Role Permissions Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-400">Configure permission grants per staff role without code deployment.</p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Role Permissions'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Roles list selector */}
                <div className="space-y-1.5 border-r border-slate-800 pr-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Select Role</span>
                  {rolesData.roles?.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r.id)}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all ${
                        selectedRoleId === r.id
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'bg-[#0D1322] text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>

                {/* Granular Permission checkboxes */}
                <div className="md:col-span-3 space-y-4 max-h-[60vh] overflow-y-auto">
                  {Object.entries(rolesData.permissions_by_module || {}).map(([module, perms]: [string, any]) => (
                    <div key={module} className="p-4 rounded-2xl bg-[#0D1322] border border-slate-800">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5">
                        {module} Module Permissions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {perms.map((p: any) => {
                          const checked = rolePerms.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#111827] cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePermission(p.id)}
                                className="mt-0.5 rounded border-slate-700 bg-[#111827] text-sky-500 focus:ring-sky-500"
                              />
                              <div>
                                <p className="font-bold text-white text-xs">{p.name}</p>
                                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Integrations */}
      {tab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((i) => (
            <div key={i.id} className="p-5 rounded-3xl bg-[#111827] border border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{i.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      i.status === 'connected' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Last synced: {i.last_sync || 'Recently'}</p>
              </div>
              <button
                onClick={() => handleToggleIntegration(i.provider_key)}
                className={`mt-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  i.status === 'connected'
                    ? 'border-red-900 bg-red-950/40 text-red-400 hover:bg-red-950'
                    : 'border-sky-700 bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700'
                }`}
              >
                {i.status === 'connected' ? 'Disconnect Gateway' : 'Connect Gateway'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: SaaS Subscription */}
      {tab === 'billing' && subscription && (
        <div className="bg-[#111827] p-6 rounded-3xl border border-slate-800 shadow-card max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Subscription Plan & Practice Limits</span>
              </h3>
              <p className="text-xs text-slate-400">Monthly quota for claim processing, AI appeals, and staff user seats.</p>
            </div>
            <span className="px-3.5 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs rounded-full shadow-xs">
              {subscription.plan_tier} Plan
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-2">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">Monthly Claims Processed:</span>
                <strong className="text-white">{subscription.current_month_claims} / {subscription.max_claims_per_month?.toLocaleString()} claims</strong>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, ((subscription.current_month_claims || 320) / (subscription.max_claims_per_month || 10000)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0D1322] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Authorized Staff User Licenses:</span>
              <strong className="text-white">{subscription.max_users} Active Seats</strong>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Switch Plan Tier</span>
              <div className="grid grid-cols-3 gap-2">
                {['Starter', 'Professional', 'Enterprise'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleUpgradePlan(tier)}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      subscription.plan_tier === tier
                        ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-[#0D1322] text-slate-300 hover:text-white border-slate-800'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: HIPAA & Security Audit Log */}
      {tab === 'audit' && (
        <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>HIPAA Compliance & Action Audit Log</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">Live Real-Time Stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-[#0D1322]">
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target Entity</th>
                  <th className="py-3 px-3">User Email</th>
                  <th className="py-3 px-3">Security Flag</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#0D1322]/60">
                    <td className="py-3 px-3 font-bold text-white">{l.action}</td>
                    <td className="py-3 px-3 text-slate-400">{l.entity_type} ({l.entity_id})</td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{l.user_email}</td>
                    <td className="py-3 px-3">
                      {l.is_phi_accessed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          PHI Logged
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          System Event
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 font-mono truncate max-w-xs">
                      {l.prompt_text || 'Audit record recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Invite Staff Member</span>
            </h3>

            <form onSubmit={handleInviteStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jessica Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Staff Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jessica.m@apexmedical.health"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                >
                  <option value="billing_manager">Billing Manager</option>
                  <option value="medical_biller">Medical Biller</option>
                  <option value="credentialing_specialist">License Specialist</option>
                  <option value="ar_specialist">Payment Collector</option>
                  <option value="provider">Doctor / Provider</option>
                  <option value="viewer">Audit Viewer (View Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20"
                >
                  {isSaving ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
