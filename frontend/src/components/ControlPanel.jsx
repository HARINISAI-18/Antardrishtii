import React, { useState } from 'react';
import { Play, MapPin, Calendar, Cloud, Sliders, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

export default function ControlPanel({
  formValues,
  onChange,
  onSelectPreset,
  presets,
  onRunPipeline,
  isLoading
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'custom'

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-base">Pipeline Input Parameters</h2>
            <p className="text-xs text-slate-400">Specify target coordinates or pick a validated scenario</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'presets'
                ? 'bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'custom'
                ? 'bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Coordinates
          </button>
        </div>
      </div>

      {/* Preset Location Pills */}
      {activeTab === 'presets' && presets?.locations && (
        <div className="mt-5 space-y-2">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Select Validated Satellite Test Scene:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {presets.locations.map((loc) => {
              const isSelected =
                Math.abs(formValues.latitude - loc.lat) < 0.001 &&
                Math.abs(formValues.longitude - loc.lon) < 0.001;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectPreset(loc)}
                  className={`p-3 text-left rounded-xl border transition-all text-xs ${
                    isSelected
                      ? 'bg-brand-950/40 border-brand-500/50 shadow-md shadow-brand-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="truncate">{loc.name.split(' (')[0]}</span>
                    <span className="text-[10px] text-brand-400 font-mono">
                      {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{loc.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inputs Form */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latitude */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand-400" />
            Latitude (Degrees)
          </label>
          <input
            type="number"
            step="0.0001"
            name="latitude"
            value={formValues.latitude}
            onChange={onChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
            placeholder="e.g. 16.5062"
            required
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5 text-brand-400" />
            Longitude (Degrees)
          </label>
          <input
            type="number"
            step="0.0001"
            name="longitude"
            value={formValues.longitude}
            onChange={onChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
            placeholder="e.g. 80.6480"
            required
          />
        </div>

        {/* AOI Size */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            AOI Size (Snapped to 512 px)
          </label>
          <select
            name="aoi_km"
            value={formValues.aoi_km}
            onChange={onChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value={5.12}>5.12 km (1 tile · 512px)</option>
            <option value={10.24}>10.24 km (9 tiles · 1024px)</option>
            <option value={15.36}>15.36 km (16 tiles · 1536px)</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            STAC Date Window
          </label>
          <input
            type="text"
            name="date_range"
            value={formValues.date_range}
            onChange={onChange}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
            placeholder="YYYY-MM-DD/YYYY-MM-DD"
          />
        </div>
      </div>

      {/* Advanced Settings & Toggles */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          {/* Cloud Cover Slider */}
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Max Cloud:</span>
            <input
              type="range"
              min={5}
              max={40}
              step={5}
              name="max_cloud"
              value={formValues.max_cloud}
              onChange={onChange}
              className="w-24 accent-brand-500"
            />
            <span className="text-white font-mono font-medium">{formValues.max_cloud}%</span>
          </div>

          {/* Disaster Assessment Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="enable_disaster_assessment"
              checked={formValues.enable_disaster_assessment}
              onChange={onChange}
              className="rounded border-slate-700 text-brand-500 focus:ring-brand-500 h-4 w-4 bg-slate-900"
            />
            <span className="text-slate-300 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Run Disaster Change Assessment
            </span>
          </label>
        </div>

        {/* Action Button */}
        <button
          onClick={onRunPipeline}
          disabled={isLoading}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
            isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white hover:from-brand-500 hover:to-emerald-400 shadow-brand-500/25 active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
              <span>Processing Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
