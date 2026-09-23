"""
Application Metrics Module — metrics-only port of geospatial_analytics.py.
Computes the SAME quantitative table (10 m vs SR 2.5 m) for the 9 remote-sensing
applications + flood NDWI, and writes srm_application_metrics.csv.
NO 3x3 Atlas, NO zoom strip, NO matplotlib — only a fast PIL comparison strip.
"""

import os
import time
import warnings
warnings.filterwarnings("ignore")
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

from scipy.ndimage import uniform_filter, distance_transform_edt, binary_erosion
from skimage.filters import threshold_otsu, sobel, frangi
from skimage.measure import label, regionprops
from skimage.morphology import white_tophat, disk, skeletonize, remove_small_objects, remove_small_holes
from skimage.transform import probabilistic_hough_line
from sklearn.cluster import KMeans

PX_SR = 2.5


def gray(x): return x.mean(-1)


def vari(x):
    g, r, b = x[..., 1], x[..., 0], x[..., 2]
    return np.clip((g - r) / (g + r + b + 1e-6), -1.0, 1.0)


def lstd(x, s=8):
    m = uniform_filter(x, (s, s, 1))
    m2 = uniform_filter(x * x, (s, s, 1))
    return np.sqrt(np.clip(m2 - m * m, 0, None)).mean(-1)


def clean(m, small=8, hole=32):
    return remove_small_objects(remove_small_holes(m.astype(bool), hole), small)


def shore_km(m, px=PX_SR):
    return float((m ^ binary_erosion(m)).sum() * px / 1000.0)


def compute_application_metrics(bic, sr, bands_data=None, output_dir="outputs",
                                make_comparison=True):
    os.makedirs(output_dir, exist_ok=True)
    m2 = PX_SR ** 2
    s = sr.shape[0]
    km2l = (s * PX_SR / 1000.0) ** 2

    rows = []

    def add_metric(app, label_str, v10, vsr, unit, better):
        v10_f = float(np.round(v10, 2)) if v10 is not None and not np.isnan(v10) else 0.0
        vsr_f = float(np.round(vsr, 2)) if vsr is not None and not np.isnan(vsr) else 0.0
        delta = float(np.round(vsr_f - v10_f, 2))
        pct = float(np.round((vsr_f / v10_f - 1.0) * 100.0, 1)) if v10_f > 0 else 0.0
        rows.append({"Application": app, "Metric": label_str, "10 m": v10_f,
                     "SR 2.5 m": vsr_f, "Delta": delta, "Pct_Change": pct,
                     "Unit": unit, "Better": better})

    # --- identical application models as geospatial_analytics.py ---
    def m_buildings(img):
        wt = white_tophat(gray(img), disk(6))
        thr = threshold_otsu(wt)
        lab0 = label(clean(wt > thr, 6, 64))
        areas = [p.area * m2 for p in regionprops(lab0) if 6 * m2 <= p.area * m2 <= 400 * m2]
        areas = np.array(areas)
        return {"n": len(areas),
                "small": int((areas < 150).sum()) if len(areas) else 0,
                "med": float(np.median(areas)) if len(areas) else 0.0,
                "ha": float(areas.sum() / 1e4)}

    f_sr = frangi(gray(sr), sigmas=range(1, 4), black_ridges=False)
    thr_road = float(np.percentile(f_sr, 97))

    def m_roads(img, f_pre=None):
        f = f_pre if f_pre is not None else frangi(gray(img), sigmas=range(1, 4), black_ridges=False)
        m = clean(f > thr_road, 30, 256)
        sk = skeletonize(m)
        w = 2.0 * distance_transform_edt(m)[sk] * PX_SR
        return {"km": float(sk.sum() * PX_SR / 1000.0),
                "narrow": float((w <= 7.5).sum() * PX_SR / 1000.0),
                "medw": float(np.median(w)) if sk.any() else 0.0}

    def m_fields(img):
        e = sobel(gray(img))
        m = e > threshold_otsu(e) * 0.7
        hw = s // 4
        sub_e = (e * 255).astype(np.uint8)[hw:hw + 2 * hw, hw:hw + 2 * hw]
        ln = probabilistic_hough_line(sub_e, threshold=25, line_length=20, line_gap=3)
        km = sum(np.hypot(x2 - x1, y2 - y1) for (x1, y1), (x2, y2) in ln) * PX_SR / 1000.0
        return {"sharp": float(e[m].mean()) if m.any() else 0.0,
                "seg": len(ln), "km": float(km)}

    def m_damage(img):
        v, g = vari(img), gray(img)
        lab0 = label(clean((v < np.percentile(v, 15)) & (g > np.percentile(g, 60)), 8, 128))
        areas = [p.area * m2 for p in regionprops(lab0) if 8 * m2 <= p.area * m2 <= 800 * m2]
        areas = np.array(areas)
        return {"n": len(areas),
                "smallest": float(areas.min()) if len(areas) else 0.0,
                "ha": float(areas.sum() / 1e4)}

    def m_agri(img):
        v = vari(img)
        e = sobel(v)
        m = e > threshold_otsu(e) * 0.6
        inner = clean(~m, 64, 64)
        lab_inner = label(inner)
        props = [p for p in regionprops(lab_inner) if p.area > 200]
        sigmas = [np.std(v[lab_inner == p.label]) for p in props[:80]]
        return {"parcels": len(props),
                "sigma": float(np.mean(sigmas)) if sigmas else 0.0,
                "edge": float(e[m].mean()) if m.any() else 0.0}

    def m_lc(img, k=6):
        st = 2 if s > 4096 else 1
        f = lambda a: np.concatenate([a, lstd(a)[..., None]], -1)
        km = KMeans(n_clusters=k, n_init=3, random_state=0).fit(f(img[::8, ::8]).reshape(-1, 4))
        if st == 1:
            lab = km.predict(f(img).reshape(-1, 4)).reshape(img.shape[:2])
        else:
            small = km.predict(f(img[::st, ::st]).reshape(-1, 4))
            lab = np.asarray(Image.fromarray(small.astype(np.uint8)).resize((s, s), Image.NEAREST))
        n = sum(len([p for p in regionprops(label(clean(lab == c, 200, 64))) if p.area >= 200])
                for c in range(k))
        bnd = float(((lab[:, 1:] != lab[:, :-1]).mean() + (lab[1:] != lab[:-1]).mean()) * 100.0)
        return {"patches": n, "bnd": bnd}

    def m_urban(img):
        m = clean((gray(img) > threshold_otsu(gray(img))) & (vari(img) < 0.05), 12, 256)
        dens = uniform_filter(m.astype(np.float32), 40)
        n = len([p for p in regionprops(label(clean(dens > 0.25, 100, 4096))) if p.area >= 100])
        return {"pct": float(m.mean() * 100.0), "clusters": n}

    def m_water(img):
        v, g = vari(img), gray(img)
        w = clean((v < 0) & (g < np.median(g)), 6, 128)
        ponds = len([p for p in regionprops(label(w)) if 6 <= p.area <= 800])
        return {"ponds": ponds, "shore": shore_km(w)}

    apps = [("Small buildings", m_buildings), ("Narrow roads", None),
            ("Field boundaries", m_fields), ("Localized damage", m_damage),
            ("Agriculture monitoring", m_agri), ("Land-cover mapping", m_lc),
            ("Urban planning", m_urban), ("Environmental (water)", m_water)]

    for app_name, fn in apps:
        t_app = time.time()
        if app_name == "Narrow roads":
            a, b = m_roads(bic), m_roads(sr, f_sr)
            add_metric(app_name, "Road network length", a["km"], b["km"], "km", "—")
            add_metric(app_name, "Narrow roads <=7.5 m", a["narrow"], b["narrow"], "km", "↑")
            add_metric(app_name, "Median road width", a["medw"], b["medw"], "m", "—")
        elif app_name == "Land-cover mapping":
            a, b = m_lc(bic), m_lc(sr)
            add_metric(app_name, "Coherent patches", a["patches"], b["patches"], "count", "—")
            add_metric(app_name, "Class-boundary density", a["bnd"], b["bnd"], "%", "—")
        else:
            a, b = fn(bic), fn(sr)
            if app_name == "Small buildings":
                add_metric(app_name, "Structures detected", a["n"], b["n"], "count", "↑")
                add_metric(app_name, "Small structures <150 m²", a["small"], b["small"], "count", "↑")
                add_metric(app_name, "Median structure size", a["med"], b["med"], "m²", "—")
                add_metric(app_name, "Total built footprint", a["ha"], b["ha"], "ha", "—")
            elif app_name == "Field boundaries":
                add_metric(app_name, "Edge sharpness (|nabla|)", a["sharp"], b["sharp"], "—", "↑")
                add_metric(app_name, "Straight segments (Hough)", a["seg"], b["seg"], "count", "↑")
                add_metric(app_name, "Segment length", a["km"], b["km"], "km", "—")
            elif app_name == "Localized damage":
                add_metric(app_name, "Anomaly patches", a["n"], b["n"], "count", "↑")
                add_metric(app_name, "Smallest patch detected", a["smallest"], b["smallest"], "m²", "↓")
                add_metric(app_name, "Total anomaly area", a["ha"], b["ha"], "ha", "—")
            elif app_name == "Agriculture monitoring":
                add_metric(app_name, "Field parcels", a["parcels"], b["parcels"], "count", "↑")
                add_metric(app_name, "Within-field sigma(VARI)", a["sigma"], b["sigma"], "—", "↓")
                add_metric(app_name, "VARI edge sharpness", a["edge"], b["edge"], "—", "—")
            elif app_name == "Urban planning":
                add_metric(app_name, "Built-up area", a["pct"], b["pct"], "%", "—")
                add_metric(app_name, "Settlement clusters", a["clusters"], b["clusters"], "count", "—")
            else:
                add_metric(app_name, "Ponds / water bodies", a["ponds"], b["ponds"], "count", "↑")
                add_metric(app_name, "Shoreline length", a["shore"], b["shore"], "km", "↑")
        print(f"[METRICS] {app_name}: {time.time() - t_app:.1f}s")

    # --- Flood NDWI (unchanged) ---
    if bands_data and "B08" in bands_data and "B03" in bands_data:
        b08, b03, b04 = bands_data["B08"], bands_data["B03"], bands_data["B04"]
        nd10 = (b03 - b08) / (b03 + b08 + 1e-6)
        m10u = clean(nd10 > threshold_otsu(nd10[np.isfinite(nd10)]), 4, 64)
        m10u = np.kron(m10u, np.ones((4, 4), bool))[:s, :s]
        fc = np.stack([b08, b04, b03], -1)
        sr_fc = np.asarray(Image.fromarray((np.clip(fc / (fc.max() + 1e-6), 0, 1) * 255)
                                           .astype(np.uint8)).resize((s, s), Image.BICUBIC),
                           np.float32) / 255.0
        nd_sr = (sr_fc[..., 2] - sr_fc[..., 0]) / (sr_fc[..., 2] + sr_fc[..., 0] + 1e-6)
        m_sr = clean(nd_sr > threshold_otsu(nd_sr[np.isfinite(nd_sr)]), 4, 64)
        p10 = len([q for q in regionprops(label(m10u)) if q.area <= 800])
        psr = len([q for q in regionprops(label(m_sr)) if q.area <= 800])
        add_metric("Flood / disaster (NDWI)", "Water extent", m10u.mean() * km2l, m_sr.mean() * km2l, "km²", "—")
        add_metric("Flood / disaster (NDWI)", "Shoreline length", shore_km(m10u), shore_km(m_sr), "km", "↑")
        add_metric("Flood / disaster (NDWI)", "Small water bodies", p10, psr, "count", "↑")

    add_metric("Physical", "Minimum mappable feature", 10.0 ** 2, PX_SR ** 2, "m² (1 px)", "↓")

    df = pd.DataFrame(rows)
    csv_path = os.path.join(output_dir, "srm_application_metrics.csv")
    df.to_csv(csv_path, index=False)

    headlines = [f"{r['Application']}: {r['Metric']} increased from {r['10 m']:.1f} to "
                 f"{r['SR 2.5 m']:.1f} {r['Unit']} (+{r['Pct_Change']:.0f}%)"
                 for _, r in df.iterrows()
                 if r["Better"] == "↑" and r["Delta"] > 0 and r["10 m"] > 0]
    headlines.append("Physical Mapping Unit: 10 m (~100 m² min feature) -> SR 2.5 m "
                     "(~6.25 m² min feature, 16x finer detail)")

    # --- Fast PIL comparison strip (replaces the matplotlib figure) ---
    comp_png = None
    if make_comparison:
        def labelled(im, text, W=768, bar=48):
            im = im.resize((W, int(im.height * W / im.width)))
            try:
                font = ImageFont.load_default(size=24)
            except TypeError:
                font = ImageFont.load_default()
            canvas = Image.new("RGB", (W, im.height + bar), "white")
            ImageDraw.Draw(canvas).text((10, 12), text, fill="black", font=font)
            canvas.paste(im, (0, bar))
            return canvas

        p1 = labelled(Image.fromarray((np.clip(bic, 0, 1) * 255).astype(np.uint8)),
                      "Sentinel-2 10 m (Bicubic baseline)")
        p2 = labelled(Image.fromarray((np.clip(sr, 0, 1) * 255).astype(np.uint8)),
                      "Super-Resolved 2.5 m (RFMSR x4)")
        gap = 12
        combo = Image.new("RGB", (p1.width + p2.width + gap, max(p1.height, p2.height)), "white")
        combo.paste(p1, (0, 0))
        combo.paste(p2, (p1.width + gap, 0))
        comp_png = os.path.join(output_dir, "comparison_10m_vs_sr.png")
        combo.save(comp_png)

    return {"metrics": rows, "headlines": headlines,
            "csv_path": csv_path, "comparison_png": comp_png}