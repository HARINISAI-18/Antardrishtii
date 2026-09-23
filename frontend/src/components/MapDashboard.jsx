import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Compass, Crosshair } from 'lucide-react';

const BASEMAPS = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community',
    maxZoom: 19
  },
  dark: {
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
  triggerFlyTo
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const aoiRectRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [activeBasemap, setActiveBasemap] = useState('satellite');
  const [zoomLevel, setZoomLevel] = useState(13);

  // Helper to calculate square bounding box matching backend N_PX calculation
  const getAoiBounds = (lat, lon, km) => {
    const nPx = Math.max(512, Math.min(2048, Math.round((km * 1000) / 10 / 512) * 512));
    const halfDeg = (nPx * 10.0) / 2.0 / 111320.0;
    return [
      [lat - halfDeg, lon - halfDeg],
      [lat + halfDeg, lon + halfDeg]
    ];
  };

  // Custom Neon Pin Icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-pin-pulse',
      html: `
        <div style="transform: translate(-50%, -100%); cursor: grab;">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <filter id="shadow" x="-4" y="0" width="40" height="46" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1E3A8A" flood-opacity="0.35"/>
            </filter>
            <path g="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#1E3A8A" stroke="#0EA5A9" stroke-width="2.5" filter="url(#shadow)"/>
            <circle cx="16" cy="16" r="6" fill="#0EA5A9"/>
            <circle cx="16" cy="16" r="2.5" fill="#ffffff"/>
          </svg>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42]
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
      // Update AOI rectangle continuously
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

    // AOI Bounding Box Overlay
    const bounds = getAoiBounds(latitude, longitude, aoiKm);
    const rect = L.rectangle(bounds, {
      color: '#0EA5A9',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#0EA5A9',
      fillOpacity: 0.15
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
      duration: 1.6,
      easeLinearity: 0.25
    });
  }, [triggerFlyTo]);

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
        <div className="glass-panel rounded-xl p-1.5 flex items-center gap-1 shadow-md border border-slate-200/90 bg-white/95">
          {Object.entries(BASEMAPS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveBasemap(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeBasemap === key
                ? 'bg-primary-900 text-white font-semibold shadow-md shadow-primary-900/20'
                : 'text-slate-600 hover:text-primary-900 hover:bg-slate-100'
                }`}
            >
              {config.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleRecenter}
          className="glass-panel p-2.5 rounded-xl text-slate-600 hover:text-accent-600 hover:border-accent-500/40 border border-slate-200/90 bg-white/95 transition-all shadow-md"
          title="Recenter Map on Target Pin"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Real-time Coordinate HUD Bar (Bottom-Right, above attribution) */}
      <div className="absolute bottom-8 left-4 sm:left-auto sm:right-16 z-20 pointer-events-none">
        <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white/95 flex items-center gap-4 text-xs font-mono text-slate-700 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">LAT:</span>
            <span className="text-primary-900 font-semibold">{latitude.toFixed(5)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">LON:</span>
            <span className="text-primary-900 font-semibold">{longitude.toFixed(5)}°</span>
          </div>
          <div className="flex items-center gap-1.5 hidden sm:flex">
            <span className="text-slate-400">ZOOM:</span>
            <span className="text-slate-800 font-medium">{zoomLevel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-accent-700 font-sans border-l border-slate-200 pl-3">
            <span>AOI: {aoiKm} km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
