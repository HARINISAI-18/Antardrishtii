import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Cloud,
  Loader2,
  Maximize2,
  Zap,
  MapPin
} from 'lucide-react';

export const getPipelineStages = (enableDisaster = false) => {
  const stages = [
    'SR Image Generation',
    'Metrics'
  ];
  if (enableDisaster) {
    stages.push('Disaster Assessment');
  }
  stages.push('Crop Monitoring', 'Urban Analysis');
  return stages;
};

export default function FloatingSidebar({
  formValues,
  onChange,
  onSelectPreset,
  presets,
  backendHealth,
  onRunPipeline,
  isLoading,
  currentStage = 1,
  isCompleted = false,
  hasResults,
  onOpenResults
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stages = getPipelineStages(Boolean(formValues.enable_disaster_assessment));
  const totalStages = stages.length;
  const currentStageName = stages[Math.min(currentStage - 1, totalStages - 1)] || 'Processing...';
  const progressPercent = isCompleted ? 100 : Math.min(95, Math.round(((currentStage - 0.5) / totalStages) * 100));

  return (
    <div
      className={`absolute top-4 left-4 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12' : 'w-80 sm:w-[370px]'
        }`}
    >
      {/* 1. Collapsed Toggle Pill */}
      {isCollapsed ? (
        <div className="rounded-2xl p-2 shadow-[0_4px_20px_rgba(18,53,91,0.12)] flex flex-col items-center gap-3 bg-white/95 backdrop-blur-md border border-[#CBD5E1]">
          <button
            onClick={() => setIsCollapsed(false)}
            className="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors shadow-2xs"
            title="Expand Scene Controls"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-px w-6 bg-[#E2E8F0] my-0.5" />

          <div className="p-1 rounded-lg text-[#12355B]" title="Parameters Active">
            <Sliders className="h-4 w-4 text-[#2563EB]" />
          </div>

          {hasResults && (
            <button
              onClick={onOpenResults}
              className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors shadow-2xs border border-emerald-200"
              title="Open Analysis Workspace"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        /* 2. Expanded Floating Scene Control Card */
        <div className="rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(18,53,91,0.14)] border border-[#CBD5E1] bg-white/95 backdrop-blur-md max-h-[calc(100vh-6.5rem)] overflow-y-auto flex flex-col text-[#12355B]">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-2xs shrink-0">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-[#12355B] tracking-tight leading-none">
                    Scene Configuration
                  </h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] leading-none">
                    4× SR
                  </span>
                </div>
                <p className="text-[11px] text-[#475569] font-medium mt-0.5">
                  Sentinel-2 Multi-Spectral (10m → 2.5m)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#12355B] hover:bg-[#F1F5F9] transition-colors"
              title="Collapse Panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Validated Scenarios / Presets */}
          {presets?.locations && (
            <div className="mt-3">
              <div className="text-[11px] font-bold text-[#475569] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Validated Scenarios
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.locations.map((loc) => {
                  const isSelected =
                    Math.abs(formValues.latitude - loc.lat) < 0.001 &&
                    Math.abs(formValues.longitude - loc.lon) < 0.001;

                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => onSelectPreset(loc)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${isSelected
                          ? 'bg-[#12355B] text-white font-semibold shadow-xs'
                          : 'bg-[#F8FAFC] text-[#475569] hover:bg-white hover:text-[#12355B] border border-[#CBD5E1]'
                        }`}
                    >
                      {loc.name.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Coordinates */}
          <div className="mt-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#2563EB]" />
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formValues.latitude}
                  onChange={onChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#12355B] font-mono font-medium focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#2563EB]" />
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formValues.longitude}
                  onChange={onChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#12355B] font-mono font-medium focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* AOI Dimension Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Area of Interest (AOI Tile Grid)
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[5.12, 10.24, 15.36].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChange({ target: { name: 'aoi_km', value: size } })}
                    className={`py-1.5 rounded-xl border text-center transition-all ${formValues.aoi_km === size
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold shadow-2xs'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:text-[#12355B] hover:bg-white'
                      }`}
                  >
                    {size} km
                  </button>
                ))}
              </div>
            </div>

            {/* Date Window */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#2563EB]" />
                STAC Search Date Range
              </label>
              <input
                type="text"
                name="date_range"
                value={formValues.date_range}
                onChange={onChange}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2.5 py-1.5 text-xs text-[#12355B] font-mono font-medium focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 focus:bg-white transition-all"
                placeholder="YYYY-MM-DD/YYYY-MM-DD"
              />
            </div>

            {/* Cloud slider */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-[#475569] text-[11px] font-semibold flex items-center gap-1">
                <Cloud className="h-3 w-3 text-sky-600" />
                Max Cloud:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  name="max_cloud"
                  value={formValues.max_cloud}
                  onChange={onChange}
                  className="w-24 accent-[#2563EB] cursor-pointer"
                />
                <span className="font-mono text-[#12355B] font-bold text-[11px] w-9 text-right bg-[#F1F5F9] px-1 py-0.5 rounded border border-[#CBD5E1]">
                  {formValues.max_cloud}%
                </span>
              </div>
            </div>

            {/* SR Engine Selector */}
            <div className="pt-0.5">
              <label className="block text-[11px] font-semibold text-[#475569] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  SR Acceleration Engine
                </span>
                <span className="text-[10px] text-[#475569] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1]">
                  {backendHealth?.device || 'CPU'}
                </span>
              </label>
              <select
                name="engine_mode"
                value={formValues.engine_mode || 'auto'}
                onChange={onChange}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-2 py-1.5 text-xs text-[#12355B] font-medium focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 focus:bg-white"
              >
                <option value="auto">Adaptive Auto (Recommended)</option>
                <option value="fast">Multi-Scale Reconstitution Engine (~11s, CPU)</option>
                <option value="rfmsr">RFMSR Flow-Matching Neural Engine (DiT)</option>
              </select>
            </div>

            {/* Disaster Assessment Toggle */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                name="enable_disaster_assessment"
                checked={formValues.enable_disaster_assessment}
                onChange={onChange}
                className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] h-3.5 w-3.5 bg-[#F8FAFC]"
              />
              <span className="text-[#12355B] text-[11px] flex items-center gap-1 font-semibold">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Pre/Post Disaster Change Detection
              </span>
            </label>
          </div>

          {/* Action & Progress */}
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-2">
            <button
              onClick={onRunPipeline}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#12355B] hover:bg-[#1E40AF] text-white shadow-[#12355B]/20 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0F9D9A]" />
                  <span>Processing Imagery...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                  <span>Process Satellite Tile</span>
                </>
              )}
            </button>

            {/* Live Step Progress Indicator & Checklist */}
            {(isLoading || isCompleted) && (
              <div
                className={`rounded-xl p-3 border text-xs space-y-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                    : 'bg-primary-50/70 border-accent-500/30'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-[11px]">
                  {isCompleted ? (
                    <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ALL {totalStages} STAGES COMPLETED
                    </span>
                  ) : (
                    <span className="text-accent-700 font-bold">
                      STAGE {currentStage}/{totalStages}
                    </span>
                  )}
                  <span
                    className={`font-mono text-xs ${
                      isCompleted ? 'text-emerald-700 font-bold' : 'text-accent-700 font-semibold'
                    }`}
                  >
                    {progressPercent}%
                  </span>
                </div>

                {!isCompleted && (
                  <p className="text-primary-950 text-[11px] font-semibold leading-tight flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin text-accent-600 shrink-0" />
                    <span>Processing: {currentStageName}</span>
                  </p>
                )}

                {/* Progress Bar Track */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      isCompleted ? 'bg-emerald-500' : 'bg-accent-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Stages Status Checklist */}
                <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                  {stages.map((stageName, idx) => {
                    const stageNum = idx + 1;
                    const isDone = isCompleted || currentStage > stageNum;
                    const isCurrent = isLoading && currentStage === stageNum;
                    return (
                      <div key={stageName} className="flex items-center justify-between text-[10px]">
                        <span
                          className={`flex items-center gap-1.5 ${
                            isDone
                              ? 'text-emerald-800 font-medium'
                              : isCurrent
                              ? 'text-primary-950 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-3 w-3 text-accent-600 animate-spin shrink-0" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 shrink-0" />
                          )}
                          <span>
                            {idx + 1}. {stageName}
                          </span>
                        </span>
                        <span
                          className={`text-[9px] font-mono ${
                            isDone
                              ? 'text-emerald-600 font-semibold'
                              : isCurrent
                              ? 'text-accent-600 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {isDone ? 'Ready' : isCurrent ? 'Processing...' : 'Waiting'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Result Button */}
            {hasResults && (
              <button
                onClick={onOpenResults}
                className="w-full py-2 px-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#12355B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Maximize2 className="h-3.5 w-3.5 text-accent-600" />
                <span>{isLoading ? 'View Live Results & Slider' : 'View Results & Split Slider'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
