import React from 'react';
import { Calendar, Cloud, Eye, Maximize, Cpu, Database } from 'lucide-react';

export default function SceneOverview({ sceneInfo, engine }) {
  if (!sceneInfo) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
      {/* Card 1: Resolution */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Maximize className="h-3.5 w-3.5" />
          <span>Resolution</span>
        </div>
        <div className="text-sm font-semibold text-slate-900 font-mono">10 m → 2.5 m</div>
        <div className="text-[10px] text-slate-500 mt-0.5">4× Magnification (16× area)</div>
      </div>

      {/* Card 2: Date */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>Acquisition Date</span>
        </div>
        <div className="text-sm font-semibold text-slate-900 font-mono">{sceneInfo.date || '2024'}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Sentinel-2 Orbit</div>
      </div>

      {/* Card 3: Cloud Cover */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Cloud className="h-3.5 w-3.5" />
          <span>Cloud Cover</span>
        </div>
        <div className="text-sm font-semibold text-slate-900 font-mono">{sceneInfo.cloud_cover_pct?.toFixed(1) || '0'}%</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Scene Metadata Filter</div>
      </div>

      {/* Card 4: Usable Pixels */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Eye className="h-3.5 w-3.5" />
          <span>Usable AOI</span>
        </div>
        <div className="text-sm font-semibold text-slate-900 font-mono">{sceneInfo.usable_pct || '100'}%</div>
        <div className="text-[10px] text-slate-500 mt-0.5">SCL Quality Layer</div>
      </div>

      {/* Card 5: Scene ID */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Database className="h-3.5 w-3.5" />
          <span>Scene Product</span>
        </div>
        <div className="text-xs font-semibold text-slate-900 truncate font-mono" title={sceneInfo.id}>
          {sceneInfo.id ? sceneInfo.id.split('_').slice(0, 3).join('_') : 'S2A_L2A'}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Planetary Computer</div>
      </div>

      {/* Card 6: Engine */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
          <Cpu className="h-3.5 w-3.5" />
          <span>Pipeline Engine</span>
        </div>
        <div className="text-xs font-semibold text-slate-900 truncate font-mono">
          {engine?.name ? engine.name.split(' ')[0] : '4× SR Engine'}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{engine?.output_pixels || '2048x2048'}</div>
      </div>
    </div>
  );
}
