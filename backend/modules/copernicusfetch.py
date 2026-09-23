"""
Copernicus Data Space Ecosystem (CDSE) Sentinel-2 Ingestion Module.
Drop-in replacement for modules/stac_fetcher.py (Planetary Computer backend).

Flow:
  1. CDSE STAC search (https://stac.dataspace.copernicus.eu/v1) -> best scene by cloud %
  2. openEO server-side clip (https://openeo.dataspace.copernicus.eu)
     -> downloads ONLY the AOI (a few MB) at 10 m: B02, B03, B04, B08, SCL
  3. SCL usable-pixel check + notebook-parity per-channel percentile stretch
  4. Returns the SAME dict contract as stac_fetcher.fetch_sentinel2_data()

Authentication (in priority order):
  1. Client credentials from backend/.env -> OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET
     (headless, no browser; created at shapps.dataspace.copernicus.eu/dashboard ->
      Account -> Settings -> Your OAuth clients -> Grant type: Client credentials)
  2. Interactive OIDC device flow (browser) — ONLY if env credentials are absent.
  3. Planetary Computer fallback (modules/stac_fetcher) — emergency path so the API
     keeps working; disable with env SR_NO_PC_FALLBACK=1.

One-time auth verification:   py -m modules.copernicusfetch
"""

import os
import time
import numpy as np

CDSE_STAC_URL = "https://stac.dataspace.copernicus.eu/v1"
OPENEO_URL = "https://openeo.dataspace.copernicus.eu"
COLLECTION = "sentinel-2-l2a"
BANDS = ["B02", "B03", "B04", "B08", "SCL"]

# SCL classes counted as usable surface pixels (vegetation, not-vegetated, water, unclassified)
SCL_USABLE = (4, 5, 6, 7)

ALLOW_PC_FALLBACK = os.environ.get("SR_NO_PC_FALLBACK", "0") != "1"


# ---------------------------------------------------------------------------
# .env loading (backend/.env) — runs at import, loud diagnostics
# ---------------------------------------------------------------------------
def _load_dotenv():
    try:
        from dotenv import load_dotenv
    except ImportError:
        print("[CDSE] python-dotenv not installed — cannot load backend/.env "
              "(fix: py -m pip install python-dotenv)")
        return
    here = os.path.dirname(os.path.abspath(__file__))          # .../backend/modules
    candidates = (
        os.path.join(os.path.dirname(here), ".env"),           # backend/.env
        os.path.join(here, ".env"),                            # modules/.env
        os.path.join(os.getcwd(), ".env"),                     # cwd/.env
    )
    for cand in candidates:
        if os.path.exists(cand):
            load_dotenv(cand, override=False)
            found = bool(os.environ.get("OPENEO_CLIENT_ID")
                         and os.environ.get("OPENEO_CLIENT_SECRET"))
            print(f"[CDSE] Loaded env file: {cand} | client credentials present: {found}")
            return
    print("[CDSE] No .env file found (expected backend/.env) — "
          "interactive OIDC browser login will be used if openEO is needed.")


_load_dotenv()


# ---------------------------------------------------------------------------
# Auth: client credentials first (headless), device flow as visible fallback
# ---------------------------------------------------------------------------
def _authenticate(conn):
    cid = os.environ.get("OPENEO_CLIENT_ID")
    sec = os.environ.get("OPENEO_CLIENT_SECRET")
    if cid and sec:
        print("[CDSE] Auth: client credentials (OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET).")
        return conn.authenticate_oidc_client_credentials(
            client_id=cid, client_secret=sec
        )
    print("[CDSE] No client credentials in env — interactive OIDC (browser) will open. "
          "Fix: create backend/.env with OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET.")
    return conn.authenticate_oidc()


# One authenticated connection per process; the openEO client auto-refreshes
# the access token, so a cached connection stays valid indefinitely.
_CONN = None


def _get_connection():
    global _CONN
    if _CONN is None:
        import openeo
        _CONN = _authenticate(openeo.connect(OPENEO_URL))
    return _CONN


def calculate_bbox(latitude: float, longitude: float, aoi_km: float = 5.12):
    """AOI centre + size (km) -> EPSG:4326 bbox [west, south, east, north]."""
    half_m = (aoi_km * 1000.0) / 2.0
    half_lat = half_m / 111_320.0
    half_lon = half_m / max(111_320.0 * np.cos(np.radians(latitude)), 1e-6)
    return [longitude - half_lon, latitude - half_lat,
            longitude + half_lon, latitude + half_lat]


def _search_best_scenes(bbox, date_range, max_cloud, limit=4):
    from pystac_client import Client
    cat = Client.open(CDSE_STAC_URL)  # CDSE STAC needs no signing
    try:
        q = cat.search(collections=[COLLECTION], bbox=bbox, datetime=date_range,
                       query={"eo:cloud_cover": {"lt": float(max_cloud) + 1}})
        items = list(q.item_collection())
    except Exception:
        q = cat.search(collections=[COLLECTION], bbox=bbox, datetime=date_range)
        items = [it for it in q.item_collection()
                 if it.properties.get("eo:cloud_cover", 100) <= max_cloud + 40]
    items.sort(key=lambda it: it.properties.get("eo:cloud_cover", 100))
    return items[:limit]


def _download_clip(bbox, date_str, out_tif):
    conn = _get_connection()                                   # <-- client-credentials auth
    cube = conn.load_collection(
        "SENTINEL2_L2A",
        spatial_extent={"west": bbox[0], "south": bbox[1],
                        "east": bbox[2], "north": bbox[3], "crs": "EPSG:4326"},
        temporal_extent=[date_str, date_str],
        bands=BANDS,
        max_cloud_cover=100,
    )
    try:  # harmonise all bands (incl. 20 m SCL) onto one common 10 m grid
        cube = cube.resample_spatial(resolution=10, method="near")
    except Exception:
        pass
    cube.download(out_tif)  # sync download; a 5 km x 5-band clip is a few MB


def _read_clip(tif):
    import rasterio
    with rasterio.open(tif) as src:
        tf, crs = src.transform, src.crs
        arrs = src.read().astype(np.float32)
        desc = [(d or "").upper() for d in (src.descriptions or ())]

    def pick(name, idx):
        for i, d in enumerate(desc):
            if name in d and i < arrs.shape[0]:
                return arrs[i]
        return arrs[min(idx, arrs.shape[0] - 1)]

    b02, b03 = pick("B02", 0), pick("B03", 1)
    b04, b08 = pick("B04", 2), pick("B08", 3)
    scl = pick("SCL", 4)
    return b02, b03, b04, b08, scl, tf, crs


def _stretch(rgb_dn):
    """Notebook Cell 2 parity: per-channel 2-98 percentile stretch over valid (finite & >0) pixels."""
    vis = np.zeros(rgb_dn.shape, np.float32)
    for c in range(3):
        b = rgb_dn[..., c]
        valid = b[np.isfinite(b) & (b > 0)]
        if valid.size == 0:
            raise RuntimeError("No valid pixels in AOI — pick another date/AOI.")
        lo, hi = np.percentile(valid, 2), np.percentile(valid, 98)
        vis[..., c] = np.clip((b - lo) / (hi - lo + 1e-8), 0, 1)
    return vis


def _pc_fallback(latitude, longitude, aoi_km, date_range, max_cloud, min_usable):
    """Emergency fallback to the existing Planetary Computer fetcher (same contract)."""
    try:
        from modules.stac_fetcher import fetch_sentinel2_data as _pc_fetch
    except ImportError:
        from stac_fetcher import fetch_sentinel2_data as _pc_fetch
    print("[CDSE] >>> FALLBACK: using Planetary Computer stac_fetcher "
          "(set SR_NO_PC_FALLBACK=1 to disable).")
    # NOTE: stac_fetcher has no output_dir parameter — do not pass one.
    res = _pc_fetch(latitude=latitude, longitude=longitude, aoi_km=aoi_km,
                    date_range=date_range, max_cloud=max_cloud, min_usable=min_usable)
    res["source_backend"] = "planetary_computer_fallback"
    return res


def fetch_sentinel2_data(latitude, longitude, aoi_km=5.12,
                         date_range="2024-01-01/2026-09-01",
                         max_cloud=15, min_usable=0.35, output_dir=None):
    """CDSE ingestion — same return contract as stac_fetcher.fetch_sentinel2_data()."""
    t0 = time.time()

    # ---- Fail fast: openEO module present? ------------------------------------
    try:
        import openeo  # noqa: F401
    except ImportError:
        print("[CDSE] FATAL: the 'openeo' package is not installed.")
        print("[CDSE] Fix:  py -m pip install openeo")
        if ALLOW_PC_FALLBACK:
            return _pc_fallback(latitude, longitude, aoi_km, date_range,
                                max_cloud, min_usable)
        raise RuntimeError(
            "Copernicus ingestion requires the 'openeo' package. "
            "Install it with:  py -m pip install openeo"
        )

    bbox = calculate_bbox(latitude, longitude, aoi_km)
    target_px = int(round(aoi_km * 1000.0 / 10.0))   # 5.12 km -> 512 px @ 10 m

    items = _search_best_scenes(bbox, date_range, max_cloud)
    if not items:
        print("[CDSE] No scene under max_cloud — relaxing tolerance +40%.")
        items = _search_best_scenes(bbox, date_range, max_cloud + 40)
    if not items:
        raise RuntimeError("No Sentinel-2 L2A scene found — widen date range.")

    errors = []
    for item in items:
        item_id = item.id
        date_str = (item.properties.get("datetime") or "")[:10]
        cc = float(item.properties.get("eo:cloud_cover", 0.0))
        print(f"[CDSE] Candidate {item_id} | {date_str} | cloud {cc:.1f}%")

        out_dir = output_dir or "outputs"
        os.makedirs(out_dir, exist_ok=True)
        tif = os.path.join(out_dir, f"s2_clip_{item_id}.tif")

        if not (os.path.exists(tif) and os.path.getsize(tif) > 0):  # per-scene cache
            try:
                _download_clip(bbox, date_str, tif)
            except Exception as e:
                msg = str(e)
                print(f"[CDSE] openEO download failed for {item_id}: {msg[:300]}")
                errors.append(f"{item_id}: {msg[:200]}")
                low = msg.lower()
                if "invalid_client" in low or "unauthorized_client" in low or "401" in low:
                    print("[CDSE] Hint: check OPENEO_CLIENT_ID / OPENEO_CLIENT_SECRET in "
                          "backend/.env — the OAuth client must use the 'Client "
                          "credentials' grant type.")
                elif "oidc" in low or "authentication" in low or "device" in low:
                    print("[CDSE] Hint: verify auth once with:  py -m modules.copernicusfetch")
                continue

        try:
            b02, b03, b04, b08, scl, tf, crs = _read_clip(tif)
        except Exception as e:
            print(f"[CDSE] clip read failed for {item_id}: {e}")
            errors.append(f"{item_id} read: {e}")
            continue

        # Centre-crop all bands to one common n_px x n_px grid @10 m
        h, w = b04.shape
        take = min(target_px, h, w)
        r0, c0 = max(0, (h - take) // 2), max(0, (w - take) // 2)
        sl = (slice(r0, r0 + take), slice(c0, c0 + take))
        b02c, b03c, b04c, b08c, sclc = b02[sl], b03[sl], b04[sl], b08[sl], scl[sl]

        from rasterio import Affine
        tf_c = tf * Affine.translation(c0, r0)

        usable = float(np.isin(sclc.astype(np.int32), SCL_USABLE).mean())
        print(f"[CDSE] usable SCL fraction: {usable:.2f} (min required {min_usable})")
        if usable < min_usable:
            errors.append(f"{item_id}: SCL usable {usable:.2f} < {min_usable}")
            continue

        rgb_dn = np.stack([b04c, b03c, b02c], -1) / 10000.0
        rgb_vis = _stretch(rgb_dn)
        print(f"[CDSE] Scene ready in {time.time() - t0:.1f}s | grid {take}x{take} @ 10 m")

        return {
            "item_id": item_id,
            "date": date_str,
            "cloud_cover": cc,
            "usable_pct": round(usable * 100.0, 1),
            "crsw": str(crs),                                  # str: JSON-serializable
            "bbox": bbox,
            "n_px": take,
            "rgb_vis": rgb_vis,
            "tf10": tf_c,
            "bands": {"B02": b02c, "B03": b03c, "B04": b04c, "B08": b08c},
            "clip_tif": tif,
            "source_backend": "cdse_openeo",
        }

    # All candidates exhausted — fall back if allowed, else raise an honest error
    if ALLOW_PC_FALLBACK:
        return _pc_fallback(latitude, longitude, aoi_km, date_range,
                            max_cloud, min_usable)

    raise RuntimeError(
        "No usable CDSE scene. Per-candidate errors:\n  - " + "\n  - ".join(errors)
    )


if __name__ == "__main__":
    # One-time auth verification (headless when .env credentials are present):
    #   py -m modules.copernicusfetch
    _get_connection()
    print("CDSE authentication successful.")