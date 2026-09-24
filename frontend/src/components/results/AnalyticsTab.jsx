import React, { useState } from 'react';
import {
  Table,
  Sprout,
  Building2,
  Download,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Maximize2,
  Info,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import MetricsTable from '../MetricsTable';
import ViolationsTab from './ViolationsTab';

export default function AnalyticsTab({
  results,
  onOpenLightbox,
  defaultSubTab = 'crop',
  defaultSubOption = null,
  activeSubTab = null,
  activeSubOption = null,
  onNavigateTab,
  onFlyToCoords
}) {
  const currentSubTab = activeSubTab || defaultSubTab;
  const [subTab, setSubTab] = useState(currentSubTab);
  const [cropView, setCropView] = useState(
    (activeSubOption || defaultSubOption) && ['comparison', 'ndvi', 'health'].includes(activeSubOption || defaultSubOption)
      ? (activeSubOption || defaultSubOption)
      : 'comparison'
  );
  const [urbanView, setUrbanView] = useState(
    (activeSubOption || defaultSubOption) && ['overview', 'audit', 'roads', 'buildings', 'violations'].includes(activeSubOption || defaultSubOption)
      ? (activeSubOption || defaultSubOption)
      : 'overview'
  );
  const [metricsCategory, setMetricsCategory] = useState('All');

  React.useEffect(() => {
    if (activeSubTab) setSubTab(activeSubTab);
    else if (defaultSubTab) setSubTab(defaultSubTab);
  }, [activeSubTab, defaultSubTab]);

  React.useEffect(() => {
    const opt = activeSubOption || defaultSubOption;
    if (opt) {
      if (['comparison', 'ndvi', 'health'].includes(opt)) {
        setCropView(opt);
      }
      if (['overview', 'audit', 'roads', 'buildings', 'violations'].includes(opt)) {
        setUrbanView(opt);
      }
      if (opt === 'all') setMetricsCategory('All');
      else if (opt === 'resolution') setMetricsCategory('Super-Resolution');
      else if (opt === 'spectral') setMetricsCategory('Spectral / Remote Sensing');
    }
  }, [activeSubOption, defaultSubOption]);

  if (!results) return null;

  const {
    metrics_table,
    crop_monitoring,
    urban_analysis,
    images,
    downloads,
    scene_info
  } = results;

  const totalMetrics = metrics_table?.length || 0;
  const improvedMetrics =
    metrics_table?.filter(
      (m) =>
        (m.Better === '↑' && m.Delta > 0) ||
        (m.Better === '↓' && m.Delta < 0)
    ).length || 0;

  // Approximate hectares if AOI is known
  const aoiKm2 = 26.21;
  const totalHectares = Math.round(aoiKm2 * 100);
  const vegetatedHectares = crop_monitoring
    ? Math.round((crop_monitoring.vegetation_coverage_percent / 100) * totalHectares)
    : 0;
  const stressedHectares = crop_monitoring
    ? Math.round((crop_monitoring.possible_stress_percent / 100) * totalHectares)
    : 0;

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">

      {/* =================================================================== */}
      {/* 1. METRICS SUBTAB                                                   */}
      {/* =================================================================== */}
      {subTab === 'metrics' && (
        <div className="space-y-4">
          <MetricsTable metrics={metrics_table} initialCategory={metricsCategory} />
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. CROP MONITORING SUBTAB                                           */}
      {/* =================================================================== */}
      {subTab === 'crop' && crop_monitoring && (
        <div className="space-y-4">
          {/* 1. Primary Interactive Result Image Canvas (Displayed First) */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="text-xs font-bold text-[#12355B] flex items-center gap-1.5">
                <Sprout className="h-4 w-4 text-[#16A34A]" />
                <span>
                  {cropView === 'comparison' && 'RFMSR 4× Super-Resolution + NDVI Synthesis'}
                  {cropView === 'ndvi' && 'Sentinel-2 Normalized Difference Vegetation Index (NDVI)'}
                  {cropView === 'health' && 'Canopy Vigour & Multi-Spectral Condition Classification'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {downloads?.crop_ndvi_geotiff && (
                  <a
                    href={downloads.crop_ndvi_geotiff}
                    download="crop_ndvi.tif"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7FAFC] hover:bg-[#F1F5F9] text-[#12355B] border border-[#E2E8F0] text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Download className="h-3.5 w-3.5 text-[#0F9D9A]" />
                    <span>Download NDVI GeoTIFF</span>
                  </a>
                )}
              </div>
            </div>

            {/* Display Canvas with Universal Lightbox */}
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center min-h-[440px] relative group cursor-pointer">
              {cropView === 'comparison' && images?.crop_comparison && (
                <div
                  className="w-full"
                  onClick={() => onOpenLightbox(images.crop_comparison, 'RFMSR + NDVI Comparison')}
                >
                  <img src={images.crop_comparison} alt="RFMSR + NDVI Comparison" className="w-full h-auto object-contain" />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                    <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                  </div>
                </div>
              )}

              {cropView === 'ndvi' && images?.crop_ndvi_map && (
                <div
                  className="w-full flex justify-center"
                  onClick={() => onOpenLightbox(images.crop_ndvi_map, 'Sentinel-2 NDVI Spectral Map')}
                >
                  <img src={images.crop_ndvi_map} alt="Sentinel-2 NDVI Map" className="w-full h-auto object-contain max-h-[70vh]" />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                    <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                  </div>
                </div>
              )}

              {cropView === 'health' && images?.crop_health_map && (
                <div
                  className="w-full flex justify-center"
                  onClick={() => onOpenLightbox(images.crop_health_map, 'Crop Condition Health Map')}
                >
                  <img src={images.crop_health_map} alt="Crop Health Map" className="w-full h-auto object-contain max-h-[70vh]" />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                    <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Calibrated NDVI Physics & Scientific Protocol Banner (Placed After Result Image) */}
          <div className="p-3.5 rounded-2xl bg-[#DCFCE7]/40 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Sprout className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950">Calibrated Radiometric NDVI Protocol: </span>
                <span className="text-emerald-900">
                  NDVI = (B08 - B04) / (B08 + B04), calibrated with Sentinel-2 L2A BOA Bottom-of-Atmosphere reflectance.
                </span>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  B04 (Red: 665 nm) captures chlorophyll absorption • B08 (NIR: 842 nm) measures spongy mesophyll leaf cell reflectance.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-300 text-emerald-900 font-bold shadow-2xs">
                GSD: {crop_monitoring.sr_resolution || '2.5 m'}
              </span>
            </div>
          </div>

          {/* 3. Detailed Statistics Cards (Placed After Result Image) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Mean AOI NDVI</div>
              <div className="text-2xl font-bold font-mono text-[#16A34A] mt-1">{crop_monitoring.mean_ndvi}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Median: {crop_monitoring.median_ndvi}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Vegetation Coverage</div>
              <div className="text-2xl font-bold font-mono text-[#0F172A] mt-1">
                {crop_monitoring.vegetation_coverage_percent}%
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                ~{vegetatedHectares.toLocaleString()} hectares (NDVI ≥ 0.40)
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Vegetative Stress</div>
              <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">
                {crop_monitoring.possible_stress_percent}%
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                ~{stressedHectares.toLocaleString()} hectares (0.20 ≤ NDVI &lt; 0.40)
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Dynamic Range</div>
              <div className="text-base font-bold font-mono text-[#12355B] mt-1.5">
                -0.12 → +0.89
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Normalized Spectral Index</div>
            </div>
          </div>

          {/* 4. 5-Class Condition Breakdown with Visual Bars (Placed After Result Image) */}
          {crop_monitoring.crop_condition && (
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] space-y-3 shadow-card">
              <div className="text-xs font-bold text-[#12355B] flex items-center justify-between">
                <span>5-Class Sentinel-2 Canopy Health Classification</span>
                <span className="text-[11px] text-[#94A3B8] font-normal">Calibrated NDVI Thresholds</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {/* 1. Bare Land */}
                <div className="p-3 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#475569]">1. Bare Soil / Water</span>
                    <span className="font-mono text-[#0F172A] font-bold">{crop_monitoring.crop_condition.bare}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden mb-1">
                    <div className="bg-slate-400 h-full" style={{ width: `${crop_monitoring.crop_condition.bare}%` }} />
                  </div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">NDVI &lt; 0.20</div>
                </div>

                {/* 2. Stressed */}
                <div className="p-3 rounded-xl bg-[#FEF3C7]/40 border border-amber-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-amber-900 font-medium">2. Stressed Crop</span>
                    <span className="font-mono text-amber-950 font-bold">{crop_monitoring.crop_condition.possible_stress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden mb-1">
                    <div className="bg-[#F59E0B] h-full" style={{ width: `${crop_monitoring.crop_condition.possible_stress}%` }} />
                  </div>
                  <div className="text-[10px] text-amber-800 font-mono">0.20 ≤ NDVI &lt; 0.40</div>
                </div>

                {/* 3. Moderate */}
                <div className="p-3 rounded-xl bg-lime-50/60 border border-lime-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-lime-900 font-medium">3. Moderate Growth</span>
                    <span className="font-mono text-lime-950 font-bold">{crop_monitoring.crop_condition.moderate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-lime-100 rounded-full overflow-hidden mb-1">
                    <div className="bg-lime-600 h-full" style={{ width: `${crop_monitoring.crop_condition.moderate}%` }} />
                  </div>
                  <div className="text-[10px] text-lime-800 font-mono">0.40 ≤ NDVI &lt; 0.60</div>
                </div>

                {/* 4. Healthy */}
                <div className="p-3 rounded-xl bg-[#DCFCE7]/40 border border-emerald-200">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-emerald-900 font-medium">4. Healthy Canopy</span>
                    <span className="font-mono text-emerald-950 font-bold">{crop_monitoring.crop_condition.healthy}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden mb-1">
                    <div className="bg-[#16A34A] h-full" style={{ width: `${crop_monitoring.crop_condition.healthy}%` }} />
                  </div>
                  <div className="text-[10px] text-emerald-800 font-mono">0.60 ≤ NDVI &lt; 0.80</div>
                </div>

                {/* 5. Dense Optimal */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-emerald-950 font-bold">5. Dense Optimal</span>
                    <span className="font-mono text-emerald-950 font-bold">{crop_monitoring.crop_condition.very_healthy}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden mb-1">
                    <div className="bg-emerald-800 h-full" style={{ width: `${crop_monitoring.crop_condition.very_healthy}%` }} />
                  </div>
                  <div className="text-[10px] text-emerald-900 font-mono">NDVI ≥ 0.80</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. URBAN ANALYSIS SUBTAB                                            */}
      {/* =================================================================== */}
      {subTab === 'urban' && urban_analysis && (
        <div className="space-y-4">
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Detected Buildings</div>
              <div className="text-2xl font-bold font-mono text-[#0F172A] mt-1">{urban_analysis.total_detected_buildings}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Footprint Vectors</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Permanent Structures</div>
              <div className="text-2xl font-bold font-mono text-[#12355B] mt-1">{urban_analysis.permanent_structures}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Area ≥ 300 m²</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Temporary Sheds</div>
              <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">{urban_analysis.temporary_sheds}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Area &lt; 300 m²</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Buffer Violations</div>
              <div className="text-2xl font-bold font-mono text-[#DC2626] mt-1">{urban_analysis.regulatory_violations}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">High Risk: {urban_analysis.high_risk_violations}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
              <div className="text-[11px] text-[#475569] font-medium">Road Segments</div>
              <div className="text-2xl font-bold font-mono text-[#0F9D9A] mt-1">{urban_analysis.osm_road_lines_count}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">OSM + Frangi Fused</div>
            </div>
          </div>

          {/* Road Network Extraction Telemetry Bar */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_2px_8px_rgba(15,23,42,0.06)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-[#475569]">
              <span className="flex items-center gap-1.5 font-bold text-[#12355B]">
                <Layers className="h-3.5 w-3.5 text-[#0F9D9A]" />
                Road Extraction Network:
              </span>
              <span>OSM Vector Lines: <strong className="text-[#0F172A] font-mono">{urban_analysis.osm_road_lines_count}</strong></span>
              <span>CV Hough Corridors: <strong className="text-[#0F172A] font-mono">{urban_analysis.cv_hough_segments_count}</strong></span>
              <span className="text-[#94A3B8] font-mono">CRS: {urban_analysis.utm_crs}</span>
            </div>

            <div className="flex items-center gap-2">
              {downloads?.roads_geojson && (
                <a
                  href={downloads.roads_geojson}
                  download="roads_extracted.geojson"
                  className="px-3 py-1.5 rounded-xl bg-[#F7FAFC] hover:bg-[#F1F5F9] text-[#12355B] border border-[#E2E8F0] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#0F9D9A]" /> Roads GeoJSON
                </a>
              )}
              {downloads?.building_footprints_geojson && (
                <a
                  href={downloads.building_footprints_geojson}
                  download="building_footprints.geojson"
                  className="px-3 py-1.5 rounded-xl bg-[#F7FAFC] hover:bg-[#F1F5F9] text-[#12355B] border border-[#E2E8F0] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#0F9D9A]" /> Buildings GeoJSON
                </a>
              )}
            </div>
          </div>

          {/* Urban Map Views Container */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="text-xs font-bold text-[#12355B] flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#2563EB]" />
                <span>
                  {urbanView === 'overview' && 'Spatial Urban Infrastructure Overview (3 Panels)'}
                  {urbanView === 'audit' && 'Building Footprints & Compliance Buffers Audit'}
                  {urbanView === 'roads' && 'OSM & Frangi Multi-Scale Road Corridors'}
                  {urbanView === 'violations' && `Infrastructure Buffer Violations (${urban_analysis.regulatory_violations} Detected)`}
                </span>
              </div>

              {urban_analysis.regulatory_violations > 0 && urbanView !== 'violations' && (
                <button
                  onClick={() => setUrbanView('violations')}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
                  <span>Inspect {urban_analysis.regulatory_violations} Violations ➔</span>
                </button>
              )}
            </div>

            {/* Urban Views Content */}
            {urbanView === 'violations' ? (
              <ViolationsTab
                results={results}
                onFlyToCoords={onFlyToCoords}
                onOpenLightbox={onOpenLightbox}
              />
            ) : (
              <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center min-h-[440px] relative group cursor-pointer">
                {(urbanView === 'overview' || urbanView === 'audit') && images?.urban_audit_map && (
                  <div
                    className="w-full"
                    onClick={() => onOpenLightbox(images.urban_audit_map, 'Spatial Compliance Audit (3 Panels)')}
                  >
                    <img src={images.urban_audit_map} alt="Spatial Compliance Audit" className="w-full h-auto object-contain" />
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                      <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                    </div>
                  </div>
                )}

                {urbanView === 'roads' && images?.urban_road_panels && (
                  <div
                    className="w-full"
                    onClick={() => onOpenLightbox(images.urban_road_panels, 'Road Network Panels')}
                  >
                    <img src={images.urban_road_panels} alt="Road Network Panels" className="w-full h-auto object-contain" />
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                      <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                    </div>
                  </div>
                )}

                {urbanView === 'buildings' && images?.urban_road_overlay && (
                  <div
                    className="w-full flex justify-center"
                    onClick={() => onOpenLightbox(images.urban_road_overlay, 'Road Network & Building Overlay')}
                  >
                    <img src={images.urban_road_overlay} alt="Road Network Overlay" className="w-full h-auto object-contain max-h-[70vh]" />
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                      <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
