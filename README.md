# GeoResolve AI — Sentinel-2 4× Super-Resolution & Geospatial Analytics

A full-stack Earth Observation (EO) AI platform that transforms medium-resolution Sentinel-2 multispectral imagery (10 m) into high-resolution imagery (2.5 m, 16× area detail magnification) and executes 9 specialized Computer Vision & Remote Sensing analytical pipelines.

Based on the research and methodology from `rfmsrh.ipynb` and `rfmsrh_(1).ipynb`.

---

## System Architecture

```
sihteam/
├── backend/
│   ├── main.py                      # FastAPI server with CORS & REST endpoints
│   ├── requirements.txt             # Complete Python dependencies
│   ├── modules/
│   │   ├── stac_fetcher.py          # Microsoft Planetary Computer S2 L2A ingestion
│   │   ├── super_resolution.py      # 4× Super-Resolution & feather-blended mosaic engine
│   │   ├── geospatial_analytics.py  # 9 Remote Sensing CV applications & 3×3 HR Atlas
│   │   └── disaster_assessment.py   # Multi-event pre/post change detection engine
│   └── outputs/                     # Generated visual assets, GeoTIFFs, and CSV reports
│
├── frontend/
│   ├── package.json                 # React 18, Vite, Tailwind CSS, Lucide icons
│   ├── vite.config.js               # Dev server configuration (Port 5173)
│   ├── tailwind.config.js           # Custom geospatial design system
│   ├── src/
│   │   ├── App.jsx                  # Main application orchestrator
│   │   ├── components/
│   │   │   ├── Header.jsx           # Status badge & connection monitor
│   │   │   ├── ControlPanel.jsx     # Coordinates, AOI, presets & sliders
│   │   │   ├── LoadingIndicator.jsx # Live multi-stage processing tracker
│   │   │   ├── SceneOverview.jsx    # Scene ID, date, resolution, usable AOI cards
│   │   │   ├── HeadlinesBanner.jsx  # Slide headlines highlighting SR gains
│   │   │   ├── ImageComparison.jsx  # 10m vs Bicubic vs 2.5m SR, 3×3 Atlas & Zoom
│   │   │   └── MetricsTable.jsx     # Quantitative table for all 9 applications + CSV export
│   │   └── index.css                # Custom glassmorphism styling
```

---

## 9 Specialized Domain Applications

1. **Small Buildings & Roof Detection**: White top-hat morphological filter (`disk(6)`), Otsu thresholding, structure area filtering (`<150 m²`), median size, and built footprint in hectares.
2. **Narrow Roads Extraction**: Frangi vesselness filter, skeletonization, Euclidean distance transform, and narrow roads (`≤7.5 m`) network length.
3. **Field Boundaries**: Sobel gradient edge detection, Otsu thresholding, Probabilistic Hough line transform, and edge sharpness.
4. **Localized Damage Detection**: Spectral anomaly filtering via VARI index and reflectance percentile thresholding for damage footprint estimation.
5. **Agriculture Monitoring**: Visible Atmospheric Resistant Index (VARI), within-field variance $\sigma(\text{VARI})$ reduction, field parcels segmentation.
6. **Land-Cover Mapping**: Unsupervised KMeans ($k=6$) clustering across RGB channels and local standard deviation texture cues.
7. **Urban Planning**: Built-up density estimation using $100\text{ m}$ spatial uniform window filtering and settlement clusters grouping.
8. **Environmental & Water**: Water index segmentation, pond counts, and shoreline perimeter calculation.
9. **Flood NDWI Analysis**: Normalized Difference Water Index (Green vs NIR), water inundation extent in $\text{km}^2$, shoreline length, and small water bodies detection.

---

## Quick Start & Execution Guide

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.13.5 Windows)
- **Node.js**: 18+ (tested on Node v24.15.0 with npm 11.12.1)

---

### Step 1: Backend Setup & Launch

Open a terminal in the project root:

```powershell
# Navigate to backend
cd backend

# Install dependencies (already completed)
py -m pip install -r requirements.txt

# Start FastAPI server on port 8000
py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend server will be live at:
- **API Base**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### Step 2: Frontend Setup & Launch

Open a second terminal:

```powershell
# Navigate to frontend
cd frontend

# Install dependencies (already completed)
npm install

# Start Vite dev server on port 5173
npm run dev
```

The frontend will be live at:
- **Web Interface**: `http://localhost:5173`

---

## API Reference

### `POST /api/process`
Executes the sequential pipeline: STAC Search → Radiometric Calibration → 4× Super-Resolution → 9 Geospatial Models → 3×3 HR Atlas.

**Request Body (JSON):**
```json
{
  "latitude": 16.5062,
  "longitude": 80.6480,
  "aoi_km": 5.12,
  "date_range": "2024-01-01/2024-12-31",
  "max_cloud": 15,
  "min_usable": 0.35,
  "enable_disaster_assessment": false
}
```

**Response (JSON):**
- `status`: `"success"`
- `scene_info`: Scene ID, acquisition date, cloud cover %, usable pixel fraction, CRS, bounding box
- `engine`: Super-resolution engine name, input/output pixel dimensions
- `metrics_table`: Array of 26 quantitative performance metrics comparing 10 m baseline vs 2.5 m Super-Resolved
- `headlines`: Executive key finding takeaways
- `images`: Base64 data URIs for `input_10m`, `bicubic_baseline`, `sr_2p5m`, `atlas_3x3`, `zoom_strip`, and `comparison`
- `downloads`: URLs for direct CSV and GeoTIFF downloads
