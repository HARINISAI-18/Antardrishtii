"""
Urban Spatial Analysis & Regulatory Compliance Audit Module.
Applied to the 4x Super-Resolved satellite imagery from the pipeline.

Contract with backend/main.py (Step 6) — the returned dict MUST contain:
    audit_map      -> comprehensive_spatial_audit.png   (compliance + grid density panels)
    road_panels    -> road_detection_panels.png         (RGB | binary mask | color overlay)
    road_overlay   -> road_overlay.png
    road_mask      -> road_mask.png
    building_footprints.geojson / compliance_violations.geojson / urban_analysis.json

UPDATE LOG:
  * [RESTORED] Road extraction stage (OSM vectors + CV Canny/Hough fusion) —
               required by backend/main.py: urban_res["road_panels"], ["road_overlay"].
  * [REMOVED]  Sub-pixel building fraction map + .npy export (per requirement).
               64x64px grid CENTROID density is retained.
"""

import os
import json
import time
import argparse
import requests
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import cv2
from PIL import Image

try:
    import geopandas as gpd
    from shapely.geometry import Polygon, LineString, shape, mapping
    from shapely.ops import transform
    from shapely.validation import make_valid
    from rasterio.transform import from_bounds
    import pyproj
except ImportError as e:
    raise ImportError(
        "Missing GIS dependencies. Install with:\n"
        "  pip install geopandas shapely rasterio pyproj fiona"
    ) from e

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------
GRID_BLOCK_SIZE = 64                 # 64x64px grid block for centroid density
ROAD_LINE_THICKNESS = 8              # Ribbon width (px) for road overlay
CV_DOWNSCALE = 2                     # Downscale factor for faster Hough detection

WATER_BUFFER_DISTANCE_M = 50.0
HIGH_RISK_DISTANCE_M = 15.0
PERMANENT_STRUCTURE_MIN_AREA_SQM = 300.0
MIN_BUILDING_CONTOUR_AREA_PX = 50
ROAD_OVERLAY_ALPHA = 0.85

OVERLAY_COLOR_OSM = np.array([255, 255, 0], dtype=np.uint8)   # Bright Yellow
OVERLAY_COLOR_CV  = np.array([0, 255, 255], dtype=np.uint8)   # Bright Cyan


# ------------------------------------------------------------------------------
# ROAD EXTRACTION HELPERS
# ------------------------------------------------------------------------------
def fetch_osm_roads(bbox, http_timeout=20, max_rounds=2):
    """Queries OpenStreetMap Overpass API for road centerlines within the target BBOX."""
    mn_lon, mn_lat, mx_lon, mx_lat = bbox
    query_roads = f"""
[out:json][timeout:{http_timeout}];
(
  way["highway"]({mn_lat},{mn_lon},{mx_lat},{mx_lon});
);
out body;
>;
out skel qt;
"""
    mirrors = [
        ("kumi.systems",    "https://overpass.kumi.systems/api/interpreter"),
        ("overpass-api.de", "https://overpass-api.de/api/interpreter"),
        ("osm.ch",          "https://overpass.osm.ch/api/interpreter"),
    ]
    headers = {'User-Agent': 'GeoResolveUrbanAudit/1.0'}
    for rnd in range(1, max_rounds + 1):
        for name, url in mirrors:
            try:
                t0 = time.time()
                res = requests.get(url, params={'data': query_roads}, headers=headers, timeout=http_timeout)
                if res.status_code == 200:
                    print(f"  ✓ OSM mirror {name} responded in {time.time()-t0:.1f}s")
                    return res.json()
            except Exception:
                continue
        time.sleep(1)
    print("  Notice: OSM Overpass mirrors timed out or unavailable, relying on CV road extraction.")
    return None


def detect_roads_cv(rgb_image, downscale=CV_DOWNSCALE):
    """Classical CV Road Corridor Extraction: CLAHE -> Canny -> HoughLinesP."""
    h, w = rgb_image.shape[:2]
    small = cv2.resize(rgb_image, (w // downscale, h // downscale),
                       interpolation=cv2.INTER_AREA) if downscale > 1 else rgb_image

    g = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(g)
    edges = cv2.Canny(cv2.GaussianBlur(enhanced, (5, 5), 0), 80, 180)

    segments = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=120, minLineLength=100, maxLineGap=12)

    cv_mask = np.zeros((h, w), dtype=np.uint8)
    n_seg = 0
    if segments is not None and len(segments) > 0:
        segs = segments.reshape(-1, 4)
        n_seg = len(segs)
        s = downscale
        for x1, y1, x2, y2 in segs:
            cv2.line(cv_mask, (int(x1*s), int(y1*s)), (int(x2*s), int(y2*s)),
                     255, thickness=ROAD_LINE_THICKNESS)

    cv_mask = cv2.dilate(cv_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    return cv_mask, n_seg


# ------------------------------------------------------------------------------
# GEOMETRY / IO HELPERS
# ------------------------------------------------------------------------------
def load_image_uint8_rgb(src):
    """Normalizes ANY input style (PIL / numpy float-or-uint8 / file path) -> uint8 RGB."""
    if isinstance(src, Image.Image):
        return np.array(src.convert("RGB"))
    if isinstance(src, np.ndarray):
        arr = src
        if arr.ndim == 2:
            arr = np.stack([arr] * 3, axis=-1)
        if arr.shape[-1] > 3:
            arr = arr[..., :3]
        if arr.dtype in (np.float32, np.float64) and arr.max() <= 1.0:
            arr = np.clip(arr * 255.0, 0, 255)
        return arr.astype(np.uint8)
    return np.array(Image.open(src).convert("RGB"))


def extract_pixel_coords(geom, inv_affine):
    """Extracts pixel coordinate arrays from Shapely geometries (Polygon/MultiPolygon/LineString)."""
    if geom.is_empty:
        return []
    if hasattr(geom, 'geoms'):
        coords_group = []
        for sub_g in geom.geoms:
            coords_group.extend(extract_pixel_coords(sub_g, inv_affine))
        return coords_group
    if hasattr(geom, 'exterior'):
        raw_coords = geom.exterior.coords
    elif hasattr(geom, 'coords'):
        raw_coords = geom.coords
    else:
        return []
    return [np.array([inv_affine * (x, y) for x, y in raw_coords])]


# ------------------------------------------------------------------------------
# MAIN PIPELINE
# ------------------------------------------------------------------------------
def run_urban_analysis(
    sr_img,
    bbox: list,
    output_dir: str = "outputs",
    grid_block_size: int = GRID_BLOCK_SIZE,
    water_buffer_m: float = WATER_BUFFER_DISTANCE_M,
    high_risk_m: float = HIGH_RISK_DISTANCE_M,
) -> dict:
    """
    Executes the complete Urban Analysis & Spatial Compliance Audit:
      1. Building footprints + 64x64px grid centroid density (fraction map REMOVED)
      2. Waterbody buffer compliance audit (metric UTM)
      3. Road extraction: OSM vectors + CV Hough fusion
      4. Figures: comprehensive_spatial_audit.png + road_detection_panels.png
      5. Exports GeoJSON / PNG / urban_analysis.json
    Returns a dict containing the keys required by backend/main.py:
      audit_map, road_panels, road_overlay, road_mask, ...
    """
    os.makedirs(output_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # [1] INPUT + SHARED COORDINATE TRANSFORMS
    # ------------------------------------------------------------------
    img_np = load_image_uint8_rgb(sr_img)
    IMG_H, IMG_W = img_np.shape[:2]
    min_lon, min_lat, max_lon, max_lat = bbox

    transform_affine = from_bounds(min_lon, min_lat, max_lon, max_lat, IMG_W, IMG_H)
    inv_transform = ~transform_affine

    center_lon, center_lat = (min_lon + max_lon) / 2.0, (min_lat + max_lat) / 2.0
    utm_zone = int((center_lon + 180) / 6) + 1
    utm_epsg = 32600 + utm_zone if center_lat >= 0 else 32700 + utm_zone

    to_utm = lambda geom: transform(pyproj.Transformer.from_crs("EPSG:4326", f"EPSG:{utm_epsg}", always_xy=True).transform, geom)
    to_wgs84 = lambda geom: transform(pyproj.Transformer.from_crs(f"EPSG:{utm_epsg}", "EPSG:4326", always_xy=True).transform, geom)

    print(f"[urban] Analyzing BBOX {bbox} on EPSG:{utm_epsg} at {IMG_W}x{IMG_H}px")

    # ------------------------------------------------------------------
    # [2] BUILDING FOOTPRINTS + GRID CENTROID DENSITY  (fraction map REMOVED)
    # ------------------------------------------------------------------
    print("[urban][A] Extracting building footprints and grid centroid density...")

    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh_bld = cv2.threshold(blur, 130, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    thresh_bld = cv2.morphologyEx(thresh_bld, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(thresh_bld, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    building_features = []
    pixel_count_map = np.zeros((IMG_H, IMG_W), dtype=np.int32)

    for idx, cnt in enumerate(contours):
        if cv2.contourArea(cnt) < MIN_BUILDING_CONTOUR_AREA_PX:
            continue
        approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
        if len(approx) < 3:
            continue

        pts_wgs84 = [transform_affine * (pt[0], pt[1]) for pt in approx.reshape(-1, 2)]
        poly_wgs84 = Polygon(pts_wgs84)
        if not poly_wgs84.is_valid:
            poly_wgs84 = make_valid(poly_wgs84)
        if poly_wgs84.is_empty:
            continue

        poly_utm = to_utm(poly_wgs84)
        struct_type = "Permanent Structure" if poly_utm.area >= PERMANENT_STRUCTURE_MIN_AREA_SQM else "Temporary Shed"
        building_features.append({
            "type": "Feature",
            "geometry": mapping(poly_wgs84),
            "properties": {
                "building_id": f"BLD_{idx+1:04d}",
                "structure_type": struct_type,
                "area_sqm": round(poly_utm.area, 2)
            }
        })

        c_lon, c_lat = poly_wgs84.centroid.x, poly_wgs84.centroid.y
        px_x, px_y = inv_transform * (c_lon, c_lat)
        px_x, px_y = int(px_x), int(px_y)
        if 0 <= px_x < IMG_W and 0 <= px_y < IMG_H:
            pixel_count_map[px_y, px_x] += 1

    grid_h, grid_w = IMG_H // grid_block_size, IMG_W // grid_block_size
    grid_density = np.zeros((grid_h, grid_w), dtype=np.int32)
    for y_idx in range(grid_h):
        for x_idx in range(grid_w):
            cell_block = pixel_count_map[
                y_idx * grid_block_size : (y_idx + 1) * grid_block_size,
                x_idx * grid_block_size : (x_idx + 1) * grid_block_size
            ]
            grid_density[y_idx, x_idx] = int(np.sum(cell_block))

    n_permanent = sum(1 for b in building_features if b["properties"]["structure_type"] == "Permanent Structure")
    n_temporary = len(building_features) - n_permanent
    print(f"  ✓ Detected {len(building_features)} buildings ({n_permanent} permanent, {n_temporary} temporary).")

    # ------------------------------------------------------------------
    # [3] WATERBODY BUFFER COMPLIANCE AUDIT (metric UTM)
    # ------------------------------------------------------------------
    print("[urban][B] Running 50m water-buffer compliance checks...")

    ref_water = to_utm(LineString([
        (transform_affine * (0, IMG_H // 2)),
        (transform_affine * (IMG_W, IMG_H // 2))
    ]))
    buffer_water = ref_water.buffer(water_buffer_m)
    if not buffer_water.is_valid:
        buffer_water = make_valid(buffer_water)

    violation_records = []
    violation_features = []
    high_risk_count = 0
    med_risk_count = 0

    if building_features:
        gdf_buildings = gpd.GeoDataFrame.from_features(building_features, crs="EPSG:4326").to_crs(f"EPSG:{utm_epsg}")
        for _, bld in gdf_buildings.iterrows():
            bld_utm = bld.geometry
            if not bld_utm.is_valid:
                bld_utm = make_valid(bld_utm)
            bld_utm = bld_utm.buffer(0)

            if bld_utm.intersects(buffer_water):
                try:
                    encroached_area = bld_utm.intersection(buffer_water).area
                except Exception:
                    encroached_area = bld_utm.area

                centroid = to_wgs84(bld_utm.centroid)
                dist_val = float(bld_utm.distance(ref_water))
                risk_level = "HIGH" if dist_val <= high_risk_m else "MEDIUM"
                if risk_level == "HIGH":
                    high_risk_count += 1
                else:
                    med_risk_count += 1

                rec = {
                    "building_id": bld["building_id"],
                    "structure_type": bld["structure_type"],
                    "violated_zone": f"Waterbody Buffer ({water_buffer_m:.0f}m)",
                    "risk_level": risk_level,
                    "centroid_gps": [round(centroid.y, 6), round(centroid.x, 6)],
                    "total_area_sqm": float(bld["area_sqm"]),
                    "encroached_area_sqm": round(float(encroached_area), 2)
                }
                violation_records.append(rec)
                violation_features.append({"type": "Feature", "geometry": mapping(to_wgs84(bld_utm)), "properties": rec})

    print(f"  ✓ Compliance audit complete: {len(violation_records)} violation(s) "
          f"({high_risk_count} HIGH, {med_risk_count} MEDIUM).")

    # ------------------------------------------------------------------
    # [4] ROAD EXTRACTION (OSM VECTORS + CV HOUGH FUSION)   <- RESTORED
    # ------------------------------------------------------------------
    print("[urban][C] Extracting road networks (OSM vectors + CV fallback)...")

    road_lines = []
    data_roads = fetch_osm_roads(bbox)
    if data_roads is not None:
        nodes = {e['id']: (e['lon'], e['lat']) for e in data_roads.get('elements', []) if e['type'] == 'node'}
        for e in data_roads.get('elements', []):
            if e['type'] == 'way' and 'nodes' in e:
                pts = [nodes[nid] for nid in e['nodes'] if nid in nodes]
                if len(pts) >= 2:
                    road_lines.append(LineString(pts))
        if road_lines:
            print(f"  ✓ Retrieved {len(road_lines)} OSM road centerlines.")

    road_mask_osm = np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    for road in road_lines:
        px = np.array([inv_transform * (x, y) for x, y in road.coords])
        if len(px) >= 2:
            cv2.polylines(road_mask_osm, [np.round(px).astype(np.int32).reshape(-1, 1, 2)],
                          isClosed=False, color=255, thickness=ROAD_LINE_THICKNESS)

    road_mask_cv, n_hough_segments = detect_roads_cv(img_np)
    road_mask = cv2.bitwise_or(road_mask_osm, road_mask_cv)

    mask_osm = road_mask_osm > 0
    mask_cv_only = (road_mask_cv > 0) & ~mask_osm
    mask_any = road_mask > 0

    road_overlay = img_np.copy()
    road_overlay[mask_osm] = OVERLAY_COLOR_OSM
    road_overlay[mask_cv_only] = OVERLAY_COLOR_CV
    road_overlay[mask_any] = (ROAD_OVERLAY_ALPHA * road_overlay[mask_any].astype(float)
                              + (1 - ROAD_OVERLAY_ALPHA) * img_np[mask_any].astype(float)).astype(np.uint8)

    print(f"  ✓ Fused road mask built: {len(road_lines)} OSM centerlines + {n_hough_segments} CV Hough segments.")

    # ------------------------------------------------------------------
    # [5] EXPORT PATHS (exact filenames main.py's `downloads` expects)
    # ------------------------------------------------------------------
    audit_fig_path    = os.path.join(output_dir, "comprehensive_spatial_audit.png")
    road_fig_path     = os.path.join(output_dir, "road_detection_panels.png")
    road_overlay_path = os.path.join(output_dir, "road_overlay.png")
    road_mask_path    = os.path.join(output_dir, "road_mask.png")
    bld_geojson_path  = os.path.join(output_dir, "building_footprints.geojson")
    viol_geojson_path = os.path.join(output_dir, "compliance_violations.geojson")
    json_path         = os.path.join(output_dir, "urban_analysis.json")

    Image.fromarray(road_overlay).save(road_overlay_path)
    Image.fromarray(road_mask).save(road_mask_path)

    with open(bld_geojson_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": building_features}, f, indent=2)
    with open(viol_geojson_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": violation_features}, f, indent=2)

    # ------------------------------------------------------------------
    # [6] FIGURE A — Compliance Audit + Grid Density (2 panels)
    # ------------------------------------------------------------------
    print("[urban][D] Rendering comprehensive_spatial_audit.png ...")

    fig_a, ax_a = plt.subplots(1, 2, figsize=(16, 8))

    ax_a[0].imshow(img_np)
    violation_ids = {v["building_id"] for v in violation_records}
    for bld in building_features:
        color = "red" if bld["properties"]["building_id"] in violation_ids else "lime"
        for px_coords in extract_pixel_coords(shape(bld["geometry"]), inv_transform):
            if len(px_coords) > 0:
                ax_a[0].plot(px_coords[:, 0], px_coords[:, 1], color=color, linewidth=1.2)
    ax_a[0].set_title("Compliance Audit Map\n(Green: Compliant, Red: Violated)", fontsize=11, fontweight="bold")
    ax_a[0].axis("off")

    im2 = ax_a[1].imshow(grid_density, cmap="YlOrRd")
    ax_a[1].set_title(f"Building Centroid Count per {grid_block_size}x{grid_block_size}px Grid Block",
                      fontsize=11, fontweight="bold")
    plt.colorbar(im2, ax=ax_a[1], fraction=0.046, pad=0.04)
    for y in range(grid_h):
        for x in range(grid_w):
            count = grid_density[y, x]
            if count > 0:
                ax_a[1].text(x, y, str(count), ha="center", va="center", color="black", fontsize=7, weight="bold")
    ax_a[1].axis("off")

    plt.tight_layout()
    plt.savefig(audit_fig_path, bbox_inches="tight", dpi=200)
    plt.close(fig_a)

    # ------------------------------------------------------------------
    # [7] FIGURE B — Road Detection Panels (3 panels)   <- RESTORED
    # ------------------------------------------------------------------
    print("[urban][E] Rendering road_detection_panels.png ...")

    fig_b, ax_b = plt.subplots(1, 3, figsize=(22, 7))

    ax_b[0].imshow(img_np)
    ax_b[0].set_title("Original Satellite Imagery (RGB)", fontsize=12, fontweight="bold")
    ax_b[0].axis("off")

    ax_b[1].imshow(road_mask, cmap="gray")
    ax_b[1].set_title("Extracted Binary Road Mask", fontsize=12, fontweight="bold")
    ax_b[1].axis("off")

    ax_b[2].imshow(road_overlay)
    ax_b[2].set_title("Detected Road Network Overlay\n(Yellow: OSM | Cyan: CV Filtered)", fontsize=12, fontweight="bold")
    ax_b[2].axis("off")
    legend_handles = [
        mpatches.Patch(facecolor="#FFFF00", edgecolor="black", label="OSM Road Vector (Yellow)"),
        mpatches.Patch(facecolor="#00FFFF", edgecolor="black", label="CV Filtered Road Line (Cyan)"),
        mpatches.Patch(facecolor="#333333", edgecolor="white", label="Satellite Background"),
    ]
    ax_b[2].legend(handles=legend_handles, loc="lower right", facecolor="black",
                   labelcolor="white", framealpha=0.8, fontsize=9)

    plt.tight_layout()
    plt.savefig(road_fig_path, bbox_inches="tight", dpi=200)
    plt.close(fig_b)

    # ------------------------------------------------------------------
    # [8] SUMMARY PAYLOAD -> urban_analysis.json + return dict
    # ------------------------------------------------------------------
    occupied_blocks = grid_density[grid_density > 0]
    max_block = int(grid_density.max()) if grid_density.size else 0
    mean_block_density = float(occupied_blocks.mean()) if occupied_blocks.size > 0 else 0.0

    urban_analysis_data = {
        "bbox": bbox,
        "utm_crs": f"EPSG:{utm_epsg}",
        "image_resolution_px": [int(IMG_W), int(IMG_H)],
        "total_detected_buildings": len(building_features),
        "permanent_structures": n_permanent,
        "temporary_sheds": n_temporary,
        "regulatory_violations": len(violation_records),
        "high_risk_violations": high_risk_count,
        "medium_risk_violations": med_risk_count,
        "water_buffer_distance_m": water_buffer_m,
        "grid_block_size_px": grid_block_size,
        "max_buildings_in_grid_block": max_block,
        "occupied_grid_blocks": int(occupied_blocks.size),
        "total_grid_blocks": int(grid_h * grid_w),
        "mean_block_density_occupied": round(mean_block_density, 2),
        "osm_road_lines_count": len(road_lines),
        "cv_hough_segments_count": int(n_hough_segments),
        "total_road_segments_osm_plus_cv": len(road_lines) + int(n_hough_segments),
        # ---- Keys required by backend/main.py Step 6 ----
        "audit_map": audit_fig_path,
        "road_panels": road_fig_path,
        "road_overlay": road_overlay_path,
        "road_mask": road_mask_path,
        "building_footprints_geojson": bld_geojson_path,
        "compliance_violations_geojson": viol_geojson_path,
        "violations_sample": violation_records[:10],
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(urban_analysis_data, f, indent=4)

    print("✓ [urban] All analyses complete. Outputs exported.")
    return urban_analysis_data


# ------------------------------------------------------------------------------
# CLI ENTRY POINT
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Urban Compliance & Grid Density Audit")
    parser.add_argument("--input", "-i", required=True, help="Path to input satellite/SR image")
    parser.add_argument("--bbox", "-b", nargs=4, type=float, required=True,
                        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"))
    parser.add_argument("--output", "-o", default="outputs")
    args = parser.parse_args()

    run_urban_analysis(sr_img=args.input, bbox=list(args.bbox), output_dir=args.output)