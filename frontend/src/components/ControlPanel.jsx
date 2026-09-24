import React, { useState } from 'react';
import { Play, MapPin, Sliders, ShieldAlert, Bookmark } from 'lucide-react';

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
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Pipeline Parameters</h2>
            <p className="text-xs text-slate-500">Configure target coordinates or select a validated scenario</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs gap-0.5">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 font-medium shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 rounded-md transition-colors ${
              activeTab === 'custom'
                ? 'bg-white text-slate-900 font-medium shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Coordinates
          </button>
        </div>
      </div>

      {/* Preset Location Pills */}
      {activeTab === 'presets' && presets?.locations && (
        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-slate-500" />
            <span>Select Validated Satellite Scene:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {presets.locations.map((loc) => {
              const isSelected =
                Math.abs(formValues.latitude - loc.lat) < 0.001 &&
                Math.abs(formValues.longitude - loc.lon) < 0.001;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectPreset(loc)}
                  className={`p-2.5 text-left rounded-lg border transition-colors text-xs ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white font-medium shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate">{loc.name.split(' (')[0]}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {loc.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inputs Form */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Latitude */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>Latitude</span>
          </label>
          <input
            type="number"
            step="0.0001"
            name="latitude"
            value={formValues.latitude}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
            placeholder="e.g. 16.5062"
            required
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>Longitude</span>
          </label>
          <input
            type="number"
            step="0.0001"
            name="longitude"
            value={formValues.longitude}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
            placeholder="e.g. 80.6480"
            required
          />
        </div>

        {/* AOI Size */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            AOI Size (km)
          </label>
          <input
            type="number"
            step="0.1"
            name="aoi_km"
            value={formValues.aoi_km}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
            required
          />
        </div>

        {/* Max Cloud */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Max Cloud Cover (%)
          </label>
          <input
            type="number"
            name="max_cloud"
            value={formValues.max_cloud}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
            required
          />
        </div>
      </div>

      {/* Footer / Action */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
          <input
            type="checkbox"
            name="enable_disaster_assessment"
            checked={formValues.enable_disaster_assessment}
            onChange={onChange}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 bg-slate-50"
          />
          <span className="text-slate-700 flex items-center gap-1 font-medium">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
            <span>Run Disaster Change Assessment</span>
          </span>
        </label>

        {/* Action Button: Clean solid slate-900, NO gradient */}
        <button
          onClick={onRunPipeline}
          disabled={isLoading}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-xs tracking-wider uppercase transition-colors shadow-sm ${
            isLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
              <span>Processing Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white text-white" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
