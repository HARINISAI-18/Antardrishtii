import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Sentinel-2 10 m (Input)',
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

  // Pan handlers when zoomed
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
      {/* Top Toolbar: Zoom & Reset */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <SlidersHorizontal className="h-4 w-4 text-accent-600" />
          <span>Drag the teal center divider to reveal 4× detail</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            <button
              onClick={zoomOut}
              disabled={zoom <= 1}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-700 px-1.5 font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 4}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 transition-colors ml-1"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {afterImage && (
            <a
              href={afterImage}
              download={`SR_2p5m_${sceneId || 'enhanced'}.png`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-950 text-white font-semibold transition-all shadow-md shadow-primary-900/20"
            >
              <Download className="h-3.5 w-3.5" />
              Download Enhanced SR (2.5 m)
            </a>
          )}
        </div>
      </div>

      {/* Main Split Slider Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownPan}
        className={`relative w-full aspect-square max-h-[68vh] rounded-2xl overflow-hidden border border-slate-200 select-none bg-slate-100 shadow-xl ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m8 7-5 5 5 5" />
              <path d="m16 7 5 5-5 5" />
            </svg>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="glass-panel px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200/90 shadow-md bg-white/95">
            {beforeLabel}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <span className="glass-panel px-3 py-1 rounded-lg text-xs font-semibold text-accent-700 border border-accent-300 shadow-md bg-white/95 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {afterLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
