import React, { useState, useEffect } from 'react';
import MapDashboard from './components/MapDashboard';
import GeocoderSearch from './components/GeocoderSearch';
import FloatingSidebar from './components/FloatingSidebar';
import ResultsDrawer from './components/ResultsDrawer';
import ToastNotification from './components/ToastNotification';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [formValues, setFormValues] = useState({
    latitude: 16.5062,
    longitude: 80.6480,
    aoi_km: 5.12,
    date_range: '2024-01-01/2024-12-31',
    max_cloud: 15,
    min_usable: 0.35,
    enable_disaster_assessment: false,
    disaster_event_key: 'vijayawada_flood',
    engine_mode: 'auto'
  });

  const [presets, setPresets] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toast, setToast] = useState(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [triggerFlyTo, setTriggerFlyTo] = useState(0);

  // Poll backend health
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth(data);
      } else {
        setBackendHealth({ status: 'offline' });
      }
    } catch {
      setBackendHealth({ status: 'offline' });
    }
  };

  // Fetch presets
  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/presets`);
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch (e) {
      console.warn('Presets endpoint unreachable:', e);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchPresets();
    const interval = setInterval(fetchHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // Form value change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number' || name === 'aoi_km' || name === 'max_cloud'
            ? parseFloat(value)
            : value
    }));
  };

  // Direct map coordinate update from dragging pin or clicking map
  const handleMapCoordinateChange = (lat, lon) => {
    setFormValues((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));
  };

  // Location picked from Geocoder Search
  const handleSelectLocation = (lat, lon, displayName) => {
    setFormValues((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));
    setTriggerFlyTo((prev) => prev + 1);
    setToast({
      type: 'info',
      message: `Centered map on: ${displayName.split(',').slice(0, 2).join(', ')}`
    });
  };

  // Preset location selected
  const handleSelectPreset = (loc) => {
    setFormValues((prev) => ({
      ...prev,
      latitude: loc.lat,
      longitude: loc.lon,
      aoi_km: loc.aoi_km || 5.12,
      date_range: loc.date_range || '2024-01-01/2024-12-31'
    }));
    setTriggerFlyTo((prev) => prev + 1);
    setToast({
      type: 'info',
      message: `Loaded scenario: ${loc.name}`
    });
  };

  // Run full-stack pipeline
  const handleRunPipeline = async () => {
    setIsLoading(true);
    setIsCompleted(false);
    setCurrentStage(1);
    setIsResultsOpen(false);
    setResults(null);

    const enableDisaster = Boolean(formValues.enable_disaster_assessment);

    try {
      const payload = {
        latitude: parseFloat(formValues.latitude),
        longitude: parseFloat(formValues.longitude),
        aoi_km: parseFloat(formValues.aoi_km),
        date_range: formValues.date_range,
        max_cloud: parseInt(formValues.max_cloud),
        min_usable: parseFloat(formValues.min_usable),
        enable_disaster_assessment: enableDisaster,
        disaster_event_key: formValues.disaster_event_key,
        engine_mode: formValues.engine_mode || 'auto',
        stream: true
      };

      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Backend responded with code ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (res.body && (contentType.includes('application/x-ndjson') || !contentType.includes('application/json'))) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep partial line for next iteration

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);

              if (chunk.status === 'error' || chunk.stage === 'error') {
                throw new Error(chunk.detail || chunk.error || 'Pipeline processing failed');
              }

              // Merge incoming chunk into results
              setResults((prev) => ({
                ...prev,
                ...chunk,
                scene_info: chunk.scene_info || prev?.scene_info,
                engine: chunk.engine || prev?.engine,
                images: { ...(prev?.images || {}), ...(chunk.images || {}) },
                downloads: { ...(prev?.downloads || {}), ...(chunk.downloads || {}) },
                timings: { ...(prev?.timings || {}), ...(chunk.timings || {}) },
                processing: { ...(prev?.processing || {}), ...(chunk.processing || {}) }
              }));

              // Change in the bar seen when actual output is displayed on frontend:
              if (chunk.stage === 'scene_ready') {
                // i) SR image generation complete & displayed -> move to ii) Metrics
                setCurrentStage(2);
                setIsResultsOpen(true);
                setToast({
                  type: 'info',
                  message: `Scene & 4× SR Image ready! Displaying first output...`
                });
              } else if (chunk.stage === 'metrics_ready') {
                // ii) Metrics complete & displayed -> move to iii) Disaster (if enabled) or iv) Crop
                setCurrentStage(3);
              } else if (chunk.stage === 'disaster_ready') {
                // iii) Disaster complete & displayed -> move to iv) Crop
                setCurrentStage(4);
              } else if (chunk.stage === 'crop_ready') {
                // iv) Crop complete & displayed -> move to v) Urban
                setCurrentStage(enableDisaster ? 5 : 4);
              } else if (chunk.stage === 'urban_ready' || chunk.stage === 'complete') {
                // v) Urban complete & all stages done! Indicate completion only when done
                setIsCompleted(true);
                setIsLoading(false);
                setToast({
                  type: 'success',
                  message: `All generated outputs & analytics completed!`
                });
              }
            } catch (chunkErr) {
              if (chunkErr.message && !chunkErr.message.includes('JSON')) {
                throw chunkErr;
              }
              console.warn('Chunk parse notice:', chunkErr);
            }
          }
        }

        // Process any trailing buffer
        if (buffer && buffer.trim()) {
          try {
            const chunk = JSON.parse(buffer.trim());
            if (chunk.status === 'error' || chunk.stage === 'error') {
              throw new Error(chunk.detail || chunk.error || 'Pipeline processing failed');
            }
            setResults((prev) => ({
              ...prev,
              ...chunk,
              scene_info: chunk.scene_info || prev?.scene_info,
              engine: chunk.engine || prev?.engine,
              images: { ...(prev?.images || {}), ...(chunk.images || {}) },
              downloads: { ...(prev?.downloads || {}), ...(chunk.downloads || {}) },
              timings: { ...(prev?.timings || {}), ...(chunk.timings || {}) },
              processing: { ...(prev?.processing || {}), ...(chunk.processing || {}) }
            }));
            if (chunk.stage === 'complete' || chunk.stage === 'urban_ready') {
              setIsCompleted(true);
              setIsLoading(false);
            }
          } catch (e) {
            // ignore trailing json parse error
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await res.json();
        setResults(data);
        setIsResultsOpen(true);
        setIsCompleted(true);
        setToast({
          type: 'success',
          message: `4× Super-Resolution completed! Scene: ${data.scene_info?.id || 'Sentinel-2'}`
        });
      }
    } catch (err) {
      console.error('Pipeline Error:', err);
      setToast({
        type: 'error',
        message: err.message || 'Error processing satellite imagery. Verify coordinates and cloud coverage.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isBackendOnline = backendHealth?.status === 'online';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] font-sans selection:bg-accent-500 selection:text-white text-slate-800">
      {/* 1. Centerpiece: Full-Screen Interactive Leaflet Map */}
      <MapDashboard
        latitude={formValues.latitude}
        longitude={formValues.longitude}
        aoiKm={formValues.aoi_km}
        onCoordinatesChange={handleMapCoordinateChange}
        triggerFlyTo={triggerFlyTo}
      />

      {/* 2. Top-Center Floating Bar: Geocoder Search Box + API Online Status */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 flex items-center justify-center gap-2.5">
        <div className="flex-1 min-w-0 max-w-md">
          <GeocoderSearch onSelectLocation={handleSelectLocation} />
        </div>

        {/* API Online Status Badge displayed beside Search Bar */}
        <div className={`glass-panel px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-medium shadow-lg backdrop-blur-md shrink-0 transition-all ${isBackendOnline
          ? 'border-accent-500/30 text-accent-700 bg-white/95 shadow-accent-500/10'
          : 'border-rose-300 text-rose-600 bg-white/95 shadow-rose-500/10'
          }`}>
          <span className="relative flex h-2.5 w-2.5">
            {isBackendOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBackendOnline ? 'bg-accent-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="font-semibold whitespace-nowrap">{isBackendOnline ? `API Online (${backendHealth?.device || 'Connected'})` : 'API Offline'}</span>
        </div>
      </div>

      {/* 4. Floating Left Glassmorphism Control Panel */}
      <FloatingSidebar
        formValues={formValues}
        onChange={handleChange}
        onSelectPreset={handleSelectPreset}
        presets={presets}
        backendHealth={backendHealth}
        onRunPipeline={handleRunPipeline}
        isLoading={isLoading}
        currentStage={currentStage}
        isCompleted={isCompleted}
        hasResults={Boolean(results)}
        onOpenResults={() => setIsResultsOpen(true)}
      />

      {/* 5. Production-Grade Results Drawer / Split Slider Modal */}
      <ResultsDrawer
        results={results}
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
      />

      {/* 6. Non-Blocking Floating Toast Notifications */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
