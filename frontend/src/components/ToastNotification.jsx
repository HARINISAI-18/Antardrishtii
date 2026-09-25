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
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in duration-200">
      <div
        className={`p-3.5 rounded-lg border shadow-lg flex items-start gap-3 bg-white ${
          isError
            ? 'border-rose-300 text-rose-900'
            : isSuccess
            ? 'border-emerald-300 text-slate-800'
            : 'border-slate-300 text-slate-800'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isError ? (
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Info className="h-4 w-4 text-slate-700" />
          )}
        </div>

        <div className="flex-1 text-xs">
          <div className="font-semibold text-slate-900 mb-0.5">
            {isError ? 'Processing Alert' : isSuccess ? 'Operation Complete' : 'System Notice'}
          </div>
          <p className="leading-relaxed text-slate-600">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
