"""
FastAPI Server for Satellite Super-Resolution & Geospatial Analytics Platform.
Integrates Copernicus (CDSE) Ingestion, 4x Super-Resolution, Application Metrics,
Crop Monitoring, Urban Analysis and Disaster Assessment into an end-to-end API.

v1.3.0 changes:
  - FIX: Urban-analysis artifact keys are accessed DEFENSIVELY (.get) so optional
         or renamed outputs (e.g., 'road_panels') can never raise KeyError -> 500.
         (Requires the updated modules/urban_analysis.py which restores
          audit_map / road_panels / road_overlay keys.)
  - FIX: Urban stage wrapped in try/except — a failure there is reported in the
         response payload (urban_analysis.status = "failed") instead of failing
         the entire /api/process request.
  - FIX: Crop-monitoring image keys hardened with the same .get() pattern.
  - ADD: 'urban_s' per-stage timing in the timings block.

v1.2.0 changes:
  - FIX: CRS coerced to str (rasterio CRS is not JSON-serializable -> was 500)
  - FIX: aoi_km snapped to 512-px multiples (5.12/10.24/15.36/20.48 km) so RFMSR's
         locked 512 tile always gets a valid input size
  - Loads backend/.env at startup (OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET)
  - Startup readiness report + CDSE status in /api/health
  - /api/process: 'refetch' flag to bypass the cached scene clip
  - scene_info.source_backend surfaces cdse_openeo vs planetary_computer_fallback
  - Per-stage timings in the response; clearer HTTP error mapping
"""

import os
import io
import time
import base64
import glob as _glob
from typing import Optional
from pydantic import BaseModel, Field

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np

# ---------------------------------------------------------------------------
# Load backend/.env BEFORE importing modules that read credentials
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    _here = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(_here, ".env")):
        load_dotenv(os.path.join(_here, ".env"), override=False)
except ImportError:
    pass

# Module imports (Copernicus ingestion + metrics-only analytics)
from modules.copernicusfetch import fetch_sentinel2_data
from modules.super_resolution import super_resolve_mosaic, has_rfmsr_model
from modules.app_metrics import compute_application_metrics
from modules.disaster_assessment import DISASTER_EVENTS, perform_change_detection
from modules.crop_monitoring import run_crop_monitoring
from modules.urban_analysis import run_urban_analysis

app = FastAPI(
    title="Geospatial Super-Resolution & Analytics API",
    description="Full-stack AI engine for Sentinel-2 4x Super-Resolution and Geospatial Analytics (Copernicus CDSE)",
    version="1.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


# ---------------------------------------------------------------------------
# Startup readiness report (runs once at import)
# ---------------------------------------------------------------------------
def _startup_report():
    cred = "YES" if (os.environ.get("OPENEO_CLIENT_ID") and os.environ.get("OPENEO_CLIENT_SECRET")) \
        else "no (interactive OIDC / PC fallback)"
    try:
        import openeo
        oeo = getattr(openeo, "__version__", "installed")
    except ImportError:
        oeo = "MISSING  ->  py -m pip install openeo"
    rfmsr = "present" if has_rfmsr_model(os.path.join(BASE_DIR, "RFMSR")) \
        else "MISSING (fast engine only)"
    try:
        import torch
        dev = "CUDA GPU" if torch.cuda.is_available() else "CPU"
    except ImportError:
        dev = "torch MISSING"
    print("\n" + "=" * 66)
    print("  Backend readiness")
    print(f"  CDSE credentials : {cred}")
    print(f"  openeo package   : {oeo}")
    print(f"  RFMSR weights    : {rfmsr}")
    print(f"  Torch device     : {dev}")
    print("=" * 66)


_startup_report()


def image_to_base64(img_input) -> str:
    """Encodes a file path, PIL Image, or NumPy array (0-1 or 0-255) to a base64 PNG data URI.
    Returns '' for missing files / empty inputs — never raises."""
    if isinstance(img_input, str) and img_input and os.path.exists(img_input):
        with open(img_input, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"
    elif isinstance(img_input, np.ndarray):
        arr = img_input
        if arr.dtype == np.float32 or arr.dtype == np.float64:
            arr = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
        pil_img = Image.fromarray(arr)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
    elif isinstance(img_input, Image.Image):
        buf = io.BytesIO()
        img_input.save(buf, format="PNG")
        return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
    return ""


def _snap_aoi(aoi_km: float):
    """Snap AOI to a multiple of 512 px @10 m (512..2048), notebook-parity.
    Returns (n_px, aoi_km_effective). Prevents sub-512 inputs from breaking
    RFMSR's locked tile size."""
    n_px = max(512, min(2048, int(round(aoi_km * 1000.0 / 10.0 / 512.0)) * 512))
    return n_px, n_px * 10.0 / 1000.0


class ProcessRequest(BaseModel):
    latitude: float = Field(..., description="Center latitude in degrees [-90, 90]", example=16.5062)
    longitude: float = Field(..., description="Center longitude in degrees [-180, 180]", example=80.6480)
    aoi_km: float = Field(default=5.12, description="AOI size in km — snapped to 5.12/10.24/15.36/20.48", example=5.12)
    date_range: str = Field(default="2024-01-01/2026-09-01", description="Search date range (YYYY-MM-DD/YYYY-MM-DD)")
    max_cloud: int = Field(default=15, description="Maximum metadata cloud cover percentage")
    min_usable: float = Field(default=0.35, description="Minimum SCL usable pixel fraction in AOI")
    refetch: bool = Field(default=False, description="Bypass cached scene clip and re-download from CDSE")
    enable_disaster_assessment: bool = Field(default=False, description="Run pre/post disaster change detection")
    disaster_event_key: Optional[str] = Field(default=None, description="Disaster preset key")
    engine_mode: Optional[str] = Field(default="auto", description="'auto', 'rfmsr' (full neural), 'fast' (multi-scale synthesis)")


@app.get("/api/health")
def health_check():
    import torch
    rfmsr_ready = has_rfmsr_model(os.path.join(BASE_DIR, "RFMSR"))
    dev = "CUDA GPU" if torch.cuda.is_available() else "CPU"
    try:
        import openeo
        openeo_installed = True
        openeo_version = getattr(openeo, "__version__", "installed")
    except ImportError:
        openeo_installed, openeo_version = False, None
    return {
        "status": "online",
        "device": dev,
        "gpu_available": torch.cuda.is_available(),
        "rfmsr_model_weights_present": rfmsr_ready,
        "cdse": {
            "openeo_installed": openeo_installed,
            "openeo_version": openeo_version,
            "client_credentials_configured": bool(
                os.environ.get("OPENEO_CLIENT_ID") and os.environ.get("OPENEO_CLIENT_SECRET")
            ),
            "openeo_endpoint": "https://openeo.dataspace.copernicus.eu",
        },
        "data_source": "Copernicus Data Space Ecosystem (CDSE + openEO)",
        "default_execution_mode": (
            f"RFMSR Residual Flow Matching ({dev})" if rfmsr_ready
            else "High-Fidelity Detail Synthesis (4x Local Engine)"
        ),
        "output_directory": OUTPUT_DIR
    }


@app.get("/api/presets")
def get_presets():
    return {
        "locations": [
            {"id": "vijayawada", "name": "Vijayawada & Krishna River (Urban & Water)",
             "lat": 16.5062, "lon": 80.6480, "aoi_km": 5.12,
             "date_range": "2024-01-01/2024-12-31",
             "description": "Dense urban settlements, bridges, and the Krishna river system."},
            {"id": "chennai", "name": "Chennai Coast (Michaung Flood Zone)",
             "lat": 13.0785, "lon": 80.2590, "aoi_km": 5.12,
             "date_range": "2023-11-01/2023-12-31",
             "description": "Coastal urban fabric, canals, ports, and high-density buildings."},
            {"id": "nainital", "name": "Nainital Hills (Forest & Mountain Roads)",
             "lat": 29.48, "lon": 79.55, "aoi_km": 5.12,
             "date_range": "2024-04-01/2024-05-30",
             "description": "Steep forested terrain, mountain ridges, and narrow winding roads."},
            {"id": "wayanad", "name": "Wayanad Highland Parcels (Agriculture & Landslide)",
             "lat": 11.7757, "lon": 76.1160, "aoi_km": 5.12,
             "date_range": "2024-07-01/2024-08-31",
             "description": "Terraced agriculture, tea plantations, and drainage basins."},
            {"id": "beed", "name": "Beed Maharashtra (Agricultural Parcels)",
             "lat": 18.99, "lon": 75.76, "aoi_km": 5.12,
             "date_range": "2024-08-01/2024-10-31",
             "description": "Smallholder field parcels, field boundaries, and arid land cover."}
        ],
        "disaster_events": DISASTER_EVENTS
    }


@app.post("/api/process")
def process_pipeline(req: ProcessRequest):
    """
    Full-Stack Pipeline:
    CDSE Ingestion -> 4x Super-Resolution -> Application Metrics (CSV) -> Disaster/Crop/Urban.
    """
    n_px_snap, aoi_km_eff = _snap_aoi(req.aoi_km)
    print(f"\n[API] >>> Request: Lat={req.latitude}, Lon={req.longitude}, "
          f"AOI={req.aoi_km}km (snapped {aoi_km_eff}km, {n_px_snap}px), Engine={req.engine_mode}")
    t_total = time.perf_counter()
    try:
        tag = f"lat{req.latitude}_lon{req.longitude}".replace(".", "p").replace("-", "m")
        session_out_dir = os.path.join(OUTPUT_DIR, tag)
        os.makedirs(session_out_dir, exist_ok=True)

        # Optional cache bypass
        if req.refetch:
            for f in _glob.glob(os.path.join(session_out_dir, "s2_clip_*.tif")):
                try:
                    os.remove(f)
                    print(f"[API] refetch: removed cached clip {os.path.basename(f)}")
                except OSError:
                    pass

        # Step 1: Copernicus CDSE Query & Clip
        t0 = time.perf_counter()
        stac_res = fetch_sentinel2_data(
            latitude=req.latitude,
            longitude=req.longitude,
            aoi_km=aoi_km_eff,
            date_range=req.date_range,
            max_cloud=req.max_cloud,
            min_usable=req.min_usable,
            output_dir=session_out_dir
        )
        t_fetch = time.perf_counter() - t0
        print(f"[API] fetch done in {t_fetch:.1f}s | backend: {stac_res.get('source_backend', 'cdse_openeo')}")

        # Step 2: 4x Super-Resolution & Feathered Mosaic
        t0 = time.perf_counter()
        sr_res = super_resolve_mosaic(
            rgb_vis=stac_res["rgb_vis"],
            output_dir=session_out_dir,
            tf10=stac_res["tf10"],
            crsw=stac_res["crsw"],
            repo_dir=os.path.join(BASE_DIR, "RFMSR"),
            engine_mode=req.engine_mode or "auto"
        )
        t_sr = time.perf_counter() - t0

        # Step 3: Application Metrics -> CSV (no 3x3 atlas / zoom strip)
        t0 = time.perf_counter()
        metrics_res = compute_application_metrics(
            bic=sr_res["bicubic"],
            sr=sr_res["sr"],
            bands_data=stac_res["bands"],
            output_dir=session_out_dir
        )
        t_metrics = time.perf_counter() - t0

        # Step 4: Optional Disaster Assessment
        disaster_info = None
        if req.enable_disaster_assessment:
            pre_proxy = np.roll(sr_res["bicubic"], shift=8, axis=0)
            disaster_info = perform_change_detection(
                pre_rgb=pre_proxy,
                post_rgb=sr_res["sr"],
                output_dir=session_out_dir,
                event_name=req.disaster_event_key or "Custom Event"
            )
            disaster_info["disaster_image"] = image_to_base64(disaster_info.get("disaster_png", ""))

        # Step 5: Crop Monitoring
        crop_res = run_crop_monitoring(
            rfmsr_img=sr_res["sr"],
            red_band=stac_res["bands"]["B04"],
            nir_band=stac_res["bands"].get("B08", stac_res["bands"]["B04"]),
            scene_id=stac_res["item_id"],
            observation_date=stac_res["date"],
            cloud_cover=stac_res["cloud_cover"],
            output_dir=session_out_dir
        )
        # DEFENSIVE: .get() so a renamed/missing artifact can never raise KeyError
        crop_res["ndvi_map_image"] = image_to_base64(crop_res.get("ndvi_map", ""))
        crop_res["health_map_image"] = image_to_base64(crop_res.get("health_map", ""))
        crop_res["comparison_image"] = image_to_base64(crop_res.get("comparison", ""))

        # Step 6: Urban Spatial Analysis & Compliance Audit
        # NOTE: wrapped in try/except — urban analytics include network calls (OSM
        # Overpass) and GIS edge cases; a failure here must NEVER 500 the whole
        # pipeline. This fixes the previous KeyError: 'road_panels' crash.
        t0 = time.perf_counter()
        try:
            urban_res = run_urban_analysis(
                sr_img=sr_res["sr"],
                bbox=stac_res["bbox"],
                output_dir=session_out_dir
            )
            # DEFENSIVE: .get() so an optional/renamed artifact can never raise KeyError
            urban_res["audit_map_image"]    = image_to_base64(urban_res.get("audit_map", ""))
            urban_res["road_panels_image"]  = image_to_base64(urban_res.get("road_panels", ""))
            urban_res["road_overlay_image"] = image_to_base64(urban_res.get("road_overlay", ""))
        except Exception as urban_exc:
            import traceback
            traceback.print_exc()
            urban_res = {"status": "failed", "error": str(urban_exc)}
        t_urban = time.perf_counter() - t0

        payload = {
            "status": "success",
            "scene_info": {
                "id": stac_res["item_id"],
                "date": stac_res["date"],
                "cloud_cover_pct": stac_res["cloud_cover"],
                "usable_pct": stac_res["usable_pct"],
                "crs": str(stac_res["crsw"]),                      # FIX: must be str for JSON
                "bbox": stac_res["bbox"],
                "source_backend": stac_res.get("source_backend", "cdse_openeo"),
                "input_resolution_m": 10.0,
                "sr_resolution_m": 2.5,
                "magnification": "4x (16x pixel area detail)"
            },
            "engine": {
                "name": sr_res["engine_used"],
                "input_pixels": f"{stac_res['n_px']}x{stac_res['n_px']}",
                "output_pixels": f"{sr_res['s_out']}x{sr_res['s_out']}"
            },
            "timings": {
                "fetch_s": round(t_fetch, 1),
                "sr_s": round(t_sr, 1),
                "metrics_s": round(t_metrics, 1),
                "urban_s": round(t_urban, 1),
                "total_s": round(time.perf_counter() - t_total, 1)
            },
            "metrics_table": metrics_res["metrics"],
            "headlines": metrics_res["headlines"],
            "crop_monitoring": crop_res,
            "urban_analysis": urban_res,
            "images": {
                "input_10m": image_to_base64(sr_res.get("input_png", "")),
                "bicubic_baseline": image_to_base64(sr_res.get("bicubic_png", "")),
                "sr_2p5m": image_to_base64(sr_res.get("mosaic_png", "")),
                "comparison": image_to_base64(metrics_res["comparison_png"]) if metrics_res.get("comparison_png") else "",
                "crop_ndvi_map": crop_res.get("ndvi_map_image", ""),
                "crop_health_map": crop_res.get("health_map_image", ""),
                "crop_comparison": crop_res.get("comparison_image", ""),
                "urban_audit_map": urban_res.get("audit_map_image", ""),
                "urban_road_panels": urban_res.get("road_panels_image", ""),
                "urban_road_overlay": urban_res.get("road_overlay_image", "")
            },
            "downloads": {
                "metrics_csv": f"/outputs/{tag}/srm_application_metrics.csv",
                "sr_image": f"/outputs/{tag}/mosaic_sr.png",
                "sr_geotiff_2p5m": f"/outputs/{tag}/sr_georef_2p5m.tif",
                "crop_json": f"/outputs/{tag}/crop_monitoring.json",
                "crop_ndvi_map": f"/outputs/{tag}/crop_ndvi_map.png",
                "crop_health_map": f"/outputs/{tag}/crop_health_map.png",
                "crop_comparison": f"/outputs/{tag}/crop_monitoring_comparison.png",
                "urban_json": f"/outputs/{tag}/urban_analysis.json",
                "urban_audit_map": f"/outputs/{tag}/comprehensive_spatial_audit.png",
                "urban_road_panels": f"/outputs/{tag}/road_detection_panels.png",
                "urban_road_overlay": f"/outputs/{tag}/road_overlay.png",
                "building_footprints_geojson": f"/outputs/{tag}/building_footprints.geojson",
                "compliance_violations_geojson": f"/outputs/{tag}/compliance_violations.geojson"
            }
        }

        if disaster_info:
            payload["disaster_assessment"] = disaster_info

        return JSONResponse(content=payload)

    except Exception as e:
        import traceback
        traceback.print_exc()
        err_msg = str(e)
        low = err_msg.lower()
        if "503" in err_msg or "service unavailable" in low:
            raise HTTPException(status_code=503,
                                detail="Copernicus services are temporarily busy. Please retry in a few moments.")
        if "invalid_client" in low or "unauthorized_client" in low or ("401" in err_msg and "auth" in low):
            raise HTTPException(status_code=502,
                                detail="CDSE authentication failed. Check OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET "
                                       "in backend/.env — the OAuth client must use the 'Client credentials' grant type.")
        if "openeo" in low and ("no module" in low or "install" in low):
            raise HTTPException(status_code=503,
                                detail="Server is missing the 'openeo' package. Run: py -m pip install openeo")
        if "no sentinel-2" in low or "no usable" in low:
            raise HTTPException(status_code=404, detail=err_msg)
        raise HTTPException(status_code=500, detail=f"Processing Error: {err_msg}")