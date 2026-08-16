'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  X,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
  recipientType?: 'patient' | 'provider' | 'payer' | 'staff';
  defaultSubject?: string;
  defaultBody?: string;
  onSuccess?: () => void;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultName = '',
  recipientType = 'patient',
  defaultSubject = '',
  defaultBody = '',
  onSuccess
}: SendEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [subject, setSubject] = useState(defaultSubject || 'Billing & Account Notice from Apex Medical');
  const [body, setBody] = useState(
    defaultBody ||
    `Hello ${defaultName || 'Valued Patient'},\n\nThis is an automated reminder regarding your medical account and billing statement. Please review your balance or contact our office if you have any questions.\n\nThank you,\nBilling & Care Team\nMediFlow AI / Apex Medical`
  );
  const [template, setTemplate] = useState('statement');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize defaults when modal opens
  React.useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
    if (defaultName) setName(defaultName);
    if (defaultSubject) setSubject(defaultSubject);
    if (defaultBody) setBody(defaultBody);
  }, [defaultEmail, defaultName, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleTemplateChange = (t: string) => {
    setTemplate(t);
    if (t === 'statement') {
      setSubject(`Billing Statement Reminder for ${name || 'Patient'}`);
      setBody(
        `Dear ${name || 'Patient'},\n\nWe would like to remind you of an outstanding balance on your account. Please log in to your patient portal or call our billing desk to arrange payment.\n\nSincerely,\nAccounts Receivable Team\nApex Medical Practice`
      );
    } else if (t === 'license') {
      setSubject(`URGENT: State Medical License Expiration Notice for Dr. ${name || 'Provider'}`);
      setBody(
        `Dear Dr. ${name || 'Provider'},\n\nThis is an automated compliance alert from MediFlow AI. Your credentialing records indicate that your State Medical License is approaching its expiration date. Please upload your renewed license to avoid insurance billing disruptions.\n\nBest regards,\nProvider Credentialing Department`
      );
    } else if (t === 'claim') {
      setSubject(`Insurance Claim Status Update for ${name || 'Patient'}`);
      setBody(
        `Hello ${name || 'Patient'},\n\nYour recent healthcare insurance claim has been processed and submitted. You may review your explanation of benefits (EOB) through your patient portal.\n\nBest regards,\nClaims & Billing Office`
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMsg(null);
    try {
      const res = await api.sendEmailReminder({
        recipient_email: email,
        recipient_name: name || 'Recipient',
        recipient_type: recipientType,
        subject,
        message_body: body,
        template_type: template,
      });

      setStatusMsg({ type: 'success', text: `Email reminder sent to ${email}!` });
      setTimeout(() => {
        setIsSending(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1400);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to dispatch email' });
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 text-slate-100">
      <div className="w-full max-w-xl bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-950/80 text-sky-400 flex items-center justify-center border border-sky-800/40">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send Email & Reminder</h3>
              <p className="text-xs text-slate-400">Direct patient & doctor communications with audit logging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-red-950/60 text-red-300 border-red-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Quick Template Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick AI Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'statement', label: 'Payment / Statement Due' },
                { id: 'license', label: 'Doctor License Expiration' },
                { id: 'claim', label: 'Claim Status Update' },
              ].map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    template === tpl.id
                      ? 'bg-sky-950 text-sky-300 border-sky-600 font-bold'
                      : 'bg-[#0D1322] text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. patient@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Message Body
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-700 bg-[#0D1322] text-white font-sans leading-relaxed outline-hidden focus:ring-2 focus:ring-sky-500/30"
              required
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              🔒 HIPAA safe communication with audit logging
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send Reminder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
