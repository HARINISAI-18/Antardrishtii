import React from 'react';
import { Award, TrendingUp, CheckCircle } from 'lucide-react';

export default function HeadlinesBanner({ headlines, sceneInfo }) {
  if (!headlines || headlines.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl border border-brand-500/30 p-5 mt-6 shadow-xl bg-gradient-to-r from-brand-950/40 via-slate-900/40 to-emerald-950/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
          <Award className="h-4 w-4" />
        </div>
        <h4 className="font-semibold text-white text-sm">Key Analytical Takeaways & Super-Resolution Gains</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {headlines.slice(0, 6).map((headline, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
          >
            <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-slate-300 leading-relaxed font-medium">{headline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
