import React from 'react';
import { Satellite, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Header({ backendHealth, onRefreshHealth }) {
  const isOnline = backendHealth?.status === 'online';

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-900 p-0.5 shadow-md shadow-primary-900/20 flex items-center justify-center">
            <Satellite className="h-5 w-5 text-accent-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary-900 tracking-tight">GeoResolve AI</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent-50 text-accent-700 border border-accent-200 rounded-full">
                4× Super-Resolution
              </span>
            </div>
            <p className="text-xs text-slate-500">Sentinel-2 (10 m) → High-Resolution (2.5 m) + 9 Domain Analytics</p>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Cpu className="h-3.5 w-3.5 text-accent-600" />
            <span>Engine:</span>
            <span className="text-slate-900 font-semibold">
              {backendHealth?.default_execution_mode ? backendHealth.default_execution_mode.split(' ')[0] : 'Hybrid SR'}
            </span>
          </div>

          <div
            onClick={onRefreshHealth}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${isOnline
              ? 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100 shadow-sm'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-sm'
              }`}
            title="Click to refresh connection"
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
                </span>
                <span className="font-medium">Backend Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-medium">Backend Offline (Port 8000)</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
