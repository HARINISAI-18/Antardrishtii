import React from 'react';
import { Compass, FileText, Info, AlertCircle } from 'lucide-react';

export default function Header({ backendHealth, onRefreshHealth, activeNav = 'explore', onNavSelect }) {
  const isOnline = backendHealth?.status === 'online';

  return (
    <header className="border-b border-[#CBD5E1] bg-white sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 shadow-subtle select-none">
      {/* 1. Left: Antardrishtii Branding */}
      <div
        onClick={() => onNavSelect && onNavSelect('explore')}
        className="flex items-center gap-3 cursor-pointer group"
        title="Antardrishtii Home"
      >
        {/* Antardrishtii Visual Identity Logo */}
        <div className="h-11 w-11 rounded-xl bg-white border border-[#CBD5E1] p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden group-hover:border-[#2563EB] transition-colors">
          <img src="/logo.png" alt="Antardrishtii Logo" className="w-full h-full object-contain" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-[#12355B] tracking-tight leading-tight group-hover:text-[#2563EB] transition-colors">
              Antardrishtii
            </span>
          </div>
          <p className="text-[11px] text-[#475569] font-medium leading-none mt-0.5 hidden sm:block">
            Satellite Intelligence for a Safer Tomorrow
          </p>
        </div>
      </div>

      {/* 2. Center: Global Navigation System */}
      <nav className="flex items-center gap-1 bg-[#F7FAFC] p-1 rounded-xl border border-[#CBD5E1]">
        <button
          onClick={() => onNavSelect && onNavSelect('explore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeNav === 'explore'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#12355B] hover:bg-white'
            }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Explore & Analyze</span>
        </button>

        <button
          onClick={() => onNavSelect && onNavSelect('docs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeNav === 'docs'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#12355B] hover:bg-white'
            }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Documentation</span>
        </button>

        <button
          onClick={() => onNavSelect && onNavSelect('about')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeNav === 'about'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#12355B] hover:bg-white'
            }`}
        >
          <Info className="h-3.5 w-3.5" />
          <span>About Us</span>
        </button>
      </nav>

      {/* 3. Right: System Status & Utility Controls */}
      <div className="flex items-center gap-2.5">
        {/* Backend Online Status Pill */}
        <div
          onClick={onRefreshHealth}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border cursor-pointer transition-all shadow-2xs ${isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          title="Click to refresh backend API connection"
        >
          <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
          <span className="font-semibold text-[11px] whitespace-nowrap">
            {isOnline ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
