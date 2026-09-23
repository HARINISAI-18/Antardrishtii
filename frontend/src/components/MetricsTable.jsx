import React, { useState } from 'react';
import { Table, ArrowUpRight, ArrowDownRight, Minus, Download, Filter } from 'lucide-react';

export default function MetricsTable({ metrics }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!metrics || metrics.length === 0) return null;

  const categories = ['All', ...new Set(metrics.map((m) => m.Application))];

  const filteredMetrics =
    selectedCategory === 'All'
      ? metrics
      : metrics.filter((m) => m.Application === selectedCategory);

  const downloadCSV = () => {
    const headers = ['Application', 'Metric', '10 m', 'SR 2.5 m', 'Delta', 'Pct_Change', 'Unit', 'Better'];
    const csvRows = [
      headers.join(','),
      ...metrics.map((m) =>
        [
          `"${m.Application}"`,
          `"${m.Metric}"`,
          m['10 m'],
          m['SR 2.5 m'],
          m.Delta,
          m.Pct_Change,
          `"${m.Unit}"`,
          `"${m.Better}"`
        ].join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'srm_application_metrics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden mt-8">
      {/* Table Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-50 text-primary-900">
            <Table className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-primary-900">Quantitative Performance Metrics</h3>
            <p className="text-xs text-slate-500">
              Direct comparison between Sentinel-2 10 m input baseline and 2.5 m Super-Resolved imagery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-white text-slate-800">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Download CSV */}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-950 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Application</th>
              <th className="py-3 px-4">Metric</th>
              <th className="py-3 px-4">10 m Baseline</th>
              <th className="py-3 px-4">SR 2.5 m (Ours)</th>
              <th className="py-3 px-4">Delta (Δ)</th>
              <th className="py-3 px-4">Change (%)</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredMetrics.map((row, idx) => {
              const isGain =
                (row.Better === '↑' && row.Delta > 0) ||
                (row.Better === '↓' && row.Delta < 0);

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 transition-colors font-sans"
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {row.Application}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {row.Metric}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {row['10 m'] !== undefined ? row['10 m'] : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary-900">
                    {row['SR 2.5 m'] !== undefined ? row['SR 2.5 m'] : '—'}
                  </td>
                  <td className={`py-3 px-4 font-mono font-semibold ${isGain ? 'text-accent-700' : 'text-slate-500'}`}>
                    {row.Delta > 0 ? `+${row.Delta}` : row.Delta}
                  </td>
                  <td className={`py-3 px-4 font-mono font-semibold ${isGain ? 'text-accent-700' : 'text-slate-500'}`}>
                    {row.Pct_Change !== 0 ? `${row.Pct_Change > 0 ? '+' : ''}${row.Pct_Change}%` : '—'}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">
                    {row.Unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.Better === '↑' ? (
                      <span className="inline-flex items-center text-accent-600 font-bold">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    ) : row.Better === '↓' ? (
                      <span className="inline-flex items-center text-primary-700 font-bold">
                        <ArrowDownRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-400">
                        <Minus className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
