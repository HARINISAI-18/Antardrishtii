import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, Satellite } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'STAC Ingestion', desc: 'Searching Planetary Computer Sentinel-2 L2A catalog' },
  { id: 2, name: 'Radiometric Calibration', desc: 'Reading B04, B03, B02, B08 & 2-98% percentile stretching' },
  { id: 3, name: '4× Super-Resolution', desc: 'Upscaling medium-res (10 m) to high-res (2.5 m) grid' },
  { id: 4, name: 'Geospatial Analytics', desc: 'Executing 9 specialized Computer Vision application models' },
  { id: 5, name: 'Analytics & Reporting', desc: 'Synthesizing geospatial analytics & performance metrics' },
];

export default function LoadingIndicator() {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => (prev < 5 ? prev + 1 : prev));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-8 border border-slate-200 shadow-xl my-8 text-center max-w-2xl mx-auto bg-white/95">
      <div className="relative inline-block mb-5">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto text-primary-900 shadow-sm">
          <Satellite className="h-8 w-8 animate-bounce text-primary-900" />
        </div>
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-primary-900 tracking-tight">Processing Geospatial Pipeline</h3>
      <p className="text-slate-500 text-sm mt-1 mb-8">
        Connecting with Sentinel-2 STAC and running full-resolution super-resolution models...
      </p>

      {/* Steps List */}
      <div className="space-y-3.5 text-left">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-accent-50/70 border-accent-400 shadow-md shadow-accent-500/10'
                  : isDone
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-accent-600" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-accent-600 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-primary-950 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-medium text-accent-700 bg-accent-100 px-2 py-0.5 rounded-full">
                      Running
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
