import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Download,
  Copy,
  Check,
  MapPin,
  Building2,
  ExternalLink,
  Info,
  Maximize2
} from 'lucide-react';

export default function ViolationsTab({
  results,
  onFlyToCoords,
  onOpenLightbox
}) {
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolationIndex, setSelectedViolationIndex] = useState(0);
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!results) return null;

  const { urban_analysis, downloads, images } = results;

  if (!urban_analysis) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-500 text-xs">
        No urban analysis data available for this scene.
      </div>
    );
  }

  const violations = urban_analysis.violations_sample || [];
  const totalViolations = urban_analysis.regulatory_violations || 0;
  const highRisk = urban_analysis.high_risk_violations || 0;
  const mediumRisk = Math.max(0, totalViolations - highRisk);

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const matchesRisk = filterRisk === 'ALL' || v.risk_level === filterRisk;
      const matchesSearch =
        searchQuery.trim() === '' ||
        v.building_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.structure_type?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRisk && matchesSearch;
    });
  }, [violations, filterRisk, searchQuery]);

  const activeViolation = filteredViolations[selectedViolationIndex] || filteredViolations[0] || null;

  const handleCopyGPS = (gps) => {
    if (!gps || !gps.length) return;
    navigator.clipboard.writeText(`${gps[0]}, ${gps[1]}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleCenterOnMap = (gps) => {
    if (!gps || gps.length < 2 || !onFlyToCoords) return;
    onFlyToCoords(gps[0], gps[1]);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* 1. Status & Summary Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Waterbody Buffer Encroachment & Compliance Audit
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200 rounded">
                  {totalViolations} Detected Encroachments
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Spatial buffer analysis based on 50-meter statutory waterbody conservation setback zones
              </p>
            </div>
          </div>

          {downloads?.compliance_violations_geojson && (
            <a
              href={downloads.compliance_violations_geojson}
              download="compliance_violations.geojson"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Violations GeoJSON</span>
            </a>
          )}
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Total Encroachments</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{totalViolations}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Identified Structures</div>
          </div>

          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
            <div className="text-[11px] text-rose-700 font-medium">High Risk (Critical Buffer)</div>
            <div className="text-xl font-bold font-mono text-rose-800 mt-0.5">{highRisk}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">&gt; 50% Footprint within Setback</div>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
            <div className="text-[11px] text-amber-700 font-medium">Medium Risk (Perimeter)</div>
            <div className="text-xl font-bold font-mono text-amber-800 mt-0.5">{mediumRisk}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Partial Boundary Overlap</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500">Buffer Rule Distance</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">50 m</div>
            <div className="text-[10px] text-slate-500 mt-0.5">NDWI Lake & River Corridors</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Audit Map Preview (if available) */}
      {images?.urban_audit_map && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">Spatial Compliance Multi-Panel Verification</span>
            <button
              onClick={() => onOpenLightbox && onOpenLightbox(images.urban_audit_map, 'Spatial Compliance Audit')}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px]"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Full Size
            </button>
          </div>
          <div
            className="rounded-lg overflow-hidden border border-slate-200 bg-white cursor-pointer"
            onClick={() => onOpenLightbox && onOpenLightbox(images.urban_audit_map, 'Spatial Compliance Audit')}
          >
            <img src={images.urban_audit_map} alt="Spatial Audit Map" className="w-full h-auto object-contain max-h-[40vh]" />
          </div>
        </div>
      )}

      {/* 3. Master Detail Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Filterable List of Encroachments */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span>Encroachment Records</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {filteredViolations.length} records
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'HIGH', 'MEDIUM'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => {
                    setFilterRisk(risk);
                    setSelectedViolationIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    filterRisk === risk
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Building ID or structure type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedViolationIndex(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Violations Table */}
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto rounded-lg border border-slate-100">
            <table className="w-full text-[11px] text-slate-700">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 text-left font-medium">
                <tr>
                  <th className="py-2 px-2.5">Structure ID</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Risk</th>
                  <th className="py-2 px-2.5">Footprint</th>
                  <th className="py-2 px-2.5">Encroached</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredViolations.map((v, i) => {
                  const isSelected = activeViolation && activeViolation.building_id === v.building_id;

                  return (
                    <tr
                      key={v.building_id || i}
                      onClick={() => setSelectedViolationIndex(i)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white font-medium'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <td className="py-2 px-2.5 font-bold font-mono">
                        {v.building_id}
                      </td>
                      <td className="py-2 px-2.5 font-sans truncate max-w-[120px]">
                        {v.structure_type}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            v.risk_level === 'HIGH'
                              ? isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                              : isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {v.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">{v.total_area_sqm} m²</td>
                      <td className={`py-2 px-2.5 font-semibold ${isSelected ? 'text-rose-300' : 'text-rose-700'}`}>
                        {v.encroached_area_sqm} m²
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detailed Telemetry Inspector for Selected Structure */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-700" />
              <span className="text-xs font-semibold text-slate-900">Structure Telemetry Inspector</span>
            </div>
            {activeViolation && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeViolation.risk_level === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {activeViolation.risk_level} RISK
              </span>
            )}
          </div>

          {activeViolation ? (
            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Unique Footprint ID</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">{activeViolation.building_id}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Structure Classification</span>
                  <span className="text-slate-800 font-medium">{activeViolation.structure_type}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Statutory Zone</span>
                  <span className="text-slate-800 font-medium">50 m Lake / Wetland Buffer</span>
                </div>
              </div>

              {/* Area Comparison */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Total Footprint</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {activeViolation.total_area_sqm} m²
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">100% Geometry</div>
                </div>

                <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50">
                  <div className="text-[10px] text-rose-700 uppercase font-mono">Encroached Area</div>
                  <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
                    {activeViolation.encroached_area_sqm} m²
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    {Math.round((activeViolation.encroached_area_sqm / (activeViolation.total_area_sqm || 1)) * 100)}% inside buffer
                  </div>
                </div>
              </div>

              {/* Centroid GPS Coordinates */}
              {activeViolation.centroid_gps && activeViolation.centroid_gps.length >= 2 && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-600" />
                    <span>Centroid GPS Coordinates (WGS84)</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-900 bg-white p-2 rounded border border-slate-200">
                    Lat: {activeViolation.centroid_gps[0].toFixed(5)}, Lon: {activeViolation.centroid_gps[1].toFixed(5)}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopyGPS(activeViolation.centroid_gps)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs transition-colors"
                      title="Copy GPS coordinates to clipboard"
                    >
                      {copiedCoords ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCoords ? 'Copied' : 'Copy GPS'}</span>
                    </button>

                    {onFlyToCoords && (
                      <button
                        onClick={() => handleCenterOnMap(activeViolation.centroid_gps)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs"
                        title="Fly map view to center directly on this structure"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Center on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Regulatory Reference Note */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-tight">
                  Structures identified within 50m of natural drainage corridors require municipal verification under the Wetlands Conservation and Management Rules.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select an encroachment record to view its spatial telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
