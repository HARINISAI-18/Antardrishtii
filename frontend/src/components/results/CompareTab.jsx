import React, { useState } from 'react';
import { SlidersHorizontal, Split, Layers, Download, Maximize2 } from 'lucide-react';
import BeforeAfterSlider from '../BeforeAfterSlider';

export default function CompareTab({
  results,
  onOpenLightbox,
  subOption = 'slider'
}) {
  if (!results) return null;

  const { images, scene_info, downloads } = results;
  const hasDifference = Boolean(images?.comparison);
  const subTab = subOption || 'slider';

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-6">
      {/* SUBTAB 1: SPLIT SLIDER */}
      {subTab === 'slider' && images?.input_10m && images?.sr_2p5m && (
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-4 sm:p-5 shadow-[0_2px_10px_rgba(18,53,91,0.06)]">
          <BeforeAfterSlider
            beforeImage={images.input_10m}
            afterImage={images.sr_2p5m}
            beforeLabel="Sentinel-2 10 m (Input)"
            afterLabel="Super-Resolved 2.5 m (Ours)"
            sceneId={scene_info?.id}
          />
        </div>
      )}

      {/* SUBTAB 2: SIDE-BY-SIDE (3-Card Layout) */}
      {subTab === 'sidebyside' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: 10 m Input */}
            <div className="bg-white rounded-2xl p-4 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#12355B]">1. Sentinel-2 10 m (Input)</span>
                  <span className="text-[10px] text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-md font-mono">Native L2A</span>
                </div>
                <div
                  className="aspect-square rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#0F172A] relative group cursor-pointer"
                  onClick={() => onOpenLightbox(images.input_10m, 'Sentinel-2 10 m Input (Native L2A)')}
                >
                  <img src={images.input_10m} alt="10m Input" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-[#12355B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#475569] mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <span>Native satellite sensor pixels</span>
                <span className="font-mono text-[#0F172A] font-bold">10.0 m</span>
              </div>
            </div>

            {/* Card 2: Bicubic Baseline */}
            <div className="bg-white rounded-2xl p-4 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#12355B]">2. Bicubic 4× (Baseline)</span>
                  <span className="text-[10px] text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-md font-mono">Interpolated</span>
                </div>
                <div
                  className="aspect-square rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#0F172A] relative group cursor-pointer"
                  onClick={() => onOpenLightbox(images.bicubic_baseline, 'Bicubic 4× Baseline')}
                >
                  <img src={images.bicubic_baseline} alt="Bicubic Baseline" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-[#12355B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#475569] mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <span>Standard cubic interpolation</span>
                <span className="font-mono text-[#0F172A] font-bold">2.5 m grid</span>
              </div>
            </div>

            {/* Card 3: Super-Resolved Output */}
            <div className="bg-white rounded-2xl p-4 border border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-[0_2px_10px_rgba(37,99,235,0.12)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2563EB]">3. Super-Resolved 2.5 m (Ours)</span>
                  <span className="text-[10px] text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md font-mono font-bold">
                    16× Detail
                  </span>
                </div>
                <div
                  className="aspect-square rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#0F172A] relative group cursor-pointer"
                  onClick={() => onOpenLightbox(images.sr_2p5m, 'Super-Resolved 2.5 m (Ours)')}
                >
                  <img src={images.sr_2p5m} alt="SR 2.5m" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-[#12355B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#475569] mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <span>Multi-scale deep reconstitution</span>
                <a
                  href={images.sr_2p5m}
                  download="mosaic_sr_2p5m.png"
                  className="text-[#2563EB] hover:text-[#1D4ED8] font-bold flex items-center gap-1 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DIFFERENCE HEATMAP */}
      {subTab === 'difference' && hasDifference && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#12355B]">Side-by-Side Analytical Difference Heatmap</span>
              <p className="text-[#475569] text-[11px]">
                Color-coded pixel intensity deviation highlighting edge reconstruction and structure sharpness
              </p>
            </div>
            {downloads?.metrics_csv && (
              <a
                href={images.comparison}
                download="difference_comparison.png"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-2xs"
              >
                <Download className="h-3 w-3" />
                <span>Download Heatmap</span>
              </a>
            )}
          </div>

          <div
            className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-white cursor-pointer group relative"
            onClick={() => onOpenLightbox(images.comparison, 'Side-by-Side Analytical Difference Heatmap')}
          >
            <img src={images.comparison} alt="Difference Heatmap" className="w-full h-auto object-contain" />
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#12355B]/85 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-card">
              <Maximize2 className="h-3.5 w-3.5" /> Full Resolution
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
