import React, { useState, useEffect } from 'react';
import {
  X,
  Minimize2,
  Download,
  Share2,
  CheckCircle2,
  LayoutDashboard,
  SlidersHorizontal,
  BarChart3,
  ShieldAlert,
  FolderDown,
  Info,
  Eye,
  Check,
  Sprout,
  Building2,
  Table,
  Layers,
  Activity,
  MapPin,
  Cpu,
  Split,
  AlertTriangle,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import CompareTab from './CompareTab';
import AnalyticsTab from './AnalyticsTab';
import DisasterTab from './DisasterTab';
import OutputsTab from './OutputsTab';
import DetailsTab from './DetailsTab';

// Definition of the 8 Main Domain Options (Left Panel)
const MAIN_OPTIONS = [
  {
    id: 'compare',
    label: 'Compare',
    icon: SlidersHorizontal,
    tag: '4× Super-Res',
    tagColor: 'bg-blue-50 text-[#2563EB] border-blue-200'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: LayoutDashboard,
    tag: 'Executive Overview',
    tagColor: 'bg-slate-100 text-[#12355B] border-slate-200'
  },
  {
    id: 'crop',
    label: 'Crop Monitoring',
    icon: Sprout,
    tag: 'Calibrated NDVI',
    tagColor: 'bg-emerald-50 text-[#16A34A] border-emerald-200'
  },
  {
    id: 'urban',
    label: 'Urban & Roads',
    icon: Building2,
    tag: 'AI Infrastructure',
    tagColor: 'bg-indigo-50 text-[#6366F1] border-indigo-200'
  },
  {
    id: 'disaster',
    label: 'Disaster Assessment',
    icon: ShieldAlert,
    tag: 'Damage Extents',
    tagColor: 'bg-amber-50 text-[#D97706] border-amber-200'
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: Table,
    tag: '26 Benchmarks',
    tagColor: 'bg-blue-50 text-[#2563EB] border-blue-200'
  },
  {
    id: 'outputs',
    label: 'Outputs & GIS',
    icon: FolderDown,
    tag: 'GeoTIFF / PNG',
    tagColor: 'bg-cyan-50 text-[#0F9D9A] border-cyan-200'
  },
  {
    id: 'details',
    label: 'Details & Pipeline',
    icon: Info,
    tag: 'Scene & Specs',
    tagColor: 'bg-slate-100 text-[#475569] border-slate-200'
  }
];

// Definition of Types & Models for each Main Option (Top Sub-Nav Ribbon)
const SUB_OPTIONS_MAP = {
  compare: [
    { id: 'slider', label: 'Split Slider', icon: SlidersHorizontal },
    { id: 'sidebyside', label: 'Side-by-Side (3 Baseline)', icon: Split },
    { id: 'difference', label: 'Difference Heatmap', icon: Layers }
  ],
  analysis: [
    { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
    { id: 'previews', label: 'All Output Previews', icon: Eye },
    { id: 'quick_metrics', label: 'Quick CV Benchmarks', icon: BarChart3 }
  ],
  crop: [
    { id: 'comparison', label: 'RFMSR + NDVI', icon: Sprout },
    { id: 'ndvi', label: 'NDVI Spectral Map', icon: Layers },
    { id: 'health', label: 'Crop Condition & Yield', icon: Activity }
  ],
  urban: [
    { id: 'overview', label: 'Overview (3-Panel)', icon: Building2 },
    { id: 'audit', label: 'Compliance Audit', icon: CheckCircle2 },
    { id: 'roads', label: 'Road Network', icon: Layers },
    { id: 'violations', label: 'Violations Inspector', icon: AlertTriangle }
  ],
  disaster: [
    { id: 'assessment', label: 'Assessment Overview', icon: ShieldAlert },
    { id: 'before', label: 'Pre vs Post Event', icon: Split },
    { id: 'change', label: 'Change Detection Heatmap', icon: Layers },
    { id: 'areas', label: 'Affected Areas & Logistics', icon: MapPin }
  ],
  metrics: [
    { id: 'all', label: 'All 26 CV Metrics', icon: Table },
    { id: 'resolution', label: 'Resolution Gain (Spatial)', icon: Activity },
    { id: 'spectral', label: 'Spectral Fidelity (Remote Sensing)', icon: Layers }
  ],
  outputs: [
    { id: 'all', label: 'All Assets & Rasters', icon: FolderDown },
    { id: 'geotiff', label: 'GIS GeoTIFF Rasters', icon: Download }
  ],
  details: [
    { id: 'scene', label: 'Scene Metadata', icon: Info },
    { id: 'pipeline', label: 'Model & Hardware Specs', icon: Cpu }
  ]
};

export default function ResultsWorkspace({
  results,
  isOpen,
  onClose,
  onMinimize,
  activeCategory = 'compare',
  activeSubOption = null,
  onCategoryChange,
  onSubOptionChange,
  onFlyToCoords
}) {
  // Main Category state (Left Panel selection)
  const [selectedCategory, setSelectedCategory] = useState(
    activeCategory === 'overview' ? 'analysis' : (activeCategory || 'compare')
  );

  // Sub-option state (Top Ribbon selection)
  const [selectedSubOption, setSelectedSubOption] = useState(() => {
    if (activeSubOption) return activeSubOption;
    const cat = activeCategory === 'overview' ? 'analysis' : (activeCategory || 'compare');
    return SUB_OPTIONS_MAP[cat]?.[0]?.id || 'slider';
  });

  const [isPeekingMap, setIsPeekingMap] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { src, title }

  // Sync external activeCategory if provided
  useEffect(() => {
    if (activeCategory) {
      const normalizedCat = activeCategory === 'overview' ? 'analysis' : activeCategory;
      setSelectedCategory(normalizedCat);
      const defaultSub = SUB_OPTIONS_MAP[normalizedCat]?.[0]?.id || 'slider';
      setSelectedSubOption(activeSubOption || defaultSub);
    }
  }, [activeCategory, activeSubOption]);

  if (!isOpen || !results) return null;

  const { scene_info, downloads, engine, crop_monitoring, urban_analysis } = results;

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    const defaultSub = SUB_OPTIONS_MAP[catId]?.[0]?.id || '';
    setSelectedSubOption(defaultSub);
    if (onCategoryChange) onCategoryChange(catId);
    if (onSubOptionChange) onSubOptionChange(defaultSub);
  };

  const handleSelectSubOption = (subId) => {
    setSelectedSubOption(subId);
    if (onSubOptionChange) onSubOptionChange(subId);
  };

  const handleOpenLightbox = (src, title) => {
    setLightbox({ src, title });
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
  };

  const handleShare = () => {
    const shareText = `Antardrishtii Satellite Analysis: Scene ${scene_info?.id || 'Sentinel-2 L2A'} - 4× Super-Resolution Reconstitution (2.5 m GSD)`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Current sub-options list for the active category
  const currentSubOptions = SUB_OPTIONS_MAP[selectedCategory] || [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-150 ${isPeekingMap ? 'opacity-15 pointer-events-none' : 'bg-slate-900/40 backdrop-blur-[2px]'
        }`}
    >
      <div className="relative w-full max-w-[96vw] xl:max-w-[1520px] h-[92vh] bg-white rounded-2xl border border-[#E2E8F0] shadow-modal flex flex-col overflow-hidden pointer-events-auto">
        {/* ================================================================= */}
        {/* 1. TOP HEADER: BRAND + ANALYSIS COMPLETE STATUS + ACTIONS         */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between bg-white shrink-0 gap-3">
          {/* Left: Brand Identity with official Antardrishtii Logo */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-white border border-[#CBD5E1] p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Antardrishtii Logo" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-[#12355B] tracking-tight leading-tight">
                  Antardrishtii
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Satellite Intelligence
                </span>
              </div>
              <p className="text-[11px] text-[#475569] font-medium leading-none mt-0.5">
                Satellite Intelligence for a Safer Tomorrow
              </p>
            </div>
          </div>

          {/* Center: Analysis Complete Status Pill (Image 1 Header) */}
          <div className="flex items-center gap-2.5 px-3 py-1 bg-[#F8FAFC] rounded-full border border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Analysis Complete</span>
            </div>
            <span className="text-[#94A3B8]">•</span>
            <span className="text-xs text-[#475569] font-mono">
              {scene_info?.date || '2024-04-29'} | Sentinel-2 L2A
            </span>
            <span className="hidden md:inline text-[#94A3B8]">•</span>
            <span className="hidden md:inline text-xs font-mono font-bold text-[#12355B]">
              10 m → 2.50 m (4×)
            </span>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Peek Map Button */}
            <button
              onMouseDown={() => setIsPeekingMap(true)}
              onMouseUp={() => setIsPeekingMap(false)}
              onMouseLeave={() => setIsPeekingMap(false)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#475569] hover:text-[#12355B] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium transition-colors select-none"
              title="Press and hold to peek at map underneath"
            >
              <Eye className="h-3.5 w-3.5 text-[#0F9D9A]" />
              <span className="hidden sm:inline">Peek Map</span>
            </button>

            {/* Download Primary 2.5m Image */}
            {downloads?.sr_image && (
              <a
                href={downloads.sr_image}
                download="mosaic_sr_2p5m.png"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#12355B] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-semibold transition-all shadow-2xs"
                title="Download 2.5 m Super-Resolved Tile"
              >
                <Download className="h-3.5 w-3.5 text-[#2563EB]" />
                <span className="hidden sm:inline">Download All</span>
              </a>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#12355B] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium transition-colors shadow-2xs"
              title="Share or copy analysis metadata"
            >
              {copiedShare ? (
                <Check className="h-3.5 w-3.5 text-[#16A34A]" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-[#475569]" />
              )}
              <span className="hidden sm:inline">{copiedShare ? 'Copied' : 'Share'}</span>
            </button>

            {/* Minimize button */}
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-xl text-[#475569] hover:text-[#12355B] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-colors"
              title="Minimize workspace to floating HUD"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#DC2626] hover:bg-rose-50 border border-[#E2E8F0] transition-colors"
              title="Close Results Panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. TWO-PANEL SPLIT BODY (LEFT PANEL + CENTRAL/RIGHT PANEL)        */}
        {/* ================================================================= */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* --------------------------------------------------------------- */}
          {/* 2A. LEFT PANEL: MAIN DOMAIN OPTIONS (Referral Sketches 1 & 2)   */}
          {/* --------------------------------------------------------------- */}
          <aside className="w-64 sm:w-72 bg-[#F1F5F9] border-r border-[#CBD5E1] flex flex-col justify-between p-3.5 shrink-0 overflow-y-auto">
            <div className="space-y-3">
              {/* Category Section Label */}
              <div className="px-2 pt-0.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#12355B] tracking-wider uppercase">
                  Analysis Modules
                </span>
                <span className="text-[10px] font-mono text-[#64748B] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#CBD5E1]">
                  8 Domains
                </span>
              </div>

              {/* Main Options Vertical Stack */}
              <nav className="space-y-1.5">
                {MAIN_OPTIONS.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = selectedCategory === item.id;

                  // Dynamic contextual badge for domain stats
                  let extraBadge = null;
                  if (item.id === 'crop' && crop_monitoring?.vegetation_coverage_percent) {
                    extraBadge = `${crop_monitoring.vegetation_coverage_percent}%`;
                  } else if (item.id === 'urban' && urban_analysis?.total_detected_buildings) {
                    extraBadge = `${urban_analysis.total_detected_buildings} bldgs`;
                  } else if (item.id === 'metrics') {
                    extraBadge = '26 CV';
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCategory(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${isSelected
                          ? 'bg-[#12355B] text-white shadow-md font-semibold border border-[#0F1E36]'
                          : 'bg-white text-[#334155] border border-[#CBD5E1] hover:border-[#94A3B8] hover:bg-white shadow-2xs'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 transition-colors ${isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#12355B] group-hover:border-[#CBD5E1]'
                            }`}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate font-medium">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-[#64748B]'
                              }`}
                          >
                            {item.tag}
                          </div>
                        </div>
                      </div>

                      {extraBadge ? (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ml-1 font-semibold ${isSelected
                              ? 'bg-white/25 text-white'
                              : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            }`}
                        >
                          {extraBadge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isSelected ? 'text-white translate-x-0.5' : 'text-slate-400'
                            }`}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom: Compact Engine & Telemetry Card */}
            <div className="pt-3 border-t border-[#CBD5E1] mt-3">
              <div className="p-3 rounded-xl bg-white border border-[#CBD5E1] text-[11px] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#12355B]">
                    <Cpu className="h-3 w-3 text-[#2563EB]" /> AI Engine
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    RFMSR (4×)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#475569] text-[10px]">
                  <span>Resolution Gain</span>
                  <span className="font-mono font-bold text-[#0F172A]">10 m → 2.50 m</span>
                </div>
                <div className="flex items-center justify-between text-[#475569] text-[10px]">
                  <span>Scene ID</span>
                  <span className="font-mono text-[#0F172A] truncate max-w-[110px]" title={scene_info?.id}>
                    {scene_info?.id ? scene_info.id.split('_').slice(0, 3).join('_') : 'Sentinel-2 L2A'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* --------------------------------------------------------------- */}
          {/* 2B. RIGHT / CENTRAL PANEL: TYPES/MODELS BAR + MAIN CANVAS       */}
          {/* --------------------------------------------------------------- */}
          <main className="flex-1 min-w-0 flex flex-col h-full bg-[#EEF2F6] overflow-hidden">
            {/* Top Sub-Navigation Ribbon (Types and Models for selected Main Option) */}
            <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
              {/* Left: Sub-options / types pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                <div className="flex bg-[#E2E8F0] p-1 rounded-xl text-xs gap-1 border border-[#CBD5E1]">
                  {currentSubOptions.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubSelected = selectedSubOption === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSubOption(sub.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${isSubSelected
                            ? 'bg-white text-[#2563EB] font-bold shadow-xs border border-[#CBD5E1]'
                            : 'text-[#475569] hover:text-[#12355B]'
                          }`}
                      >
                        <SubIcon
                          className={`h-3.5 w-3.5 ${isSubSelected ? 'text-[#2563EB]' : 'text-[#475569]'
                            }`}
                        />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Active Contextual Meta Tag */}
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#475569]">
                <span className="text-[#64748B] font-semibold">Active View:</span>
                <span className="font-bold text-[#12355B] px-2 py-0.5 rounded-md bg-white border border-[#CBD5E1] shadow-2xs">
                  {currentSubOptions.find((s) => s.id === selectedSubOption)?.label || selectedCategory}
                </span>
              </div>
            </div>

            {/* Main Scrollable Canvas */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#EEF2F6]">
              {/* DOMAIN 1: COMPARE */}
              {selectedCategory === 'compare' && (
                <CompareTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  subOption={selectedSubOption}
                  onSubOptionChange={handleSelectSubOption}
                />
              )}

              {/* DOMAIN 2: ANALYSIS / OVERVIEW */}
              {selectedCategory === 'analysis' && (
                <OverviewTab
                  results={results}
                  onNavigateTab={(tab) => {
                    handleSelectCategory(tab === 'overview' ? 'analysis' : tab);
                  }}
                  onOpenLightbox={handleOpenLightbox}
                />
              )}

              {/* DOMAIN 3: CROP MONITORING */}
              {selectedCategory === 'crop' && (
                <AnalyticsTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  defaultSubTab="crop"
                  activeSubTab="crop"
                  activeSubOption={selectedSubOption}
                  onNavigateTab={(tab) => {
                    handleSelectCategory(tab === 'overview' ? 'analysis' : tab);
                  }}
                  onFlyToCoords={onFlyToCoords}
                />
              )}

              {/* DOMAIN 4: URBAN ANALYSIS */}
              {selectedCategory === 'urban' && (
                <AnalyticsTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  defaultSubTab="urban"
                  activeSubTab="urban"
                  activeSubOption={selectedSubOption}
                  onNavigateTab={(tab) => {
                    handleSelectCategory(tab === 'overview' ? 'analysis' : tab);
                  }}
                  onFlyToCoords={onFlyToCoords}
                />
              )}

              {/* DOMAIN 5: DISASTER ASSESSMENT */}
              {selectedCategory === 'disaster' && (
                <DisasterTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  subOption={selectedSubOption}
                  onSubOptionChange={handleSelectSubOption}
                />
              )}

              {/* DOMAIN 6: METRICS TABLE */}
              {selectedCategory === 'metrics' && (
                <AnalyticsTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  defaultSubTab="metrics"
                  activeSubTab="metrics"
                  activeSubOption={selectedSubOption}
                  onNavigateTab={(tab) => {
                    handleSelectCategory(tab === 'overview' ? 'analysis' : tab);
                  }}
                  onFlyToCoords={onFlyToCoords}
                />
              )}

              {/* DOMAIN 7: OUTPUTS & GIS */}
              {selectedCategory === 'outputs' && (
                <OutputsTab
                  results={results}
                  onOpenLightbox={handleOpenLightbox}
                  subOption={selectedSubOption}
                />
              )}

              {/* DOMAIN 8: DETAILS & SPECS */}
              {selectedCategory === 'details' && (
                <DetailsTab results={results} subOption={selectedSubOption} />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Universal High-Resolution Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={handleCloseLightbox}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-modal flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2">
              <span className="text-xs font-bold text-[#12355B] truncate pr-4">
                {lightbox.title}
              </span>
              <button
                onClick={handleCloseLightbox}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-slate-900 rounded-xl p-1">
              <img
                src={lightbox.src}
                alt={lightbox.title}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
