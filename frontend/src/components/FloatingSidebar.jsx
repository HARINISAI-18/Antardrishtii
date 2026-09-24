import React, { useState } from 'react';
import {
  Satellite,
  Play,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Cloud,
  CheckCircle2,
  Loader2,
  Maximize2,
  Zap,
  Cpu
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
      className={`absolute top-4 left-4 z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12' : 'w-80 sm:w-96'
        }`}
    >
      {/* Collapsed Toggle Pill */}
      {isCollapsed ? (
        <div className="glass-panel rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-3 bg-white/95 border border-slate-200/90">
          <button
            onClick={() => setIsCollapsed(false)}
            className="h-10 w-10 rounded-xl bg-primary-50 text-primary-900 hover:bg-primary-100 flex items-center justify-center transition-colors shadow-sm"
            title="Expand Control Panel"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="h-px w-6 bg-slate-200 my-1" />
          <div className="p-2 rounded-xl bg-slate-100 text-accent-600" title="GeoResolve AI">
            <Satellite className="h-5 w-5" />
          </div>
          {hasResults && (
            <button
              onClick={onOpenResults}
              className="p-2 rounded-xl bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors shadow-sm"
              title="Open Results"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        /* Expanded Floating Card */
        <div className="glass-panel rounded-2xl p-5 shadow-2xl border border-slate-200/90 bg-white/95 max-h-[92vh] overflow-y-auto flex flex-col text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center border border-primary-100 shadow-sm">
                <Satellite className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-primary-900 tracking-tight flex items-center gap-1.5">
                  GeoResolve AI
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 border border-accent-200 font-medium">
                    4× SR
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500">Satellite Super-Resolution Studio</p>
              </div>
            </div>

            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse Panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Location Presets */}
          {presets?.locations && (
            <div className="mt-3.5">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Validated Scenarios:
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
                          ? 'bg-primary-900 text-white font-semibold shadow-md shadow-primary-900/20'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                        }`}
                    >
                      {loc.name.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coordinates Form */}
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Latitude (°N/S)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="latitude"
                  value={formValues.latitude}
                  onChange={onChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Longitude (°E/W)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="longitude"
                  value={formValues.longitude}
                  onChange={onChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
                />
              </div>
            </div>

            {/* AOI Size selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Area of Interest (AOI Tile Grid)
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[5.12, 10.24, 15.36].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChange({ target: { name: 'aoi_km', value: size } })}
                    className={`py-1.5 rounded-lg border text-center transition-all ${formValues.aoi_km === size
                        ? 'bg-accent-50 border-accent-500 text-accent-700 font-semibold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    {size} km
                  </button>
                ))}
              </div>
            </div>

            {/* Date Window */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-sky-600" />
                STAC Search Date Range
              </label>
              <input
                type="text"
                name="date_range"
                value={formValues.date_range}
                onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
                placeholder="YYYY-MM-DD/YYYY-MM-DD"
              />
            </div>

            {/* Cloud slider */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                <Cloud className="h-3 w-3 text-blue-600" />
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
                  className="w-20 accent-[#0EA5A9]"
                />
                <span className="font-mono text-slate-800 font-semibold text-[11px] w-8 text-right">
                  {formValues.max_cloud}%
                </span>
              </div>
            </div>

            {/* SR Engine Selector */}
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  SR Acceleration Engine
                </span>
                <span className="text-[10px] text-slate-600 font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {backendHealth?.device || 'CPU'}
                </span>
              </label>
              <select
                name="engine_mode"
                value={formValues.engine_mode || 'auto'}
                onChange={onChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20"
              >
                <option value="auto">Adaptive Auto (Recommended)</option>
                <option value="fast">Multi-Scale Reconstitution Engine (~11s, CPU)</option>
                <option value="rfmsr">RFMSR Flow-Matching Neural Engine (DiT)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Auto selects ~11s multi-scale synthesis on CPU, or multi-step DiT on GPU.
              </p>
            </div>

            {/* Disaster Assessment Toggle */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                name="enable_disaster_assessment"
                checked={formValues.enable_disaster_assessment}
                onChange={onChange}
                className="rounded border-slate-300 text-accent-600 focus:ring-accent-500 h-3.5 w-3.5 bg-slate-50"
              />
              <span className="text-slate-700 text-[11px] flex items-center gap-1 font-medium">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Pre/Post Disaster Change Detection
              </span>
            </label>
          </div>

          {/* Action & Progress */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2.5">
            <button
              onClick={onRunPipeline}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 ${isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-900 hover:bg-primary-950 text-white shadow-primary-900/20 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-accent-300" />
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
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-primary-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
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
