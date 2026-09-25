import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, SlidersHorizontal, Maximize2, Compass } from 'lucide-react';

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Sentinel-2 10 m (Input L2A)',
  afterLabel = 'Super-Resolved 2.5 m (Ours)',
  sceneId
}) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  const handleSliderMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    []
  );

  const handleMouseDownSlider = (e) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleTouchStartSlider = (e) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
  };

  const handleMouseDownPan = (e) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      } else if (isPanning && zoom > 1) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    const handleTouchMove = (e) => {
      if (isDraggingSlider && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    if (isDraggingSlider || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSlider, isPanning, handleSliderMove, panStart, zoom]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  };

  const setZoomLevel = (level) => {
    setZoom(level);
    if (level === 1) setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom((z) => Math.min(4, z + 0.5));
  const zoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, z - 0.5);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Toolbar: Presets & Controls */}
      <div className="flex flex-wrap items-center justify-between px-1 text-xs gap-2">
        <div className="flex items-center gap-2">
          {/* Zoom Presets */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                zoom === 1 ? 'bg-white text-blue-700 shadow-2xs border border-blue-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100% Fit
            </button>
            <button
              onClick={() => setZoomLevel(2)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                zoom === 2 ? 'bg-white text-blue-700 shadow-2xs border border-blue-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              200% Tile
            </button>
            <button
              onClick={() => setZoomLevel(4)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                zoom === 4 ? 'bg-white text-blue-700 shadow-2xs border border-blue-200/60' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              400% Edges
            </button>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5 shadow-2xs">
            <button
              onClick={zoomOut}
              disabled={zoom <= 1}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-800 px-1 font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 4}
              className="p-1 rounded text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded text-slate-600 hover:text-slate-900 transition-colors ml-0.5"
              title="Reset View"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {afterImage && (
            <a
              href={afterImage}
              download={`SR_2p5m_${sceneId || 'enhanced'}.png`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download 2.5 m PNG</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Split Slider Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownPan}
        className={`relative w-full aspect-square max-h-[66vh] rounded-xl overflow-hidden border border-slate-300 select-none bg-slate-900 shadow-sm gis-reticle-frame ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        {/* Transform Wrapper for Zoom & Pan */}
        <div
          className="w-full h-full relative origin-center transition-transform duration-75 ease-out"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
          }}
        >
          {/* Base Layer: AFTER (Super-Resolved 2.5 m) */}
          <img
            src={afterImage}
            alt="Super-Resolved 2.5m"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Top Layer: BEFORE (Sentinel-2 10 m), clipped to slider position */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
            }}
          >
            <img
              src={beforeImage}
              alt="Sentinel-2 10m"
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Vertical Divider Line & Draggable Handle */}
        <div
          className="split-slider-divider"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDownSlider}
          onTouchStart={handleTouchStartSlider}
        >
          <div className="split-slider-handle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m8 7-5 5 5 5" />
              <path d="m16 7 5 5-5 5" />
            </svg>
          </div>
        </div>

        {/* Floating Labels with High-Precision Stamps */}
        <div className="absolute top-3 left-4 z-20 pointer-events-none">
          <span className="bg-slate-900/90 text-white px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700/80 shadow-sm backdrop-blur-sm">
            {beforeLabel}
          </span>
        </div>

        <div className="absolute top-3 right-4 z-20 pointer-events-none">
          <span className="bg-slate-900/90 text-white px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-700/80 shadow-sm backdrop-blur-sm">
            {afterLabel}
          </span>
        </div>
      </div>

      {/* Cartographic Ground Metric Scale Bar */}
      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-slate-800">Ground Metric Scale:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-20 bg-slate-900 border-x-2 border-blue-600 relative rounded-2xs overflow-visible">
              <span className="absolute -top-3.5 left-0 text-[9px] text-slate-500 font-mono">0m</span>
              <span className="absolute -top-3.5 right-0 text-[9px] text-blue-700 font-semibold font-mono">160m</span>
              {/* Midpoint 80m marker */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400" />
            </div>
            <span className="text-[10px] text-slate-500 ml-1">(@ 2.5m/px)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>Pitch: <strong className="text-blue-700 font-semibold">2.50 m</strong></span>
          <span className="text-slate-300">|</span>
          <span>Divider: <strong className="text-slate-900">{Math.round(sliderPos)}%</strong></span>
        </div>
      </div>
    </div>
  );
}
