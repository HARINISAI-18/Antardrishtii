import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`glass-panel p-4 rounded-2xl border shadow-xl flex items-start gap-3 bg-white/95 backdrop-blur-md ${isError
          ? 'border-rose-200 text-rose-900 shadow-rose-500/5'
          : isSuccess
            ? 'border-accent-200 text-slate-800 shadow-accent-500/10'
            : 'border-slate-200 text-slate-800 shadow-slate-400/10'
          }`}
      >
        <div className="mt-0.5 shrink-0">
          {isError ? (
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-accent-600" />
          ) : (
            <Info className="h-5 w-5 text-primary-700" />
          )}
        </div>

        <div className="flex-1 text-xs">
          <div className="font-bold text-slate-900 mb-0.5">
            {isError ? 'Processing Error' : isSuccess ? 'Pipeline Completed' : 'System Notice'}
          </div>
          <p className="leading-relaxed text-slate-600">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
