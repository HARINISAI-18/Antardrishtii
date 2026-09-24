import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Satellite } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'STAC Catalog Query', desc: 'Querying Planetary Computer Sentinel-2 L2A archive' },
  { id: 2, name: 'Radiometric Calibration', desc: 'Calibrating B04, B03, B02, B08 reflectance with 2-98% stretching' },
  { id: 3, name: '4× Super-Resolution', desc: 'Upscaling 10 m native pixels to 2.5 m resolution grid' },
  { id: 4, name: 'Geospatial Analytics', desc: 'Executing 9 Remote Sensing Computer Vision models' },
  { id: 5, name: 'Synthesis & Reporting', desc: 'Compiling quantitative metrics and compliance exports' },
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
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm my-6 text-center max-w-xl mx-auto">
      <div className="inline-block mb-3">
        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-800">
          <Satellite className="h-6 w-6 text-slate-700" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight">Processing Geospatial Pipeline</h3>
      <p className="text-slate-500 text-xs mt-0.5 mb-6">
        Ingesting Sentinel-2 tiles and executing super-resolution reconstitutions...
      </p>

      {/* Steps List */}
      <div className="space-y-2.5 text-left">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-slate-50 border-slate-400 text-slate-900'
                  : isDone
                  ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-slate-800 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isCurrent ? 'text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
