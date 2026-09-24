import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  FileText,
  Download,
  ShieldAlert,
  Sprout,
  Building2,
  Compass,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronRight,
  Database,
  Zap,
  Globe
} from 'lucide-react';

const DOC_SECTIONS = [
  { id: 'overview', title: 'Platform Overview', icon: Globe },
  { id: 'rfmsr', title: '4× Super-Resolution (RFMSR)', icon: Zap },
  { id: 'pipelines', title: '9 Analytical CV Pipelines', icon: Layers },
  { id: 'crop', title: 'Crop NDVI Monitoring', icon: Sprout },
  { id: 'urban', title: 'Urban Audit & Roads', icon: Building2 },
  { id: 'disaster', title: 'Disaster Assessment', icon: ShieldAlert },
  { id: 'api', title: 'REST API Reference', icon: Terminal },
  { id: 'gis', title: 'GIS Formats & Exports', icon: Database }
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = DOC_SECTIONS.filter((sec) =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#EEF2F6] overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 sm:p-8 shadow-[0_2px_12px_rgba(18,53,91,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2563EB]/10 via-[#0F9D9A]/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#2563EB]">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Antardrishtii Documentation v1.0</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12355B] tracking-tight">
                Technical Documentation & Architecture
              </h1>
              <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
                Comprehensive guide to Antardrishtii’s 4× RFMSR Super-Resolution engine,
                radiometric Sentinel-2 multi-spectral calibration, and 9 specialized computer vision remote sensing pipelines.
              </p>
            </div>

            {/* Quick Stat Pill */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center gap-3">
                <Cpu className="h-5 w-5 text-[#2563EB]" />
                <div>
                  <div className="text-[10px] text-[#64748B] font-semibold uppercase">Resolution Magnification</div>
                  <div className="text-sm font-extrabold text-[#12355B] font-mono">10 m → 2.50 m (16× Density)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#CBD5E1] p-4 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3 sticky top-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#12355B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
              />
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                        ? 'bg-[#12355B] text-white font-bold shadow-xs'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#12355B]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#2563EB]'}`} />
                      <span>{sec.title}</span>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Viewport */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-[#CBD5E1] p-6 sm:p-8 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-8">
            {/* SECTION 1: OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">Antardrishtii Architecture Overview</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    An autonomous, end-to-end satellite intelligence platform designed for civil protection, urban analytics, and agricultural resilience.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <h3 className="font-bold text-xs text-[#12355B]">Planetary Computer STAC</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Queries live Sentinel-2 L2A constellations via SpatioTemporal Asset Catalogs (STAC) with zero manual downloading.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <h3 className="font-bold text-xs text-[#12355B]">RFMSR Super-Resolution</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Deep learning Rectified Flow Matching with adaptive fallback reconstitutes 10 m input pixels to 2.5 m sub-decameter grids.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      03
                    </div>
                    <h3 className="font-bold text-xs text-[#12355B]">9 Domain Analytics</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Simultaneously executes 9 computer vision modules including building footprint vectors, road graphs, NDVI, and flood masks.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE] text-xs text-[#1E40AF] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                    <span>Scientific Standards & Calibration</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#1E40AF]/90">
                    All bands undergo Top-of-Canopy (TOC) Bottom-of-Atmosphere (BOA) radiometric calibration with 2%–98% linear percentile stretching.
                    Indices (NDVI, NDWI, VARI) maintain physical optical integrity.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 2: RFMSR */}
            {activeSection === 'rfmsr' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">4× Super-Resolution (RFMSR) Neural Engine</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Rectified Flow Matching with Diffusion Transformer (DiT) architecture tailored for multispectral earth observation.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-[#12355B]">Resolution Magnification Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                      <div className="text-[#64748B] text-[11px]">Input Pixel GSD</div>
                      <div className="text-base font-extrabold text-[#12355B] font-mono mt-0.5">10.00 m</div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                      <div className="text-[#64748B] text-[11px]">Super-Resolved GSD</div>
                      <div className="text-base font-extrabold text-[#2563EB] font-mono mt-0.5">2.50 m</div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                      <div className="text-[#64748B] text-[11px]">Linear Factor</div>
                      <div className="text-base font-extrabold text-[#0F9D9A] font-mono mt-0.5">4.0×</div>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                      <div className="text-[#64748B] text-[11px]">Pixel Density Gain</div>
                      <div className="text-base font-extrabold text-[#12355B] font-mono mt-0.5">16× Area</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-[#12355B]">Engine Execution Modes</h3>
                  <div className="p-4 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#12355B]">Adaptive Auto Mode:</span>
                      <span className="text-[#475569]">
                        Detects CUDA hardware. Uses 8-step DiT Flow-Matching on GPU, or ~11s multi-scale Laplacian reconstitution on CPU.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#12355B]">Feather-Blended Mosaic:</span>
                      <span className="text-[#475569]">
                        Seamlessly merges 512×512 overlapping neural tiles using Gaussian linear cosine distance weighting to eliminate tile seams.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: PIPELINES */}
            {activeSection === 'pipelines' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">9 Computer Vision & Remote Sensing Pipelines</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Automated feature extraction pipelines running concurrently across the 4× super-resolved imagery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { title: 'Small Buildings & Roofs', desc: 'White top-hat morphology (disk 6) + Otsu thresholding for structure outlines <150 m².' },
                    { title: 'Frangi Road Network', desc: 'Multiscale Frangi vesselness filter + Euclidean distance transform for road centrelines ≤7.5 m.' },
                    { title: 'Field Boundaries', desc: 'Sobel gradient edge magnitude + Probabilistic Hough lines for agricultural parcel delineation.' },
                    { title: 'Canopy NDVI & Health', desc: 'Calibrated Top-of-Canopy BOA (B08 - B04)/(B08 + B04) 5-class vegetation health index.' },
                    { title: 'Urban Buffer Compliance', desc: 'OSM road vectors crossed with building centroids to detect 15 m / 30 m safety setback breaches.' },
                    { title: 'Disaster NDWI Flood Extent', desc: 'Normalized Difference Water Index pre- vs post-event flood surface inundation in km².' },
                    { title: 'K-Means Land Cover', desc: 'Unsupervised 6-class cluster classification across RGB spectral channels and texture cues.' },
                    { title: 'Shoreline & Water Bodies', desc: 'Multi-spectral thresholding for pond counts, shoreline contours, and water body perimeter.' },
                    { title: 'Structural Damage Anomaly', desc: 'Spectral deviation and reflectance percentile thresholding for localized event damage.' }
                  ].map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] space-y-1">
                      <div className="font-bold text-[#12355B] flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {p.title}
                      </div>
                      <p className="text-[#475569] text-[11px] leading-relaxed pl-5.5">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: CROP MONITORING */}
            {activeSection === 'crop' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">Crop NDVI & Agricultural Vigour</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Spectral canopy health diagnostics derived from calibrated Sentinel-2 Bands 4 & 8.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                  <div className="font-mono font-bold text-emerald-950 text-sm">
                    NDVI = (B08 - B04) / (B08 + B04)
                  </div>
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Chlorophyll in healthy crops strongly absorbs visible Red light (B04: 665 nm) and reflects Near-Infrared (B08: 842 nm).
                    Super-resolution sharpens parcel boundaries, eliminating mixed-pixel edge distortion.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-[#12355B]">5-Class Canopy Classification Scale</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1]">
                      <span className="font-medium text-[#475569]">1. Bare Soil / Water</span>
                      <span className="font-mono text-[#12355B]">NDVI &lt; 0.20</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200">
                      <span className="font-medium text-amber-900">2. Stressed Crop</span>
                      <span className="font-mono text-amber-950">0.20 ≤ NDVI &lt; 0.40</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-lime-50/60 border border-lime-200">
                      <span className="font-medium text-lime-900">3. Moderate Growth</span>
                      <span className="font-mono text-lime-950">0.40 ≤ NDVI &lt; 0.60</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <span className="font-medium text-emerald-900">4. Healthy Canopy</span>
                      <span className="font-mono text-emerald-950">0.60 ≤ NDVI &lt; 0.80</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-100/60 border border-emerald-300">
                      <span className="font-medium text-emerald-950 font-bold">5. Dense Optimal</span>
                      <span className="font-mono text-emerald-950 font-bold">NDVI ≥ 0.80</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: URBAN AUDIT */}
            {activeSection === 'urban' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">Urban Infrastructure & Compliance Audit</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Building footprint polygon extraction, Frangi road network tracing, and regulatory setback safety buffers.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1.5">
                    <h3 className="font-bold text-[#12355B]">Building Footprint Segmentation</h3>
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      Structures are categorized into Permanent Structures (area ≥ 300 m²) and Temporary Sheds (area &lt; 300 m²).
                      Polygons are automatically converted to GeoJSON geometry with bounding UTM coordinates.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1.5">
                    <h3 className="font-bold text-[#12355B]">Regulatory Buffer Encroachment Engine</h3>
                    <p className="text-[#475569] text-[11px] leading-relaxed">
                      Calculates Euclidean spatial distance from each building polygon centroid to the nearest OSM road or environmental corridor.
                      Structures within 15 m are flagged as High-Risk Violations; structures between 15 m and 30 m are flagged as Moderate Warning.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: DISASTER */}
            {activeSection === 'disaster' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">Disaster Assessment & Change Detection</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Multi-temporal pre- and post-event satellite delta comparison for rapid disaster response.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Validated Crisis Event Presets</span>
                  </div>
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Includes pre-configured historical events such as the <strong>Vijayawada Flood Crisis</strong> (Budameru River breach, Sept 2024).
                    Automatically compares baseline dry-season reflectance with post-inundation imagery to compute affected surface area in km².
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 7: API REFERENCE */}
            {activeSection === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">FastAPI REST API Reference</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    Standard endpoints available at <code className="text-[#2563EB] bg-[#EFF6FF] px-1 py-0.5 rounded">http://localhost:8000</code>.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">POST</span>
                      <span className="font-bold text-[#12355B]">/api/process</span>
                    </div>
                    <p className="text-[11px] font-sans text-[#475569]">
                      Initiates STAC query, downloads Sentinel-2 bands, executes 4× SR, runs all 9 analytical models, and outputs rasters.
                    </p>
                    <div className="bg-[#12355B] text-slate-100 p-3 rounded-lg text-[11px] overflow-x-auto">
                      {`{
  "latitude": 16.5062,
  "longitude": 80.6480,
  "aoi_km": 5.12,
  "date_range": "2024-01-01/2024-12-31",
  "max_cloud": 15,
  "engine_mode": "auto",
  "enable_disaster_assessment": false
}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">GET</span>
                      <span className="font-bold text-[#12355B]">/api/health</span>
                    </div>
                    <p className="text-[11px] font-sans text-[#475569]">
                      Returns connection status, hardware acceleration device (CPU / CUDA GPU), and platform version.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: GIS EXPORTS */}
            {activeSection === 'gis' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#12355B]">GIS Formats & Raster Assets</h2>
                  <p className="text-xs text-[#475569] mt-1">
                    All outputs are generated in industry-standard geospatial formats ready for QGIS, ArcGIS, and Python GDAL.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1.5">
                    <div className="font-bold text-[#12355B] flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-[#2563EB]" />
                      GeoTIFF (Cloud-Optimized)
                    </div>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Complete georeferenced rasters equipped with affine transformation matrices and WGS 84 / UTM CRS projections.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1.5">
                    <div className="font-bold text-[#12355B] flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#0F9D9A]" />
                      GeoJSON Vector Layers
                    </div>
                    <p className="text-[11px] text-[#475569] leading-relaxed">
                      Building footprint vectors, road network centrelines, and compliance violation markers in standard GeoJSON.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
