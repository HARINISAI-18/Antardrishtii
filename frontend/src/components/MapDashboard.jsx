import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair } from 'lucide-react';

const BASEMAPS = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community',
    maxZoom: 19
  },
  streets: {
    name: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

export default function MapDashboard({
  latitude,
  longitude,
  aoiKm,
  onCoordinatesChange,
  triggerFlyTo,
  isVisible = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const aoiRectRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState('satellite');
  const [zoomLevel, setZoomLevel] = useState(13);

  // Calculate square bounding box matching backend N_PX calculation
  const getAoiBounds = (lat, lon, km) => {
    const nPx = Math.max(512, Math.min(2048, Math.round((km * 1000) / 10 / 512) * 512));
    const halfDeg = (nPx * 10.0) / 2.0 / 111320.0;
    return [
      [lat - halfDeg, lon - halfDeg],
      [lat + halfDeg, lon + halfDeg]
    ];
  };

  // Clean, professional GIS pin icon with Geospatial Teal #0F9D9A and Deep Navy #12355B
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="transform: translate(-50%, -100%); cursor: grab;">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.26801 0 0 6.26801 0 14C0 23.5 14 36 14 36C14 36 28 23.5 28 14C28 6.26801 21.732 0 14 0Z" fill="#12355B" stroke="#ffffff" stroke-width="2"/>
            <circle cx="14" cy="14" r="5" fill="#0F9D9A"/>
            <circle cx="14" cy="14" r="2" fill="#ffffff"/>
          </svg>
        </div>
      `,
      iconSize: [28, 36],
      iconAnchor: [14, 36]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: true
    });

    // Position Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Tile Layer
    const baseConfig = BASEMAPS[activeBasemap] || BASEMAPS.satellite;
    tileLayerRef.current = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: baseConfig.maxZoom
    }).addTo(map);

    // Draggable Marker
    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: createPinIcon()
    }).addTo(map);

    marker.on('drag', (e) => {
      const { lat, lng } = e.target.getLatLng();
      if (aoiRectRef.current) {
        aoiRectRef.current.setBounds(getAoiBounds(lat, lng, aoiKm));
      }
    });

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      onCoordinatesChange(parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5)));
    });

    // Map Click to target
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      if (aoiRectRef.current) {
        aoiRectRef.current.setBounds(getAoiBounds(lat, lng, aoiKm));
      }
      onCoordinatesChange(parseFloat(lat.toFixed(5)), parseFloat(lng.toFixed(5)));
    });

    // Track zoom level
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // AOI Bounding Box Overlay (Geospatial Teal #0F9D9A, clean dashed outline)
    const bounds = getAoiBounds(latitude, longitude, aoiKm);
    const rect = L.rectangle(bounds, {
      color: '#0F9D9A',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#0F9D9A',
      fillOpacity: 0.12
    }).addTo(map);

    aoiRectRef.current = rect;
    markerRef.current = marker;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const baseConfig = BASEMAPS[activeBasemap];
    tileLayerRef.current = L.tileLayer(baseConfig.url, {
      attribution: baseConfig.attribution,
      maxZoom: baseConfig.maxZoom
    }).addTo(mapInstanceRef.current);
  }, [activeBasemap]);

  // Update Marker & AOI position when coordinates or AOI change externally
  useEffect(() => {
    if (!markerRef.current || !aoiRectRef.current) return;
    const currentLatLng = markerRef.current.getLatLng();
    if (
      Math.abs(currentLatLng.lat - latitude) > 0.0001 ||
      Math.abs(currentLatLng.lng - longitude) > 0.0001
    ) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    const newBounds = getAoiBounds(latitude, longitude, aoiKm);
    aoiRectRef.current.setBounds(newBounds);
  }, [latitude, longitude, aoiKm]);

  // Fly to location when triggered
  useEffect(() => {
    if (!mapInstanceRef.current || !triggerFlyTo) return;
    mapInstanceRef.current.flyTo([latitude, longitude], 13, {
      duration: 1.4,
      easeLinearity: 0.25
    });
  }, [triggerFlyTo]);

  // Recalculate size when switching views
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
    }
  }, [isVisible]);

  // Recenter button
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latitude, longitude], 13);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Layer Switcher & Recenter Overlay (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="bg-white rounded-xl p-1 flex items-center gap-1 shadow-card border border-[#E2E8F0]">
          {Object.entries(BASEMAPS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveBasemap(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeBasemap === key
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#12355B] hover:bg-[#F1F5F9]'
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleRecenter}
          className="bg-white p-2 rounded-xl text-[#12355B] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-colors shadow-card"
          title="Recenter map on pin"
        >
          <Crosshair className="h-4 w-4 text-[#0F9D9A]" />
        </button>
      </div>

      {/* Real-time Coordinate Status Bar (Bottom-Right, above attribution) */}
      <div className="absolute bottom-6 left-4 sm:left-auto sm:right-16 z-20 pointer-events-none">
        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-3 text-xs font-mono text-slate-700 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">LAT</span>
            <span className="text-slate-900 font-medium">{latitude.toFixed(5)}°</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">LON</span>
            <span className="text-slate-900 font-medium">{longitude.toFixed(5)}°</span>
          </div>
          <div className="flex items-center gap-1 hidden sm:flex">
            <span className="text-slate-400">ZOOM</span>
            <span className="text-slate-900 font-medium">{zoomLevel}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-sans border-l border-slate-200 pl-2.5">
            <span>AOI: {aoiKm} km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
