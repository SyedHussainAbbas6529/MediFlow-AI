'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone;
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      const dismissed = localStorage.getItem('mediflow_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    // Chrome / Edge / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('mediflow_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('mediflow_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-white dark:bg-[#131B2E] border border-indigo-200 dark:border-indigo-900/60 rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/30">
            MF
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install MediFlow AI</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Install as native desktop or mobile app</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {isIOS ? (
          <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              Tap <Share className="w-3.5 h-3.5 text-indigo-600" /> Share in Safari, then tap
            </p>
            <p className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
              <PlusSquare className="w-3.5 h-3.5" /> &quot;Add to Home Screen&quot;
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </div>
  );
}
