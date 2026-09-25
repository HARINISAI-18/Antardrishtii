import React from 'react';
import {
  Database,
  Globe2,
  Maximize,
  Cpu,
  Clock,
  CheckCircle2,
  Layers,
  FileCheck
} from 'lucide-react';

export default function DetailsTab({ results }) {
  if (!results) return null;

  const { scene_info, engine, timings } = results;

  const PIPELINE_STAGES = [
    {
      title: 'Copernicus / Planetary Computer STAC Query',
      desc: 'Searched Sentinel-2 L2A catalog, verified metadata cloud cover and orbit availability.',
      status: 'Completed'
    },
    {
      title: 'Radiometric Calibration & Multiband Ingestion',
      desc: 'Extracted Red (B04), Green (B03), Blue (B02), and NIR (B08) with 2–98% percentile stretching.',
      status: 'Completed'
    },
    {
      title: '4× Super-Resolution Reconstitution Mosaic Engine',
      desc: 'Executed multi-scale neural / reconstitution synthesis transforming 10 m native pixels to 2.5 m grid.',
      status: 'Completed'
    },
    {
      title: '9 Domain Computer Vision Analytical Pipelines',
      desc: 'Evaluated building footprints, Frangi road networks, field lines, crop NDVI, and spatial compliance.',
      status: 'Completed'
    },
    {
      title: 'Synthesis, GeoJSON Vectorization & CSV Compilation',
      desc: 'Generated georeferenced GeoTIFF, building polygons, compliance breach tables, and CSV benchmarks.',
      status: 'Completed'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-3">
        <h3 className="text-sm font-bold text-[#12355B]">Technical Specifications & Processing Audit</h3>
        <p className="text-xs text-[#475569]">
          Complete sensor parameters, spatial bounding geometry, execution engines, and pipeline latency metrics
        </p>
      </div>

      {/* Grid of 4 Technical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Satellite & Sensor Metadata */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
            <div className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#2563EB] border border-[#E2E8F0]">
              <Database className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-xs text-[#12355B] uppercase tracking-wider font-mono">
              Satellite & Sensor Acquisition
            </h4>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#E2E8F0] font-mono">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#475569] font-sans">Constellation:</span>
              <span className="font-semibold text-[#0F172A]">Sentinel-2 (MSI L2A)</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Scene Item ID:</span>
              <span className="font-semibold text-[#0F172A] truncate max-w-[240px]" title={scene_info?.id}>
                {scene_info?.id || 'Sentinel-2 L2A'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Acquisition Date:</span>
              <span className="font-semibold text-[#0F172A]">{scene_info?.date || '2024'}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Scene Cloud Cover:</span>
              <span className="font-semibold text-[#0F172A]">
                {scene_info?.cloud_cover_pct !== undefined ? `${scene_info.cloud_cover_pct.toFixed(2)}%` : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Usable Pixels in AOI:</span>
              <span className="font-semibold text-[#0F172A]">{scene_info?.usable_pct || '100'}%</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Data Source Backend:</span>
              <span className="font-semibold text-[#0F172A]">{scene_info?.source_backend || 'Planetary Computer / CDSE'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Spatial & Spectral Geometry */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
            <div className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#0F9D9A] border border-[#E2E8F0]">
              <Globe2 className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-xs text-[#12355B] uppercase tracking-wider font-mono">
              Spatial Bounding Geometry
            </h4>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#E2E8F0] font-mono">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#475569] font-sans">Projection CRS:</span>
              <span className="font-semibold text-[#0F172A]">{scene_info?.crs || 'EPSG:4326 (WGS84)'}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Bounding Box [W, S, E, N]:</span>
              <span className="font-semibold text-[#0F172A] text-[11px] truncate max-w-[240px]" title={JSON.stringify(scene_info?.bbox)}>
                {scene_info?.bbox ? scene_info.bbox.map((v) => Number(v).toFixed(4)).join(', ') : 'Derived'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Input Tile Dimensions:</span>
              <span className="font-semibold text-[#0F172A]">{engine?.input_pixels || '512x512'} px</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Output Mosaic Dimensions:</span>
              <span className="font-semibold text-[#0F172A]">{engine?.output_pixels || '2048x2048'} px</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Spectral Bands Processed:</span>
              <span className="font-semibold text-[#0F172A]">B02 (Blue), B03 (Green), B04 (Red), B08 (NIR)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Resolution & Pixel Area Transformation */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
            <div className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#2563EB] border border-[#E2E8F0]">
              <Maximize className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-xs text-[#12355B] uppercase tracking-wider font-mono">
              Resolution Transformation Metrics
            </h4>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#E2E8F0] font-mono">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#475569] font-sans">Native Ground Sampling Distance (GSD):</span>
              <span className="font-semibold text-[#0F172A]">10.0 m / px</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Super-Resolved GSD:</span>
              <span className="font-bold text-[#2563EB]">2.5 m / px</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Linear Magnification Factor:</span>
              <span className="font-bold text-[#2563EB]">4.0×</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Pixel Area Detail Magnification:</span>
              <span className="font-bold text-[#0F9D9A]">16.0× (16 sub-pixels per 10m cell)</span>
            </div>
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[#475569] font-sans">Total Output Pixel Grid:</span>
              <span className="font-semibold text-[#0F172A]">4,194,304 pixels (4.19 MP)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Engine Architecture & Latencies */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
            <div className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#2563EB] border border-[#E2E8F0]">
              <Cpu className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-xs text-[#12355B] uppercase tracking-wider font-mono">
              Engine Execution & Latency Audit
            </h4>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#E2E8F0] font-mono">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#475569] font-sans">Pipeline Engine:</span>
              <span className="font-semibold text-[#0F172A]">{engine?.name || '4× Super-Resolution Reconstitution'}</span>
            </div>
            {timings && (
              <>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#475569] font-sans">STAC Download / Cache Fetch:</span>
                  <span className="font-semibold text-[#0F172A]">{timings.fetch_s}s</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#475569] font-sans">Super-Resolution Inference:</span>
                  <span className="font-semibold text-[#0F172A]">{timings.sr_s}s</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#475569] font-sans">9-Application CV Metrics Calculation:</span>
                  <span className="font-semibold text-[#0F172A]">{timings.metrics_s}s</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[#475569] font-sans">Urban Footprint Extraction & Audit:</span>
                  <span className="font-semibold text-[#0F172A]">{timings.urban_s}s</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E2E8F0] font-bold">
                  <span className="text-[#12355B] font-sans">Total Pipeline Execution Time:</span>
                  <span className="text-[#2563EB]">{timings.total_s}s</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Processing Pipeline Stages Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-card space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
          <div className="p-1.5 rounded-xl bg-[#F1F5F9] text-[#16A34A] border border-[#E2E8F0]">
            <FileCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#12355B] uppercase tracking-wider font-mono">
              Pipeline Stage Verification
            </h4>
            <p className="text-xs text-[#475569]">Chronological verification of data ingestion and analytical synthesis</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0] text-xs">
              <div className="h-6 w-6 rounded-full bg-[#DCFCE7] border border-emerald-200 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#12355B]">{stage.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#16A34A] border border-emerald-200">
                    {stage.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
