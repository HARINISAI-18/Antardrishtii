import React from 'react';
import {
  Satellite,
  ShieldAlert,
  Globe2,
  Sparkles,
  Zap,
  Target,
  Users,
  Compass,
  Building2,
  Sprout,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Heart
} from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="w-full h-full bg-[#EEF2F6] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* 1. Hero Vision Banner */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-10 shadow-[0_4px_20px_rgba(18,53,91,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-[#2563EB]/10 via-[#0F9D9A]/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            {/* Official Logo Emblem */}
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white border border-[#CBD5E1] p-2 flex items-center justify-center shadow-md shrink-0">
              <img src="/logo.png" alt="Antardrishtii Emblem" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#2563EB]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>About Antardrishtii</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#12355B] tracking-tight leading-tight">
                Satellite Intelligence for a Safer Tomorrow
              </h1>
              <p className="text-sm text-[#475569] max-w-2xl leading-relaxed">
                Antardrishtii is a next-generation earth observation and geospatial intelligence platform.
                We bridge the gap between medium-resolution public satellite constellations and sub-decameter
                decision-making for disaster response, sustainable agriculture, and resilient urban planning.
              </p>
            </div>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[#E2E8F0]">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="text-2xl font-black font-mono text-[#2563EB]">4.0×</div>
              <div className="text-[11px] font-semibold text-[#12355B] mt-0.5">Spatial Magnification</div>
              <div className="text-[10px] text-[#64748B]">10 m native → 2.5 m GSD</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="text-2xl font-black font-mono text-[#0F9D9A]">16×</div>
              <div className="text-[11px] font-semibold text-[#12355B] mt-0.5">Pixel Density Gain</div>
              <div className="text-[10px] text-[#64748B]">Fine structural synthesis</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="text-2xl font-black font-mono text-[#12355B]">9</div>
              <div className="text-[11px] font-semibold text-[#12355B] mt-0.5">Analytical Pipelines</div>
              <div className="text-[10px] text-[#64748B]">CV & Remote Sensing</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="text-2xl font-black font-mono text-[#16A34A]">100%</div>
              <div className="text-[11px] font-semibold text-[#12355B] mt-0.5">Open Satellite Data</div>
              <div className="text-[10px] text-[#64748B]">Copernicus Sentinel-2</div>
            </div>
          </div>
        </div>

        {/* 2. Core Pillars of Innovation */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#12355B]">Our Core Pillars</h2>
            <p className="text-xs text-[#475569]">The engineering principles behind every pixel and analytical model</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#12355B]">Sub-Decameter Geometric Precision</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Standard 10 m satellite imagery blurs narrow roads, rooftop vectors, and small water bodies.
                Using neural Rectified Flow Matching (RFMSR) and multi-scale frequency reconstitution,
                we reconstruct sharp structural boundaries without hallucinating synthetic artifacts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#12355B]">Rapid Crisis & Disaster Response</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                In natural crises like the Vijayawada flood disaster, minutes matter.
                Antardrishtii performs instant multi-temporal delta analysis, quantifying inundated surface hectares,
                breached water corridors, and cut-off logistical infrastructure in under 12 seconds.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Sprout className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#12355B]">Agricultural Resilience & Food Security</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Smallholder farmers operate fields often smaller than single native Sentinel-2 pixels.
                Our calibrated NDVI and multi-spectral canopy monitoring isolates crop micro-parcels,
                detecting moisture stress, vegetative health stages, and harvest readiness.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-2.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#12355B]">Automated Urban Compliance</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Cities expand rapidly, stressing infrastructure and emergency routes.
                We automatically segment permanent buildings and temporary shelters,
                evaluating 15 m and 30 m safety setback buffers along critical road networks and floodways.
              </p>
            </div>
          </div>
        </div>

        {/* 3. The Technology Stack */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 sm:p-8 shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <Cpu className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-base sm:text-lg font-bold text-[#12355B]">Technology Architecture</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
              <span className="font-bold text-[#12355B] text-sm">Data Ingestion</span>
              <ul className="space-y-1 text-[#475569] text-[11px]">
                <li>• ESA Copernicus Sentinel-2 Constellation</li>
                <li>• Microsoft Planetary Computer STAC API</li>
                <li>• L2A Top-of-Canopy Bottom-of-Atmosphere (BOA)</li>
                <li>• Automated cloud masking and tile mosaic</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
              <span className="font-bold text-[#12355B] text-sm">AI & Computer Vision</span>
              <ul className="space-y-1 text-[#475569] text-[11px]">
                <li>• RFMSR Rectified Flow Matching Diffusion (DiT)</li>
                <li>• Multi-Scale Frequency Reconstitution</li>
                <li>• Frangi Vesselness Filter & Skeletonization</li>
                <li>• Otsu morphological top-hat building vectorization</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
              <span className="font-bold text-[#12355B] text-sm">Frontend & GIS Studio</span>
              <ul className="space-y-1 text-[#475569] text-[11px]">
                <li>• React 18, Vite, and Tailwind CSS Design System</li>
                <li>• Interactive Leaflet Map with drag-and-drop AOI</li>
                <li>• Split-slider side-by-side comparison modal</li>
                <li>• GIS GeoTIFF, GeoJSON, and CSV exports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Open Science & Partnership Footer */}
        <div className="bg-[#12355B] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold">Dedicated to Open Science & Public Good</h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Antardrishtii is built upon open standards, open satellite archives, and reproducible deep learning research.
                Designed to empower researchers, municipal planners, and humanitarian relief teams worldwide.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white">
                <Globe2 className="h-3.5 w-3.5 text-[#0F9D9A]" />
                <span>Open Earth Observation</span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span>© 2026 Antardrishtii Team. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="h-3 w-3 text-rose-400 fill-rose-400" /> for Planet Earth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
