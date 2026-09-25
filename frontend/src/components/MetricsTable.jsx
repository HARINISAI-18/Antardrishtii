import React, { useState, useMemo } from 'react';
import { Table, ArrowUpRight, ArrowDownRight, Minus, Download, Search, Check } from 'lucide-react';

export default function MetricsTable({ metrics, initialCategory = 'All' }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  if (!metrics || metrics.length === 0) return null;

  const categories = useMemo(() => {
    return ['All', ...new Set(metrics.map((m) => m.Application))];
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter((m) => {
      const matchesCategory = selectedCategory === 'All' || m.Application === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        m.Metric.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.Application.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.Unit && m.Unit.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [metrics, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = metrics.length;
    const improved = metrics.filter(
      (m) =>
        (m.Better === '↑' && m.Delta > 0) ||
        (m.Better === '↓' && m.Delta < 0)
    ).length;
    return { total, improved };
  }, [metrics]);

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
    a.download = 'antardrishtii_metrics_26_benchmarks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <Table className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">26 Quantitative Remote Sensing Metrics</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  {stats.improved}/{stats.total} Improved vs 10 m
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct pixel-level evaluation comparing Sentinel-2 10 m baseline against 2.5 m super-resolved outputs
              </p>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
            <span>{copied ? 'CSV Exported' : 'Export Full CSV'}</span>
          </button>
        </div>

        {/* Search input + Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by metric, application, or unit..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs text-slate-600">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap text-[11px] font-medium ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-600 font-medium border-b border-slate-200 uppercase tracking-wider text-[10px] z-10">
            <tr>
              <th className="py-2.5 px-3.5 bg-slate-50">Application</th>
              <th className="py-2.5 px-3.5 bg-slate-50">Metric Name</th>
              <th className="py-2.5 px-3.5 bg-slate-50 font-mono">10 m Baseline</th>
              <th className="py-2.5 px-3.5 bg-slate-50 font-mono">SR 2.5 m (Ours)</th>
              <th className="py-2.5 px-3.5 bg-slate-50 font-mono">Delta (Δ)</th>
              <th className="py-2.5 px-3.5 bg-slate-50 font-mono">Change (%)</th>
              <th className="py-2.5 px-3.5 bg-slate-50">Unit</th>
              <th className="py-2.5 px-3.5 bg-slate-50 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMetrics.length > 0 ? (
              filteredMetrics.map((row, idx) => {
                const isGain =
                  (row.Better === '↑' && row.Delta > 0) ||
                  (row.Better === '↓' && row.Delta < 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-medium text-slate-900">
                      {row.Application}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-sans">
                      {row.Metric}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">
                      {row['10 m'] !== undefined ? row['10 m'] : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                      {row['SR 2.5 m'] !== undefined ? row['SR 2.5 m'] : '—'}
                    </td>
                    <td className={`py-2.5 px-3.5 font-mono font-medium ${isGain ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {row.Delta > 0 ? `+${row.Delta}` : row.Delta}
                    </td>
                    <td className={`py-2.5 px-3.5 font-mono font-medium ${isGain ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {row.Pct_Change !== 0 ? `${row.Pct_Change > 0 ? '+' : ''}${row.Pct_Change}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                      {row.Unit}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {row.Better === '↑' ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold" title="Higher is better">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      ) : row.Better === '↓' ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold" title="Lower is better">
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
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No metrics match your search "{searchQuery}" in category "{selectedCategory}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
