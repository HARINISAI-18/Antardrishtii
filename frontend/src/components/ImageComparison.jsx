import React, { useState } from 'react';
import { Layers, ZoomIn, Grid3X3, Split, Download, Maximize2, X } from 'lucide-react';

export default function ImageComparison({ images, sceneInfo, disasterInfo }) {
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'atlas' | 'zoom' | 'disaster'
  const [modalImage, setModalImage] = useState(null);

  if (!images) return null;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden mt-8">
      {/* Header & Tabs */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Visual Analytics & Imagery Gallery</h3>
            <p className="text-xs text-slate-400">
              Inspection across 10 m input, 4× bicubic baseline, and 2.5 m super-resolved outputs
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison'
                ? 'bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            Comparison
          </button>

          <button
            onClick={() => setActiveTab('atlas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'atlas'
                ? 'bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            3×3 HR Atlas
          </button>

          <button
            onClick={() => setActiveTab('zoom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'zoom'
                ? 'bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Zoom Crops
          </button>

          {disasterInfo && (
            <button
              onClick={() => setActiveTab('disaster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'disaster'
                  ? 'bg-amber-500/20 text-amber-400 font-medium border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Disaster Assessment
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* Tab 1: Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 10 m Input */}
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Sentinel-2 10 m (Input)</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Native L2A</span>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-slate-800 aspect-square group cursor-pointer"
                  onClick={() => setModalImage({ src: images.input_10m, title: 'Sentinel-2 RGB 10 m Input' })}
                >
                  <img src={images.input_10m} alt="10m Input" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Bicubic ×4 Baseline */}
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Bicubic ×4 Baseline</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Standard Interpolation</span>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-slate-800 aspect-square group cursor-pointer"
                  onClick={() => setModalImage({ src: images.bicubic_baseline, title: 'Bicubic ×4 Baseline' })}
                >
                  <img src={images.bicubic_baseline} alt="Bicubic Baseline" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Super-Resolved 2.5 m (Ours) */}
              <div className="bg-brand-950/20 rounded-xl p-3 border border-brand-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-brand-400">Super-Resolved 2.5 m (Ours)</span>
                  <span className="text-[10px] text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded font-medium">
                    16× Finer Pixel Area
                  </span>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-brand-500/30 aspect-square group cursor-pointer"
                  onClick={() => setModalImage({ src: images.sr_2p5m, title: 'Super-Resolved 2.5 m (Ours)' })}
                >
                  <img src={images.sr_2p5m} alt="SR 2.5m" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side composite */}
            {images.comparison && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300">Combined Inspection Composite</span>
                  <a
                    href={images.comparison}
                    download="comparison_figure.png"
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Composite
                  </a>
                </div>
                <div
                  className="rounded-lg overflow-hidden border border-slate-800 cursor-pointer group relative"
                  onClick={() => setModalImage({ src: images.comparison, title: 'Comparison Figure' })}
                >
                  <img src={images.comparison} alt="Combined Comparison" className="w-full h-auto object-contain" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 3x3 HR Atlas */}
        {activeTab === 'atlas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>9 Remote Sensing Applications overlaid directly onto the 2.5 m High-Resolution true-colour image</span>
              <a
                href={images.atlas_3x3}
                download="app_atlas_hr.png"
                className="flex items-center gap-1.5 text-brand-400 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download 3×3 Atlas
              </a>
            </div>
            <div
              className="rounded-xl overflow-hidden border border-slate-800 cursor-pointer group relative bg-slate-900"
              onClick={() => setModalImage({ src: images.atlas_3x3, title: '3×3 HR Analysis Atlas' })}
            >
              <img src={images.atlas_3x3} alt="3x3 Atlas" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Zoom Validation Crops */}
        {activeTab === 'zoom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Center Zoom Validation Crops (Roofs & Buildings, Narrow Roads, Water Bodies)</span>
              <a
                href={images.zoom_strip}
                download="app_zoom_hr.png"
                className="flex items-center gap-1.5 text-brand-400 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download Zoom Strip
              </a>
            </div>
            <div
              className="rounded-xl overflow-hidden border border-slate-800 cursor-pointer group relative bg-slate-900"
              onClick={() => setModalImage({ src: images.zoom_strip, title: 'Zoom Validation Strip' })}
            >
              <img src={images.zoom_strip} alt="Zoom Strip" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Disaster Assessment */}
        {activeTab === 'disaster' && disasterInfo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pre vs Post Disaster Change Detection & Damage Footprint</span>
              <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                disasterInfo.status === 'CONFIRMED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                Status: {disasterInfo.status} (Change: {disasterInfo.change_km2} km², IoU: {disasterInfo.iou_vs_10m})
              </span>
            </div>
            {disasterInfo.disaster_image && (
              <div
                className="rounded-xl overflow-hidden border border-slate-800 cursor-pointer group relative bg-slate-900"
                onClick={() => setModalImage({ src: disasterInfo.disaster_image, title: 'Disaster Assessment' })}
              >
                <img src={disasterInfo.disaster_image} alt="Disaster Overview" className="w-full h-auto object-contain" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 text-white">
              <span className="font-semibold text-sm">{modalImage.title}</span>
              <button
                onClick={() => setModalImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border border-slate-800 flex items-center justify-center bg-slate-950">
              <img src={modalImage.src} alt={modalImage.title} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
