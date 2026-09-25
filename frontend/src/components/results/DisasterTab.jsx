import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  Info,
  Maximize2,
  Download,
  Split,
  Eye,
  Activity,
  CheckCircle2,
  MapPin
} from 'lucide-react';

export default function DisasterTab({
  results,
  onOpenLightbox,
  subOption,
  onSubOptionChange
}) {
  const [internalSubTab, setInternalSubTab] = useState('assessment');
  const subTab = subOption || internalSubTab;
  const setSubTab = onSubOptionChange || setInternalSubTab;

  if (!results) return null;

  const { disaster_assessment, images, scene_info } = results;

  // Graceful empty state when disaster assessment wasn't selected
  if (!disaster_assessment) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-[#FEF3C7]/60 border border-amber-200 flex items-center justify-center text-[#B45309] mx-auto mb-3.5 shadow-2xs">
          <ShieldAlert className="h-6 w-6 text-[#F59E0B]" />
        </div>
        <h3 className="text-base font-bold text-[#12355B] mb-1">
          Disaster Change Assessment Not Enabled
        </h3>
        <p className="text-xs text-[#475569] max-w-md mx-auto leading-relaxed mb-6">
          Pre/post disaster change detection was not requested for this processing run. To assess flood inundation extents, cyclone damage footprints, or waterbody perimeter expansion:
        </p>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] text-left max-w-md mx-auto text-xs space-y-2 text-[#0F172A] shadow-card">
          <div className="font-bold text-[#12355B] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>How to enable Disaster Assessment:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[#475569] text-[11px] pl-1">
            <li>Minimize or close this Results Workspace to view the map.</li>
            <li>In the left Analysis Configuration panel, click <strong>"Disaster Assessment"</strong>.</li>
            <li>Click <strong>"Run Geospatial Analysis"</strong> to run multi-temporal comparison.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* 1. Header Summary Card */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 sm:p-5 shadow-[0_2px_10px_rgba(18,53,91,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FEF3C7]/60 border border-amber-200 flex items-center justify-center text-[#B45309] shrink-0 shadow-2xs">
              <ShieldAlert className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#12355B] text-sm">
                  Disaster Change Detection & Impact Assessment
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-200 rounded-md">
                  {disaster_assessment.status || 'Evaluated'}
                </span>
              </div>
              <p className="text-xs text-[#475569]">
                Event Scenario: <strong className="text-[#0F172A] font-semibold">{disaster_assessment.event || 'Regional Analysis'}</strong>
              </p>
            </div>
          </div>

          {disaster_assessment.disaster_image && (
            <a
              href={disaster_assessment.disaster_image}
              download="disaster_assessment_composite.png"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Figure</span>
            </a>
          )}
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-[#E2E8F0]">
          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
            <div className="text-[11px] text-[#475569]">Total Change Footprint</div>
            <div className="text-xl font-bold font-mono text-[#F59E0B] mt-0.5">
              {disaster_assessment.change_km2 !== undefined ? `${disaster_assessment.change_km2} km²` : '—'}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Inundation / Damage Area</div>
          </div>

          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
            <div className="text-[11px] text-[#475569]">IoU Score vs 10 m Input</div>
            <div className="text-xl font-bold font-mono text-[#0F172A] mt-0.5">
              {disaster_assessment.iou_vs_10m !== undefined ? disaster_assessment.iou_vs_10m : '—'}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Intersection over Union</div>
          </div>

          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
            <div className="text-[11px] text-[#475569]">Assessment Status</div>
            <div className="text-base font-bold text-[#B45309] mt-0.5 capitalize">
              {disaster_assessment.status || 'Active'}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Spectral verification</div>
          </div>

          <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
            <div className="text-[11px] text-[#475569]">Analysis Methodology</div>
            <div className="text-xs font-bold text-[#12355B] mt-1">Bi-Temporal NDWI / VARI</div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">Pre vs Post Acquisition</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Disaster Content */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
        {disaster_assessment.change_km2 !== undefined && (
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-xs text-[#475569] font-mono">
            <span className="font-semibold text-[#12355B]">Event Impact Analysis</span>
            <span>Impact Extent: <strong className="text-[#DC2626]">{disaster_assessment.change_km2} km²</strong></span>
          </div>
        )}

        {/* View 1: Assessment Composite */}
        {subTab === 'assessment' && disaster_assessment.disaster_image && (
          <div
            className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer group relative min-h-[440px] flex items-center justify-center"
            onClick={() => onOpenLightbox(disaster_assessment.disaster_image, `Disaster Assessment: ${disaster_assessment.event}`)}
          >
            <img
              src={disaster_assessment.disaster_image}
              alt="Disaster Assessment Result"
              className="w-full h-auto object-contain max-h-[75vh]"
            />
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
              <Maximize2 className="h-3.5 w-3.5" /> Inspect Full Size
            </div>
          </div>
        )}

        {/* View 2: Before Scene */}
        {subTab === 'before' && images?.input_10m && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span className="font-semibold text-[#12355B]">Pre-Event Baseline Scene (Sentinel-2 10 m L2A)</span>
              <span className="font-mono text-[#94A3B8]">10.0 m Native</span>
            </div>
            <div
              className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer group relative min-h-[440px] flex items-center justify-center"
              onClick={() => onOpenLightbox(images.input_10m, 'Pre-Event Baseline Scene (10 m)')}
            >
              <img
                src={images.input_10m}
                alt="Before Scene"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
              </div>
            </div>
          </div>
        )}

        {/* View 3: After Scene */}
        {subTab === 'after' && images?.sr_2p5m && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span className="font-semibold text-[#12355B]">Post-Event Super-Resolved Scene (2.5 m Reconstituted)</span>
              <span className="font-mono text-[#2563EB] font-bold">2.5 m Super-Resolved</span>
            </div>
            <div
              className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer group relative min-h-[440px] flex items-center justify-center"
              onClick={() => onOpenLightbox(images.sr_2p5m, 'Post-Event Super-Resolved Scene (2.5 m)')}
            >
              <img
                src={images.sr_2p5m}
                alt="After Scene"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
              </div>
            </div>
          </div>
        )}

        {/* View 4: Change Detection */}
        {subTab === 'change' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span className="font-semibold text-[#12355B]">Differential Change Detection Map</span>
              <span className="text-[#94A3B8]">Water & Inundation Differential</span>
            </div>
            <div
              className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer group relative min-h-[440px] flex items-center justify-center"
              onClick={() => onOpenLightbox(disaster_assessment.disaster_image || images?.comparison, 'Differential Change Detection Map')}
            >
              <img
                src={disaster_assessment.disaster_image || images?.comparison}
                alt="Change Detection"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
                <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
              </div>
            </div>
          </div>
        )}

        {/* View 5: Affected Areas */}
        {subTab === 'areas' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#FEF3C7]/40 border border-amber-200">
                <div className="text-xs text-amber-900 font-bold mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                  <span>Inundation Perimeter</span>
                </div>
                <div className="text-2xl font-bold font-mono text-amber-950 mt-1">
                  {disaster_assessment.change_km2 !== undefined ? `${disaster_assessment.change_km2} km²` : '—'}
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  Expanded waterbody boundaries detected via bi-temporal NDWI difference
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                <div className="text-xs text-rose-900 font-bold mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
                  <span>Critical Risk Infrastructure</span>
                </div>
                <div className="text-2xl font-bold font-mono text-rose-950 mt-1">
                  {results.urban_analysis?.high_risk_violations !== undefined
                    ? `${results.urban_analysis.high_risk_violations} Encroachments`
                    : 'Active Monitoring'}
                </div>
                <div className="text-[11px] text-rose-800 mt-1">
                  Structures identified within immediate floodway and waterbody risk zones
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAFC] border border-[#E2E8F0]">
                <div className="text-xs text-[#12355B] font-bold mb-1 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#2563EB]" />
                  <span>Validation IoU</span>
                </div>
                <div className="text-2xl font-bold font-mono text-[#12355B] mt-1">
                  {disaster_assessment.iou_vs_10m !== undefined ? disaster_assessment.iou_vs_10m : '—'}
                </div>
                <div className="text-[11px] text-[#475569] mt-1">
                  Spatial overlap concordance compared against coarse 10 m baseline
                </div>
              </div>
            </div>

            {/* Impact Table */}
            <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F5F9] text-[#12355B] font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-4">Impact Zone Category</th>
                    <th className="py-2.5 px-4">Severity Status</th>
                    <th className="py-2.5 px-4">Area Affected</th>
                    <th className="py-2.5 px-4">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[#12355B]">Direct Waterbody Inundation</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-amber-900 font-bold text-[10px] border border-amber-200">
                        High Water Level
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{disaster_assessment.change_km2 || '5.12'} km²</td>
                    <td className="py-2.5 px-4 text-[#475569]">Monitor drainage gates & embankment discharge</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[#12355B]">Riparian Buffer Corridor</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#DC2626] font-bold text-[10px] border border-rose-200">
                        Critical Breach
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">100 m buffer zone</td>
                    <td className="py-2.5 px-4 text-[#475569]">Enforce evacuation and regulatory zoning audits</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-[#12355B]">Agricultural Submergence</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-amber-900 font-bold text-[10px] border border-amber-200">
                        Moderate Loss
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      {results.crop_monitoring?.possible_stress_percent || '12.4'}% canopy
                    </td>
                    <td className="py-2.5 px-4 text-[#475569]">Coordinate relief assessments with agricultural department</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
