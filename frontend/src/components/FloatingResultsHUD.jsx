import React from 'react';
import {
  SlidersHorizontal,
  Sprout,
  Building2,
  AlertTriangle,
  Table,
  FolderDown,
  Maximize2,
  PanelRightClose,
  PanelRightOpen,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function FloatingResultsHUD({
  results,
  isOpen,
  viewMode,
  onOpenSection,
  onToggleOpen
}) {
  if (!results) return null;

  const {
    scene_info,
    crop_monitoring,
    urban_analysis,
    metrics_table
  } = results;

  const totalMetrics = metrics_table?.length || 26;
  const meanNdvi = crop_monitoring?.mean_ndvi !== undefined ? crop_monitoring.mean_ndvi : '0.60';
  const totalBldgs = urban_analysis?.total_detected_buildings || 0;
  const totalViolations = urban_analysis?.regulatory_violations || 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-300 shadow-xl flex flex-wrap items-center gap-2 text-xs text-slate-800">
        {/* Status Chip */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 font-mono text-[11px] text-slate-700 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-900 hidden sm:inline">Output Ready:</span>
          <span>10 m → 2.5 m</span>
        </div>

        {/* 1-Click Direct Element Access Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {/* 4x Split Slider */}
          <button
            onClick={() => onOpenSection('super_resolution', 'slider')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 text-blue-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-blue-300"
            title="Inspect 4× Super-Resolution Split Slider"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
            <span>4× SR Slider</span>
          </button>

          {/* Crop NDVI */}
          {crop_monitoring && (
            <button
              onClick={() => onOpenSection('crop', 'crop_ndvi')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-emerald-300"
              title="Inspect Crop NDVI & Vegetation Health Map"
            >
              <Sprout className="h-3.5 w-3.5 text-emerald-600" />
              <span>NDVI: <strong className="font-mono">{meanNdvi}</strong></span>
            </button>
          )}

          {/* Urban Buildings */}
          {urban_analysis && (
            <button
              onClick={() => onOpenSection('urban', 'urban_audit')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200 text-sky-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-sky-300"
              title="Inspect Detected Buildings & Road Network"
            >
              <Building2 className="h-3.5 w-3.5 text-sky-600" />
              <span><strong className="font-mono">{totalBldgs}</strong> Bldgs</span>
            </button>
          )}

          {/* Violations */}
          {urban_analysis && totalViolations > 0 && (
            <button
              onClick={() => onOpenSection('violations', 'violations_all')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-rose-300"
              title="Inspect Waterbody Buffer Violations & GPS Centroids"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span><strong className="font-mono">{totalViolations}</strong> Violations</span>
            </button>
          )}

          {/* 26 Metrics */}
          <button
            onClick={() => onOpenSection('metrics', 'metrics_all')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-indigo-300"
            title="Inspect 26 Quantitative Metrics Table"
          >
            <Table className="h-3.5 w-3.5 text-indigo-600" />
            <span><strong className="font-mono">{totalMetrics}</strong> Metrics</span>
          </button>

          {/* GIS Downloads */}
          <button
            onClick={() => onOpenSection('exports', 'exports_all')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-medium transition-all whitespace-nowrap shadow-2xs hover:border-amber-300"
            title="Open GIS Export Center (GeoTIFF, GeoJSON, CSV)"
          >
            <FolderDown className="h-3.5 w-3.5 text-amber-600" />
            <span>GIS Exports</span>
          </button>
        </div>

        {/* Master Open / Close Workspace Button */}
        <div className="pl-1 sm:pl-2 border-l border-slate-200 flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm text-xs"
            title={isOpen ? 'Hide Results Dashboard' : 'Open Results Dashboard'}
          >
            {isOpen ? (
              <>
                <PanelRightClose className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span>Open Dashboard</span>
                <ArrowRight className="h-3 w-3 text-slate-300" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
