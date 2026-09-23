import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Split,
  Table,
  ShieldAlert,
  Download,
  Calendar,
  Cloud,
  Eye,
  Maximize2,
  Sparkles,
  TrendingUp,
  Award,
  Sprout,
  Building2,
  AlertTriangle,
  FileCode,
  Layers,
  CheckCircle2
} from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import MetricsTable from './MetricsTable';

export default function ResultsDrawer({ results, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('slider'); // 'slider' | 'sidebyside' | 'metrics' | 'crop' | 'urban' | 'disaster'
  const [cropView, setCropView] = useState('comparison'); // 'comparison' | 'ndvi' | 'health'
  const [urbanView, setUrbanView] = useState('audit'); // 'audit' | 'roads' | 'overlay'

  if (!isOpen || !results) return null;

  const { scene_info, engine, metrics_table, headlines, images, disaster_assessment, crop_monitoring, urban_analysis, downloads } = results;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[94vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-800">
        {/* Drawer Header */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-900 flex items-center justify-center border border-primary-100 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-primary-900 tracking-tight">
                  Super-Resolution & Analytics Results
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-accent-50 text-accent-700 border border-accent-200 rounded-full">
                  10 m → 2.5 m (16× Pixel Area)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Scene: {scene_info?.id || 'Sentinel-2 L2A'} | {scene_info?.date || '2024'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloads?.sr_image && (
              <a
                href={downloads.sr_image}
                download="super_resolved_2p5m.png"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-950 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download PNG
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata Badges Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-600" />
              <span>Date:</span>
              <span className="text-slate-900 font-mono font-semibold">{scene_info?.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-blue-600" />
              <span>Cloud:</span>
              <span className="text-slate-900 font-mono font-semibold">{scene_info?.cloud_cover_pct?.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-accent-600" />
              <span>Usable AOI:</span>
              <span className="text-slate-900 font-mono font-semibold">{scene_info?.usable_pct}%</span>
            </div>
            <div className="flex items-center gap-1.5 hidden md:flex">
              <span className="text-slate-400">Output:</span>
              <span className="text-accent-700 font-mono font-semibold">{engine?.output_pixels || '2048x2048'}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('slider')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'slider'
                  ? 'bg-primary-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Split Slider
            </button>

            <button
              onClick={() => setActiveTab('sidebyside')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'sidebyside'
                  ? 'bg-primary-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              Side-by-Side
            </button>


            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === 'metrics'
                  ? 'bg-primary-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Metrics ({metrics_table?.length || 26})
            </button>

            {crop_monitoring && (
              <button
                onClick={() => setActiveTab('crop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'crop'
                    ? 'bg-accent-600 text-white font-bold shadow-sm'
                    : 'text-accent-700 hover:text-accent-800 hover:bg-accent-50'
                }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                Crop Monitoring
              </button>
            )}

            {urban_analysis && (
              <button
                onClick={() => setActiveTab('urban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'urban'
                    ? 'bg-sky-600 text-white font-bold shadow-sm'
                    : 'text-sky-700 hover:text-sky-800 hover:bg-sky-50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                Urban Analysis
              </button>
            )}

            {disaster_assessment && (
              <button
                onClick={() => setActiveTab('disaster')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'disaster'
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'text-amber-700 hover:text-amber-800 hover:bg-amber-50'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Disaster Assessment
              </button>
            )}
          </div>
        </div>

        {/* Headlines Banner */}
        {headlines && headlines.length > 0 && activeTab !== 'metrics' && (
          <div className="px-6 py-2.5 bg-accent-50/60 border-b border-accent-100 overflow-x-auto flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-1 text-accent-700 font-semibold shrink-0">
              <Award className="h-3.5 w-3.5" />
              <span>Key Gains:</span>
            </div>
            <div className="flex items-center gap-4 whitespace-nowrap">
              {headlines.slice(0, 4).map((h, i) => (
                <span key={i} className="text-slate-700 font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-accent-600 shrink-0" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {/* TAB 1: BEFORE / AFTER SPLIT SLIDER */}
          {activeTab === 'slider' && (
            <div className="max-w-5xl mx-auto h-full flex flex-col justify-center">
              <BeforeAfterSlider
                beforeImage={images.input_10m}
                afterImage={images.sr_2p5m}
                beforeLabel="Sentinel-2 10 m (Input)"
                afterLabel="Super-Resolved 2.5 m (Ours)"
                sceneId={scene_info?.id}
              />
            </div>
          )}

          {/* TAB 2: SIDE-BY-SIDE INSPECTOR */}
          {activeTab === 'sidebyside' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800">1. Sentinel-2 10 m (Input)</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">Native L2A</span>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={images.input_10m} alt="10m Input" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800">2. Bicubic 4× (Baseline)</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">Interpolated</span>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={images.bicubic_baseline} alt="Bicubic Baseline" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="bg-accent-50/40 rounded-2xl p-3 border border-accent-300 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-accent-800">3. Super-Resolved 2.5 m (Ours)</span>
                    <span className="text-[10px] text-accent-700 bg-accent-100 border border-accent-200 px-2 py-0.5 rounded font-semibold">
                      16× Area Detail
                    </span>
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-accent-200 bg-white">
                    <img src={images.sr_2p5m} alt="SR 2.5m" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {images.comparison && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold text-slate-800">Side-by-Side Detailed Difference Heatmap</span>
                    <a
                      href={images.comparison}
                      download="comparison_composite.png"
                      className="text-primary-900 hover:text-accent-600 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Download className="h-3 w-3" /> Download Figure
                    </a>
                  </div>
                  <img src={images.comparison} alt="Comparison Figure" className="w-full h-auto rounded-xl border border-slate-200" />
                </div>
              )}
            </div>
          )}


          {/* TAB 5: QUANTITATIVE METRICS TABLE */}
          {activeTab === 'metrics' && (
            <div className="max-w-6xl mx-auto">
              <MetricsTable metrics={metrics_table} />
            </div>
          )}

          {/* TAB 6: CROP MONITORING (RFMSR OUTPUT + SENTINEL-2 B04 & B08) */}
          {activeTab === 'crop' && crop_monitoring && (
            <div className="space-y-5 max-w-6xl mx-auto">
              {/* Scientific Note Banner */}
              <div className="p-3.5 rounded-2xl bg-accent-50 border border-accent-200 text-xs text-accent-900 flex items-start gap-3">
                <Sprout className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-accent-950">Scientific Calibration Notice: </span>
                  {crop_monitoring.scientific_note || 'NDVI is calculated from native Sentinel-2 Red (B04) and NIR (B08) measurements and projected onto the 4× super-resolved display grid.'}
                </div>
              </div>

              {/* Crop Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Mean NDVI</div>
                  <div className="text-xl font-bold font-mono text-accent-700 mt-1">{crop_monitoring.mean_ndvi}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Median: {crop_monitoring.median_ndvi}</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Vegetation Coverage</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">{crop_monitoring.vegetation_coverage_percent}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Threshold: NDVI ≥ 0.40</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Possible Stress</div>
                  <div className="text-xl font-bold font-mono text-amber-600 mt-1">{crop_monitoring.possible_stress_percent}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">0.20 ≤ NDVI &lt; 0.40</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Display Resolution</div>
                  <div className="text-xl font-bold font-mono text-primary-900 mt-1">{crop_monitoring.sr_resolution || '2.5 m'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Original Spectral: 10 m</div>
                </div>
              </div>

              {/* 5-Class Condition Distribution */}
              {crop_monitoring.crop_condition && (
                <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-sm bg-white">
                  <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Indicative Crop Vegetation Condition Distribution</span>
                    <span className="text-[10px] text-slate-400 font-normal">Based on 5-Class Sentinel-2 Calibration</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Bare Land</span>
                        <span className="font-mono text-slate-700 font-semibold">{crop_monitoring.crop_condition.bare}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-slate-400 h-full" style={{ width: `${crop_monitoring.crop_condition.bare}%` }} />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-amber-700 font-medium">Low / Stress</span>
                        <span className="font-mono text-amber-800 font-semibold">{crop_monitoring.crop_condition.possible_stress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${crop_monitoring.crop_condition.possible_stress}%` }} />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-lime-50/50 border border-lime-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-lime-700 font-medium">Moderate</span>
                        <span className="font-mono text-lime-800 font-semibold">{crop_monitoring.crop_condition.moderate}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-lime-100 rounded-full overflow-hidden">
                        <div className="bg-lime-500 h-full" style={{ width: `${crop_monitoring.crop_condition.moderate}%` }} />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-emerald-700 font-medium">Healthy</span>
                        <span className="font-mono text-emerald-800 font-semibold">{crop_monitoring.crop_condition.healthy}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${crop_monitoring.crop_condition.healthy}%` }} />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-200">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-teal-700 font-medium">Very Healthy</span>
                        <span className="font-mono text-teal-800 font-semibold">{crop_monitoring.crop_condition.very_healthy}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-teal-100 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full" style={{ width: `${crop_monitoring.crop_condition.very_healthy}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Crop Visualization Sub-Views */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setCropView('comparison')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        cropView === 'comparison'
                          ? 'bg-accent-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      RFMSR + NDVI Comparison
                    </button>
                    <button
                      onClick={() => setCropView('ndvi')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        cropView === 'ndvi'
                          ? 'bg-accent-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      NDVI Spectral Map
                    </button>
                    <button
                      onClick={() => setCropView('health')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        cropView === 'health'
                          ? 'bg-accent-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Crop Condition Classification
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {downloads?.crop_json && (
                      <a
                        href={downloads.crop_json}
                        download="crop_monitoring.json"
                        className="flex items-center gap-1 text-primary-900 hover:text-accent-600 font-medium"
                      >
                        <Download className="h-3.5 w-3.5" /> JSON Data
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl flex items-center justify-center min-h-[420px]">
                  {cropView === 'comparison' && images?.crop_comparison && (
                    <img src={images.crop_comparison} alt="RFMSR + NDVI Comparison" className="w-full h-auto object-contain" />
                  )}
                  {cropView === 'ndvi' && images?.crop_ndvi_map && (
                    <img src={images.crop_ndvi_map} alt="Sentinel-2 NDVI Map" className="w-full h-auto object-contain max-h-[70vh]" />
                  )}
                  {cropView === 'health' && images?.crop_health_map && (
                    <img src={images.crop_health_map} alt="Crop Health Map" className="w-full h-auto object-contain max-h-[70vh]" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: URBAN SPATIAL ANALYSIS & REGULATORY AUDIT */}
          {activeTab === 'urban' && urban_analysis && (
            <div className="space-y-5 max-w-6xl mx-auto">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Detected Buildings</div>
                  <div className="text-xl font-bold font-mono text-sky-600 mt-1">{urban_analysis.total_detected_buildings}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Footprint Vectors</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Permanent Structures</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">{urban_analysis.permanent_structures}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Area ≥ 300 m²</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Temporary Sheds</div>
                  <div className="text-xl font-bold font-mono text-amber-600 mt-1">{urban_analysis.temporary_sheds}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Area &lt; 300 m²</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Buffer Violations</div>
                  <div className="text-xl font-bold font-mono text-rose-600 mt-1">{urban_analysis.regulatory_violations}</div>
                  <div className="text-[10px] text-rose-500 mt-0.5">High Risk: {urban_analysis.high_risk_violations}</div>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <div className="text-[11px] text-slate-500">Max in Grid Block</div>
                  <div className="text-xl font-bold font-mono text-purple-600 mt-1">{urban_analysis.max_buildings_in_grid_block}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Per 64×64px Cell</div>
                </div>
              </div>

              {/* Road Corridors Badge */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Layers className="h-4 w-4 text-sky-600" />
                    Road Extraction Fused Network:
                  </span>
                  <span className="text-amber-700 font-medium">OSM Lines: {urban_analysis.osm_road_lines_count}</span>
                  <span className="text-cyan-700 font-medium">CV Hough Corridors: {urban_analysis.cv_hough_segments_count}</span>
                  <span className="text-slate-500">Metric Projection: {urban_analysis.utm_crs}</span>
                </div>

                <div className="flex items-center gap-2">
                  {downloads?.building_footprints_geojson && (
                    <a
                      href={downloads.building_footprints_geojson}
                      download="building_footprints.geojson"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Download className="h-3 w-3 text-sky-600" /> Buildings GeoJSON
                    </a>
                  )}
                  {downloads?.compliance_violations_geojson && (
                    <a
                      href={downloads.compliance_violations_geojson}
                      download="compliance_violations.geojson"
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs flex items-center gap-1 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3 text-rose-600" /> Violations GeoJSON
                    </a>
                  )}
                </div>
              </div>

              {/* Urban Visualization Sub-Views */}
              <div className="space-y-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-fit">
                  <button
                    onClick={() => setUrbanView('audit')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      urbanView === 'audit'
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Spatial Compliance Audit (3 Panels)
                  </button>
                  <button
                    onClick={() => setUrbanView('roads')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      urbanView === 'roads'
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Road Network Panels (3 Panels)
                  </button>
                  <button
                    onClick={() => setUrbanView('overlay')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      urbanView === 'overlay'
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Road Overlay on Satellite
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl flex items-center justify-center min-h-[420px]">
                  {urbanView === 'audit' && images?.urban_audit_map && (
                    <img src={images.urban_audit_map} alt="Spatial Compliance Audit" className="w-full h-auto object-contain" />
                  )}
                  {urbanView === 'roads' && images?.urban_road_panels && (
                    <img src={images.urban_road_panels} alt="Road Network Panels" className="w-full h-auto object-contain" />
                  )}
                  {urbanView === 'overlay' && images?.urban_road_overlay && (
                    <img src={images.urban_road_overlay} alt="Road Network Overlay" className="w-full h-auto object-contain max-h-[70vh]" />
                  )}
                </div>
              </div>

              {/* Regulatory Violations Sample Table */}
              {urban_analysis.violations_sample && urban_analysis.violations_sample.length > 0 && (
                <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-2 shadow-sm bg-white">
                  <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Detected Waterbody Buffer Encroachment Sample ({urban_analysis.regulatory_violations} total violations)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-slate-700">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-left bg-slate-50">
                          <th className="py-1.5 px-2">ID</th>
                          <th className="py-1.5 px-2">Structure Type</th>
                          <th className="py-1.5 px-2">Risk Level</th>
                          <th className="py-1.5 px-2">Total Area</th>
                          <th className="py-1.5 px-2">Encroached Area</th>
                          <th className="py-1.5 px-2">Coordinates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {urban_analysis.violations_sample.slice(0, 5).map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1 px-2 font-bold text-slate-900">{v.building_id}</td>
                            <td className="py-1 px-2 text-slate-600">{v.structure_type}</td>
                            <td className="py-1 px-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                v.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {v.risk_level}
                              </span>
                            </td>
                            <td className="py-1 px-2">{v.total_area_sqm} m²</td>
                            <td className="py-1 px-2 text-rose-600 font-bold">{v.encroached_area_sqm} m²</td>
                            <td className="py-1 px-2 text-slate-500">[{v.centroid_gps?.join(', ')}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: DISASTER ASSESSMENT */}
          {activeTab === 'disaster' && disaster_assessment && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Event Assessment:</span>
                  <span className="font-semibold text-slate-900">{disaster_assessment.event}</span>
                </div>
                <span className="px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Status: {disaster_assessment.status} ({disaster_assessment.change_km2} km² change, IoU: {disaster_assessment.iou_vs_10m})
                </span>
              </div>
              {disaster_assessment.disaster_image && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
                  <img src={disaster_assessment.disaster_image} alt="Disaster Assessment" className="w-full h-auto object-contain" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
