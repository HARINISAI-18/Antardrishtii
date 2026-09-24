import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

export default function HeadlinesBanner({ headlines, sceneInfo }) {
  if (!headlines || headlines.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mt-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
          <Award className="h-4 w-4" />
        </div>
        <h4 className="font-semibold text-slate-900 text-sm">Key Analytical Takeaways & Super-Resolution Gains</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {headlines.slice(0, 6).map((headline, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
          >
            <TrendingUp className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
            <span className="text-slate-800 leading-relaxed font-medium">{headline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
