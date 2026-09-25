import React, { useState } from 'react';
import { Layers, Split, Download, Maximize2, X } from 'lucide-react';

export default function ImageComparison({ images, sceneInfo, disasterInfo }) {
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'disaster'
  const [modalImage, setModalImage] = useState(null);

  if (!images) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Header & Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Visual Analytics Gallery</h3>
            <p className="text-xs text-slate-500">
              Side-by-side verification: 10 m input, 4× bicubic interpolation, and 2.5 m super-resolved result
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs gap-0.5">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeTab === 'comparison'
                ? 'bg-white text-slate-900 font-medium shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            <span>Comparison</span>
          </button>

          {disasterInfo && (
            <button
              onClick={() => setActiveTab('disaster')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === 'disaster'
                  ? 'bg-white text-slate-900 font-medium shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Disaster Assessment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-5">
        {/* Tab 1: Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 10 m Input */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">1. Sentinel-2 10 m (Input)</span>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                    Native L2A
                  </span>
                </div>
                <div
                  className="relative rounded-md overflow-hidden border border-slate-200 aspect-square group cursor-pointer bg-slate-900"
                  onClick={() => setModalImage({ src: images.input_10m, title: 'Sentinel-2 RGB 10 m Input' })}
                >
                  <img src={images.input_10m} alt="10m Input" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Bicubic ×4 Baseline */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">2. Bicubic 4× (Baseline)</span>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                    Interpolation
                  </span>
                </div>
                <div
                  className="relative rounded-md overflow-hidden border border-slate-200 aspect-square group cursor-pointer bg-slate-900"
                  onClick={() => setModalImage({ src: images.bicubic_baseline, title: 'Bicubic 4× Baseline' })}
                >
                  <img src={images.bicubic_baseline} alt="Bicubic Baseline" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Super-Resolved 2.5 m (Ours) */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900">3. Super-Resolved 2.5 m (Ours)</span>
                  <span className="text-[10px] text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium">
                    16× Area Detail
                  </span>
                </div>
                <div
                  className="relative rounded-md overflow-hidden border border-slate-200 aspect-square group cursor-pointer bg-slate-900"
                  onClick={() => setModalImage({ src: images.sr_2p5m, title: 'Super-Resolved 2.5 m' })}
                >
                  <img src={images.sr_2p5m} alt="Super-Resolved 2.5m" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Composite Comparison Image */}
            {images.comparison && (
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2.5 text-xs">
                  <span className="font-medium text-slate-800">Analytical Difference Comparison Heatmap</span>
                  <a
                    href={images.comparison}
                    download="comparison_heatmap.png"
                    className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> <span>Download Figure</span>
                  </a>
                </div>
                <img
                  src={images.comparison}
                  alt="Comparison Figure"
                  className="w-full h-auto rounded border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Disaster Assessment */}
        {activeTab === 'disaster' && disasterInfo && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800">Assessed Disaster Event: </span>
                <span className="text-slate-600">{disasterInfo.event || 'Regional Analysis'}</span>
              </div>
              <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Impact Area: {disasterInfo.change_km2 || '0'} km²
              </span>
            </div>
            {disasterInfo.disaster_image && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <img src={disasterInfo.disaster_image} alt="Disaster Assessment" className="w-full h-auto object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Lightbox */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl p-3 border border-slate-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <span className="text-xs font-semibold text-slate-900">{modalImage.title}</span>
              <button onClick={() => setModalImage(null)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <img src={modalImage.src} alt={modalImage.title} className="max-h-[75vh] w-auto mx-auto object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
