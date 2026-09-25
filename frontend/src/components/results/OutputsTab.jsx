import React from 'react';
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileCode,
  FileText,
  Image as ImageIcon,
  MapPin,
  Maximize2
} from 'lucide-react';

export default function OutputsTab({ results, onOpenLightbox, subOption }) {
  if (!results) return null;

  const { images, downloads, disaster_assessment, scene_info } = results;

  // Build complete list of available output assets
  const assets = [
    {
      id: 'sr_image',
      title: 'Super-Resolved 2.5 m Imagery (PNG)',
      category: 'Optical Raster',
      description: '4× resolution magnification with structural edge and texture synthesis.',
      image: images?.sr_2p5m,
      downloadUrl: downloads?.sr_image || images?.sr_2p5m,
      filename: `SR_2p5m_${scene_info?.id || 'tile'}.png`,
      type: 'image'
    },
    {
      id: 'sr_geotiff',
      title: 'Super-Resolved 2.5 m GeoTIFF',
      category: 'Georeferenced GIS Raster',
      description: 'Complete GIS georeferenced GeoTIFF ready for QGIS, ArcGIS, and GDAL.',
      downloadUrl: downloads?.sr_geotiff_2p5m,
      filename: `sr_georef_2p5m_${scene_info?.id || 'tile'}.tif`,
      type: 'geotiff'
    },
    {
      id: 'input_10m',
      title: 'Sentinel-2 10 m Input (Native L2A)',
      category: 'Optical Raster',
      description: 'Original radiometrically calibrated Sentinel-2 RGB baseline.',
      image: images?.input_10m,
      downloadUrl: images?.input_10m,
      filename: `Sentinel2_10m_${scene_info?.id || 'tile'}.png`,
      type: 'image'
    },
    {
      id: 'bicubic_baseline',
      title: 'Bicubic 4× Baseline Comparison',
      category: 'Optical Raster',
      description: 'Standard bicubic interpolation baseline used for statistical benchmarking.',
      image: images?.bicubic_baseline,
      downloadUrl: images?.bicubic_baseline,
      filename: `Bicubic_4x_${scene_info?.id || 'tile'}.png`,
      type: 'image'
    },
    {
      id: 'comparison_figure',
      title: 'Difference Comparison Heatmap',
      category: 'Analytical Map',
      description: 'Pixel intensity difference composite evaluating edge gain.',
      image: images?.comparison,
      downloadUrl: images?.comparison,
      filename: `comparison_composite_${scene_info?.id || 'tile'}.png`,
      type: 'image'
    },
    {
      id: 'crop_ndvi_map',
      title: 'Sentinel-2 NDVI Spectral Map',
      category: 'Spectral Index',
      description: 'Calibrated NDVI raster calculated from Sentinel-2 B04 & B08 reflectance.',
      image: images?.crop_ndvi_map,
      downloadUrl: downloads?.crop_ndvi_map || images?.crop_ndvi_map,
      filename: 'crop_ndvi_spectral_map.png',
      type: 'image'
    },
    {
      id: 'crop_health_map',
      title: 'Crop Condition Health Map',
      category: 'Agricultural Map',
      description: '5-Class vegetation condition classification raster.',
      image: images?.crop_health_map,
      downloadUrl: downloads?.crop_health_map || images?.crop_health_map,
      filename: 'crop_health_condition_map.png',
      type: 'image'
    },
    {
      id: 'crop_comparison',
      title: 'RFMSR + NDVI Comparison Panel',
      category: 'Agricultural Map',
      description: 'Dual-panel visualization comparing optical detail and vegetative vigour.',
      image: images?.crop_comparison,
      downloadUrl: downloads?.crop_comparison || images?.crop_comparison,
      filename: 'crop_monitoring_comparison.png',
      type: 'image'
    },
    {
      id: 'urban_audit_map',
      title: 'Comprehensive Spatial Compliance Audit',
      category: 'Urban Planning',
      description: '3-panel spatial audit displaying footprints, buffers, and violations.',
      image: images?.urban_audit_map,
      downloadUrl: downloads?.urban_audit_map || images?.urban_audit_map,
      filename: 'spatial_compliance_audit.png',
      type: 'image'
    },
    {
      id: 'urban_road_panels',
      title: 'Road Network Detection Panels',
      category: 'Infrastructure',
      description: 'Frangi vesselness filter, Hough transforms, and skeletonized road corridors.',
      image: images?.urban_road_panels,
      downloadUrl: downloads?.urban_road_panels || images?.urban_road_panels,
      filename: 'road_detection_panels.png',
      type: 'image'
    },
    {
      id: 'urban_road_overlay',
      title: 'Road Network Satellite Overlay',
      category: 'Infrastructure',
      description: 'Extracted narrow roads and corridors overlaid on the 2.5 m imagery.',
      image: images?.urban_road_overlay,
      downloadUrl: downloads?.urban_road_overlay || images?.urban_road_overlay,
      filename: 'road_overlay_satellite.png',
      type: 'image'
    },
    {
      id: 'disaster_map',
      title: 'Disaster Inundation & Change Map',
      category: 'Disaster Assessment',
      description: 'Pre vs post differential mapping for flood and cyclone damage footprints.',
      image: disaster_assessment?.disaster_image,
      downloadUrl: disaster_assessment?.disaster_image,
      filename: 'disaster_inundation_change_map.png',
      type: 'image',
      condition: Boolean(disaster_assessment?.disaster_image)
    },
    {
      id: 'building_geojson',
      title: 'Building Footprints (GeoJSON)',
      category: 'Vector Dataset',
      description: 'Extracted building footprint polygons with metric area calculations.',
      downloadUrl: downloads?.building_footprints_geojson,
      filename: 'building_footprints.geojson',
      type: 'geojson'
    },
    {
      id: 'violations_geojson',
      title: 'Compliance Violations (GeoJSON)',
      category: 'Vector Dataset',
      description: 'Geo-tagged regulatory encroachments within waterbody buffer corridors.',
      downloadUrl: downloads?.compliance_violations_geojson,
      filename: 'compliance_violations.geojson',
      type: 'geojson'
    },
    {
      id: 'metrics_csv',
      title: 'Remote Sensing Quantitative Metrics (CSV)',
      category: 'Tabular Data',
      description: 'Comprehensive table of 26 Computer Vision application metrics.',
      downloadUrl: downloads?.metrics_csv,
      filename: 'srm_application_metrics.csv',
      type: 'csv'
    },
    {
      id: 'crop_json',
      title: 'Crop Analytical Report (JSON)',
      category: 'Structured Data',
      description: 'Quantitative NDVI distributions, area metrics, and stress percentages.',
      downloadUrl: downloads?.crop_json,
      filename: 'crop_monitoring.json',
      type: 'json'
    },
    {
      id: 'urban_json',
      title: 'Urban Compliance Report (JSON)',
      category: 'Structured Data',
      description: 'Building counts, road segment statistics, and violation records.',
      downloadUrl: downloads?.urban_json,
      filename: 'urban_analysis.json',
      type: 'json'
    }
  ].filter((a) => a.condition !== false && (a.image || a.downloadUrl));

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#12355B]">Generated Visual Assets & GIS Exports</h3>
          <p className="text-xs text-[#475569]">
            {assets.length} production assets produced during this super-resolution and analytical run
          </p>
        </div>

        {downloads?.sr_image && (
          <a
            href={downloads.sr_image}
            download="mosaic_sr_2p5m.png"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Super-Resolved Tile (2.5 m)</span>
          </a>
        )}
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {assets.map((asset) => {
          const hasImage = Boolean(asset.image);

          return (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-[#CBD5E1] shadow-[0_2px_10px_rgba(18,53,91,0.06)] overflow-hidden flex flex-col justify-between hover:border-[#2563EB] transition-colors"
            >
              <div>
                {/* Thumbnail / Header */}
                {hasImage ? (
                  <div
                    className="aspect-video w-full bg-[#0F172A] overflow-hidden relative group cursor-pointer border-b border-[#E2E8F0]"
                    onClick={() => onOpenLightbox(asset.image, asset.title)}
                  >
                    <img
                      src={asset.image}
                      alt={asset.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-[#12355B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-[#12355B] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-card">
                        <Eye className="h-3.5 w-3.5 text-[#2563EB]" /> Inspect
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F7FAFC] border-b border-[#E2E8F0] flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#2563EB] shadow-2xs shrink-0">
                      {asset.type === 'csv' && <FileSpreadsheet className="h-4 w-4" />}
                      {asset.type === 'json' && <FileCode className="h-4 w-4" />}
                      {asset.type === 'geojson' && <MapPin className="h-4 w-4" />}
                      {asset.type === 'geotiff' && <ImageIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#12355B]">
                        {asset.category}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-[#12355B] truncate" title={asset.title}>
                      {asset.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#475569] line-clamp-2 leading-relaxed">
                    {asset.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-3.5 py-2.5 bg-[#F7FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                {hasImage ? (
                  <button
                    onClick={() => onOpenLightbox(asset.image, asset.title)}
                    className="text-[#475569] hover:text-[#2563EB] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#0F9D9A]" />
                    <span>View</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-[#94A3B8] font-mono">
                    {asset.filename.split('.').pop()?.toUpperCase()}
                  </span>
                )}

                {asset.downloadUrl ? (
                  <a
                    href={asset.downloadUrl}
                    download={asset.filename}
                    className="px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-[#94A3B8]">Available</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
