"""
Crop Monitoring from RFMSR Output + Sentinel-2 Spectral Data Module.
Calculates NDVI from original Sentinel-2 B04 (Red) and B08 (NIR) measurements
and projects onto the RFMSR 4x super-resolved output display grid.
Preserves exact logic, thresholds, condition classes, and colormaps from user specification.
"""

import os
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from PIL import Image

# -----------------------------
# Configurable NDVI thresholds
# -----------------------------
VEGETATION_THRESHOLD = 0.40
STRESS_LOWER_THRESHOLD = 0.20
STRESS_UPPER_THRESHOLD = 0.40

# Crop-condition thresholds
BARE_THRESHOLD = 0.20
MODERATE_THRESHOLD = 0.60
HEALTHY_THRESHOLD = 0.80

RFMSR_SCALE = 4


def run_crop_monitoring(
    rfmsr_img,
    red_band: np.ndarray,
    nir_band: np.ndarray,
    scene_id: str = "Sentinel-2",
    observation_date: str = "Unknown",
    cloud_cover: float = 0.0,
    output_dir: str = "outputs"
) -> dict:
    """
    Executes the complete Crop Monitoring pipeline:
    1. Computes NDVI from native 10 m Red (B04) & NIR (B08)
    2. Computes NDVI statistics (min, max, mean, median)
    3. Categorizes vegetation coverage and possible vegetation stress
    4. Evaluates 5-class crop condition distribution
    5. Resamples NDVI & condition map to RFMSR output resolution grid
    6. Renders & exports crop_ndvi_map.png, crop_health_map.png, crop_monitoring_comparison.png, and crop_monitoring.json
    """
    os.makedirs(output_dir, exist_ok=True)

    ndvi_map_path = os.path.join(output_dir, "crop_ndvi_map.png")
    health_map_path = os.path.join(output_dir, "crop_health_map.png")
    comparison_path = os.path.join(output_dir, "crop_monitoring_comparison.png")
    json_path = os.path.join(output_dir, "crop_monitoring.json")

    # Convert to float32 & handle invalid pixels
    red_data = red_band.astype(np.float32)
    nir_data = nir_band.astype(np.float32)

    invalid_mask = (
        ~np.isfinite(red_data)
        | ~np.isfinite(nir_data)
        | (red_data < 0)
        | (nir_data < 0)
    )

    denominator = nir_data + red_data
    zero_denominator = denominator == 0
    invalid_mask |= zero_denominator

    ndvi = np.full(red_data.shape, np.nan, dtype=np.float32)
    valid_pixels = ~invalid_mask

    ndvi[valid_pixels] = (
        (nir_data[valid_pixels] - red_data[valid_pixels])
        / denominator[valid_pixels]
    )

    # Remove impossible / non-finite NDVI values
    invalid_ndvi = (
        ~np.isfinite(ndvi)
        | (ndvi < -1.0)
        | (ndvi > 1.0)
    )
    ndvi[invalid_ndvi] = np.nan

    valid_ndvi = ndvi[np.isfinite(ndvi)]
    if valid_ndvi.size == 0:
        ndvi_min = 0.0
        ndvi_max = 0.0
        ndvi_mean = 0.0
        ndvi_median = 0.0
        valid_pixel_count = 1
    else:
        ndvi_min = float(np.min(valid_ndvi))
        ndvi_max = float(np.max(valid_ndvi))
        ndvi_mean = float(np.mean(valid_ndvi))
        ndvi_median = float(np.median(valid_ndvi))
        valid_pixel_count = np.count_nonzero(np.isfinite(ndvi))

    # Vegetation coverage (NDVI >= 0.40)
    vegetation_mask = (
        np.isfinite(ndvi)
        & (ndvi >= VEGETATION_THRESHOLD)
    )
    vegetation_pixel_count = np.count_nonzero(vegetation_mask)
    vegetation_coverage_percent = (
        vegetation_pixel_count / max(valid_pixel_count, 1) * 100.0
    )

    # Possible vegetation stress (0.20 <= NDVI < 0.40)
    possible_stress_mask = (
        np.isfinite(ndvi)
        & (ndvi >= STRESS_LOWER_THRESHOLD)
        & (ndvi < STRESS_UPPER_THRESHOLD)
    )
    possible_stress_count = np.count_nonzero(possible_stress_mask)
    possible_stress_percent = (
        possible_stress_count / max(valid_pixel_count, 1) * 100.0
    )

    # Crop condition classification
    condition_map = np.full(ndvi.shape, -1, dtype=np.int8)
    condition_map[np.isfinite(ndvi) & (ndvi < BARE_THRESHOLD)] = 0
    condition_map[np.isfinite(ndvi) & (ndvi >= BARE_THRESHOLD) & (ndvi < VEGETATION_THRESHOLD)] = 1
    condition_map[np.isfinite(ndvi) & (ndvi >= VEGETATION_THRESHOLD) & (ndvi < MODERATE_THRESHOLD)] = 2
    condition_map[np.isfinite(ndvi) & (ndvi >= MODERATE_THRESHOLD) & (ndvi < HEALTHY_THRESHOLD)] = 3
    condition_map[np.isfinite(ndvi) & (ndvi >= HEALTHY_THRESHOLD)] = 4

    condition_names = {
        0: "bare",
        1: "possible_stress",
        2: "moderate",
        3: "healthy",
        4: "very_healthy"
    }

    condition_distribution = {}
    for class_id, name in condition_names.items():
        count = np.count_nonzero(condition_map == class_id)
        percentage = (
            count / valid_pixel_count * 100.0
            if valid_pixel_count > 0
            else 0.0
        )
        condition_distribution[name] = round(float(percentage), 2)

    # Prepare RFMSR output image array
    if isinstance(rfmsr_img, Image.Image):
        rfmsr_array = np.array(rfmsr_img)
    else:
        rfmsr_array = np.asarray(rfmsr_img)

    if rfmsr_array.ndim == 2:
        rfmsr_array = np.stack([rfmsr_array] * 3, axis=-1)
    if rfmsr_array.shape[-1] > 3:
        rfmsr_array = rfmsr_array[..., :3]

    if rfmsr_array.dtype in (np.float32, np.float64) and rfmsr_array.max() <= 1.0:
        rfmsr_array = np.clip(rfmsr_array * 255.0, 0, 255).astype(np.uint8)

    rfmsr_height, rfmsr_width = rfmsr_array.shape[:2]

    # Resample NDVI to RFMSR display grid
    ndvi_filled = np.nan_to_num(ndvi, nan=0.0)
    validity = np.isfinite(ndvi).astype(np.uint8)

    ndvi_highres = np.array(
        Image.fromarray(ndvi_filled.astype(np.float32))
        .resize((rfmsr_width, rfmsr_height), resample=Image.Resampling.BILINEAR),
        dtype=np.float32
    )

    validity_highres = np.array(
        Image.fromarray(validity)
        .resize((rfmsr_width, rfmsr_height), resample=Image.Resampling.NEAREST)
    )

    ndvi_highres[validity_highres == 0] = np.nan

    # Resample classified map to RFMSR grid
    cond_for_resize = np.where(condition_map >= 0, condition_map.astype(np.int16), 255).astype(np.uint8)
    condition_highres = np.array(
        Image.fromarray(cond_for_resize).resize(
            (rfmsr_width, rfmsr_height), resample=Image.Resampling.NEAREST
        )
    ).astype(np.int16)
    condition_highres[condition_highres == 255] = -1

    # 1. NDVI Map
    fig1 = plt.figure(figsize=(10, 10))
    im1 = plt.imshow(ndvi_highres, cmap="RdYlGn", vmin=-1, vmax=1)
    plt.colorbar(im1, label="NDVI")
    plt.title(
        f"Crop Monitoring - Sentinel-2 NDVI\n"
        f"Scene: {scene_id}\n"
        f"NDVI Range: {ndvi_min:.3f} to {ndvi_max:.3f}",
        fontsize=12,
        fontweight="bold"
    )
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(ndvi_map_path, dpi=200, bbox_inches="tight")
    plt.close(fig1)

    # 2. Crop Condition Map
    condition_colors = ["dimgray", "gold", "yellowgreen", "green", "darkgreen"]
    condition_cmap = ListedColormap(condition_colors)

    fig2 = plt.figure(figsize=(10, 10))
    masked_condition = np.ma.masked_where(condition_highres < 0, condition_highres)
    im2 = plt.imshow(masked_condition, cmap=condition_cmap, vmin=0, vmax=4)
    cbar = plt.colorbar(im2, ticks=[0, 1, 2, 3, 4])
    cbar.ax.set_yticklabels([
        "Bare / Non-vegetation",
        "Low / Possible Stress",
        "Moderate Vegetation",
        "Healthy Vegetation",
        "Very Healthy Vegetation"
    ])
    plt.title("Indicative Crop Vegetation Condition Map", fontsize=12, fontweight="bold")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(health_map_path, dpi=200, bbox_inches="tight")
    plt.close(fig2)

    # 3. RFMSR + NDVI Side-by-Side Comparison
    fig3, axes = plt.subplots(1, 2, figsize=(14, 7))
    axes[0].imshow(rfmsr_array)
    axes[0].set_title("RFMSR ?4 RGB\nHigh-Resolution Visual Background", fontsize=11, fontweight="bold")
    axes[0].axis("off")

    ndvi_plot = axes[1].imshow(ndvi_highres, cmap="RdYlGn", vmin=-1, vmax=1)
    axes[1].set_title("Sentinel-2 NDVI\nB08 NIR + B04 Red", fontsize=11, fontweight="bold")
    axes[1].axis("off")

    fig3.colorbar(ndvi_plot, ax=axes[1], fraction=0.046, pad=0.04, label="NDVI")
    fig3.suptitle("Crop Monitoring: RFMSR Visual Enhancement + Sentinel-2 Spectral Analysis", fontsize=13, fontweight="bold")
    plt.tight_layout()
    plt.savefig(comparison_path, dpi=200, bbox_inches="tight")
    plt.close(fig3)

    # Summary JSON dictionary
    crop_monitoring_data = {
        "source": "Sentinel-2",
        "scene_id": str(scene_id),
        "observation_date": str(observation_date),
        "cloud_cover": float(cloud_cover) if cloud_cover is not None else 0.0,
        "original_resolution": "10 m",
        "sr_resolution": "2.5 m",
        "mean_ndvi": round(ndvi_mean, 4),
        "median_ndvi": round(ndvi_median, 4),
        "min_ndvi": round(ndvi_min, 4),
        "max_ndvi": round(ndvi_max, 4),
        "vegetation_coverage_percent": round(vegetation_coverage_percent, 2),
        "possible_stress_percent": round(possible_stress_percent, 2),
        "crop_condition": condition_distribution,
        "ndvi_map": ndvi_map_path,
        "health_map": health_map_path,
        "comparison": comparison_path,
        "ndvi_thresholds": {
            "vegetation": VEGETATION_THRESHOLD,
            "possible_stress_lower": STRESS_LOWER_THRESHOLD,
            "possible_stress_upper": STRESS_UPPER_THRESHOLD,
            "moderate_upper": MODERATE_THRESHOLD,
            "healthy_upper": HEALTHY_THRESHOLD
        },
        "scientific_note": (
            "NDVI is calculated from the original Sentinel-2 B04 Red and B08 NIR measurements "
            "and displayed on the RFMSR high-resolution grid for visualization. This does not "
            "constitute true 2.5 m NIR super-resolution."
        ),
        "interpretation_note": (
            "Crop condition categories are indicative vegetation vigor/condition indicators. "
            "Thresholds should be calibrated using local crop and ground-truth data. Possible "
            "vegetation stress is not confirmed crop disease and requires field validation."
        )
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(crop_monitoring_data, f, indent=4)

    return crop_monitoring_data