"""
STAC Fetcher Module for Sentinel-2 L2A via Microsoft Planetary Computer.
Extracts radiometric RGB + NIR + SCL bands centred on target coordinates.
Preserves exact logic from rfmsrh.ipynb and rfmsrh_(1).ipynb.
Features automatic GDAL retry, single-pass SAS signing, and disk caching to prevent 503 errors.
"""

import os
import time
import numpy as np
from PIL import Image

# Configure GDAL environment for resilient cloud-native COG access
os.environ.setdefault("GDAL_HTTP_MAX_RETRY", "5")
os.environ.setdefault("GDAL_HTTP_RETRY_DELAY", "3")
os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
os.environ.setdefault("CPL_VSIL_CURL_ALLOWED_EXTENSIONS", ".tif,.tiff")
os.environ.setdefault("VSI_CACHE", "TRUE")
os.environ.setdefault("VSI_CACHE_SIZE", "50000000")

try:
    import rasterio
    import pystac_client
    import planetary_computer
    from rasterio.transform import Affine, array_bounds
    from rasterio.warp import transform as _warp
    STAC_AVAILABLE = True
except ImportError:
    STAC_AVAILABLE = False


def calculate_bbox(latitude: float, longitude: float, aoi_km: float = 5.12):
    """
    Snap AOI to a multiple of 512 px (10 m px), capped at 2048 (≈20.5 km).
    Matches exact Notebook 1/2 formulas:
    N_PX = max(512, min(2048, int(round(aoi_km * 1000 / 10 / 512)) * 512))
    HALF_DEG = N_PX * 10 / 2 / 111320.0
    BBOX = [longitude - HALF_DEG, latitude - HALF_DEG, longitude + HALF_DEG, latitude + HALF_DEG]
    """
    n_px = max(512, min(2048, int(round(aoi_km * 1000 / 10 / 512)) * 512))
    half_deg = n_px * 10.0 / 2.0 / 111320.0
    bbox = [
        longitude - half_deg,
        latitude - half_deg,
        longitude + half_deg,
        latitude + half_deg,
    ]
    return n_px, half_deg, bbox


def _with_retry(fn, max_retries=3, base_delay=2.0, name="operation"):
    """Executes a callable with exponential backoff on transient errors (including 503)."""
    last_err = None
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            last_err = e
            err_str = str(e)
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                print(f"STAC {name} attempt {attempt + 1} failed ({err_str[:80]}). Retrying in {wait_time:.1f}s...")
                time.sleep(wait_time)
            else:
                print(f"STAC {name} all {max_retries} attempts failed: {err_str[:120]}")
    raise last_err


def fetch_sentinel2_data(
    latitude: float,
    longitude: float,
    aoi_km: float = 5.12,
    date_range: str = "2024-01-01/2026-09-01",
    max_cloud: int = 15,
    min_usable: float = 0.35,
):
    """
    Searches Planetary Computer STAC catalog, validates usable pixels via SCL,
    and extracts 10 m resolution RGB (B04/B03/B02) and NIR (B08) arrays.
    Uses caching and exponential retry to prevent 503 Service Unavailable errors.
    """
    n_px, half_deg, bbox = calculate_bbox(latitude, longitude, aoi_km)

    if not STAC_AVAILABLE:
        raise RuntimeError("rasterio, pystac_client, or planetary_computer not installed.")

    # Check local cache first to avoid redundant downloads & network 503s
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache")
    os.makedirs(cache_dir, exist_ok=True)
    cache_key = f"s2_{latitude:.4f}_{longitude:.4f}_{aoi_km:.2f}".replace(".", "p").replace("-", "m")
    cache_file = os.path.join(cache_dir, f"{cache_key}.npz")

    if os.path.exists(cache_file):
        try:
            print(f"Loading cached Sentinel-2 data from {cache_file}...")
            data = np.load(cache_file, allow_pickle=True)
            rgb_vis = data["rgb_vis"]
            raw_rgb = data["raw_rgb"]
            b04 = data["b04"]
            b03 = data["b03"]
            b02 = data["b02"]
            b08 = data["b08"] if "b08" in data and data["b08"].size > 0 else None
            meta = data["meta"].item() if hasattr(data["meta"], "item") else data["meta"]
            
            bands = {"B04": b04, "B03": b03, "B02": b02}
            if b08 is not None:
                bands["B08"] = b08

            tf10 = Affine.from_gdal(*meta["tf10_gdal"])
            return {
                "item_id": meta["item_id"],
                "date": meta["date"],
                "cloud_cover": float(meta["cloud_cover"]),
                "usable_pct": float(meta["usable_pct"]),
                "rgb_vis": rgb_vis,
                "raw_rgb": raw_rgb,
                "bands": bands,
                "tf10": tf10,
                "crsw": meta["crsw"],
                "window": None,
                "bbox": bbox,
                "n_px": n_px,
                "cached": True
            }
        except Exception as e:
            print(f"Cache read error, proceeding to live fetch: {e}")

    try:
        catalog = _with_retry(
            lambda: pystac_client.Client.open(
                "https://planetarycomputer.microsoft.com/api/stac/v1",
                modifier=planetary_computer.sign_inplace,
            ),
            max_retries=3,
            base_delay=2.0,
            name="open catalog"
        )

        def find_item(mc):
            s = catalog.search(
                collections=["sentinel-2-l2a"],
                bbox=bbox,
                datetime=date_range,
                query={"eo:cloud_cover": {"lt": mc}},
            )
            items = sorted(
                s.item_collection(),
                key=lambda x: x.properties.get("eo:cloud_cover", 100),
            )
            return items[0] if items else None

        # Cascade search as in Notebooks: MAX_CLOUD -> +10 -> +40
        item = _with_retry(
            lambda: find_item(max_cloud) or find_item(max_cloud + 10) or find_item(max_cloud + 40),
            max_retries=3,
            base_delay=2.0,
            name="search item"
        )

        if item is None:
            raise RuntimeError(
                f"No Sentinel-2 scene found for AOI [{bbox}] and dates [{date_range}]. "
                "Try widening the date range or raising maximum cloud cover."
            )

        # Single-pass SAS token sign to avoid spamming the token service with 6 redundant requests
        signed_item = _with_retry(
            lambda: planetary_computer.sign(item),
            max_retries=3,
            base_delay=2.0,
            name="sign item assets"
        )

        # Window opener with lon/lat -> scene CRS warp
        def open_window(asset_key, target_size=None):
            if asset_key not in signed_item.assets:
                return None, None, None, None

            url = signed_item.assets[asset_key].href

            def _read_window():
                with rasterio.open(url) as src:
                    xs, ys = _warp("EPSG:4326", src.crs, [bbox[0], bbox[2]], [bbox[1], bbox[3]])
                    win = rasterio.windows.from_bounds(
                        min(xs), min(ys), max(xs), max(ys), transform=src.transform
                    )
                    cx, cy = win.col_off + win.width / 2.0, win.row_off + win.height / 2.0
                    sz = target_size or min(int(round(win.width)), int(round(win.height)))
                    sz = max(1, min(sz, src.width, src.height))
                    col0 = max(0, min(src.width - sz, int(round(cx - sz / 2.0))))
                    row0 = max(0, min(src.height - sz, int(round(cy - sz / 2.0))))
                    target_win = rasterio.windows.Window(col0, row0, sz, sz)
                    arr = src.read(1, window=target_win, boundless=True, fill_value=0).astype(np.float32)
                    tf = src.window_transform(target_win)
                    return arr, tf, src.crs, target_win

            return _with_retry(_read_window, max_retries=3, base_delay=1.5, name=f"read band {asset_key}")

        # SCL sanity check
        usable_fraction = 1.0
        try:
            scl, _, _, _ = open_window("SCL", target_size=min(256, n_px))
            if scl is not None:
                usable_fraction = float(np.isin(scl.astype(int), [4, 5, 6, 7, 11]).mean())
                if usable_fraction < min_usable:
                    print(
                        f"Warning: AOI scene usable fraction {usable_fraction*100:.1f}% is below {min_usable*100:.1f}%"
                    )
        except Exception as e:
            print(f"SCL usable check warning (non-fatal): {e}")

        # Read RGB bands (reading B04 once to get both data and spatial transform)
        b04, tf10, crsw, window = open_window("B04", target_size=n_px)
        b03, _, _, _ = open_window("B03", target_size=n_px)
        b02, _, _, _ = open_window("B02", target_size=n_px)

        # Read NIR band (B08)
        b08, _, _, _ = open_window("B08", target_size=n_px)

        rgb = np.stack([b04, b03, b02], axis=-1).astype(np.float32)

        # Global 2–98% percentile stretch
        rgb_vis = np.zeros_like(rgb)
        for c in range(3):
            band = rgb[..., c]
            valid = band[np.isfinite(band) & (band > 0)]
            if valid.size == 0:
                lo, hi = 0, 1
            else:
                lo, hi = float(np.percentile(valid, 2)), float(np.percentile(valid, 98))
            rgb_vis[..., c] = (band - lo) / (hi - lo + 1e-8)
        rgb_vis = np.clip(rgb_vis, 0, 1)

        bands = {
            "B04": b04,
            "B03": b03,
            "B02": b02,
        }
        if b08 is not None:
            bands["B08"] = b08

        # Save to disk cache for future instant reloads
        try:
            meta_dict = {
                "item_id": item.id,
                "date": str(item.datetime.date()) if hasattr(item, "datetime") and item.datetime else "Unknown",
                "cloud_cover": float(item.properties.get("eo:cloud_cover", 0.0)),
                "usable_pct": round(usable_fraction * 100.0, 1),
                "crsw": str(crsw),
                "tf10_gdal": tf10.to_gdal()
            }
            np.savez_compressed(
                cache_file,
                rgb_vis=rgb_vis,
                raw_rgb=rgb,
                b04=b04,
                b03=b03,
                b02=b02,
                b08=b08 if b08 is not None else np.empty(0),
                meta=meta_dict,
                bbox=np.array(bbox)
            )
            print(f"Cached Sentinel-2 AOI to {cache_file}")
        except Exception as ce:
            print(f"Warning: Failed to write STAC cache: {ce}")

        return {
            "item_id": item.id,
            "date": str(item.datetime.date()) if hasattr(item, "datetime") and item.datetime else "Unknown",
            "cloud_cover": float(item.properties.get("eo:cloud_cover", 0.0)),
            "usable_pct": round(usable_fraction * 100.0, 1),
            "rgb_vis": rgb_vis,
            "raw_rgb": rgb,
            "bands": bands,
            "tf10": tf10,
            "crsw": str(crsw),
            "window": window,
            "bbox": bbox,
            "n_px": n_px,
            "item": item,
            "cached": False
        }

    except Exception as exc:
        err_msg = str(exc)
        # Check if any cache exists as an emergency fallback
        existing_caches = [f for f in os.listdir(cache_dir) if f.endswith(".npz")]
        if existing_caches:
            fallback_file = os.path.join(cache_dir, existing_caches[0])
            print(f"Planetary Computer service error ({err_msg}). Falling back to cached scene {fallback_file}...")
            try:
                data = np.load(fallback_file, allow_pickle=True)
                meta = data["meta"].item() if hasattr(data["meta"], "item") else data["meta"]
                tf10 = Affine.from_gdal(*meta["tf10_gdal"])
                bands = {"B04": data["b04"], "B03": data["b03"], "B02": data["b02"]}
                if "b08" in data and data["b08"].size > 0:
                    bands["B08"] = data["b08"]
                return {
                    "item_id": meta["item_id"],
                    "date": meta["date"],
                    "cloud_cover": float(meta["cloud_cover"]),
                    "usable_pct": float(meta["usable_pct"]),
                    "rgb_vis": data["rgb_vis"],
                    "raw_rgb": data["raw_rgb"],
                    "bands": bands,
                    "tf10": tf10,
                    "crsw": meta["crsw"],
                    "window": None,
                    "bbox": bbox,
                    "n_px": n_px,
                    "cached": True,
                    "offline_fallback": True
                }
            except Exception as fb_err:
                print(f"Fallback read error: {fb_err}")

        # If no fallback possible, raise a clear human-readable error
        if "503" in err_msg or "Service Unavailable" in err_msg:
            raise RuntimeError(
                "Microsoft Planetary Computer STAC service is temporarily busy (503 Service Unavailable). "
                "The server automatically attempted 3 retries. Please retry in a few moments."
            ) from exc
        raise exc

