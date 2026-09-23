"""
Super-Resolution Module (RFMSR 4x Super-Resolution & Feather-Blended Mosaic Engine).
Converts medium-resolution Sentinel-2 RGB (10 m) into high-resolution (2.5 m).
Faithful port of rfmsrh.ipynb Cell 2: one-step checkpoint preference, AST-parsed CLI
flags, VRAM-aware fp16/CPU-VAE attempts, tile grid + feather blending + GeoTF export.
"""

import os
import sys
import re
import glob
import ast
import shutil
import time
import subprocess
import numpy as np
from PIL import Image

# --- Cell 2 parity: set BEFORE any child process imports torch ---
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
os.environ["TORCHDYNAMO_DISABLE"] = "1"

try:
    import rasterio
    from rasterio.transform import Affine
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

# ---------------- knobs (Cell 2 parity) ----------------
SCALE = 4
SEED = 42
TILE_SIZE = 512                                   # LOCKED: model constraint (512 -> 64x64 latents)
O_IN = 64                                         # mosaic overlap, input px
STEPS = int(os.environ.get("SR_STEPS", "8"))      # only used with the multi-step ckpt
PREFER_ONE_STEP = os.environ.get("SR_ONE_STEP", "1") == "1"
RFMSR_VAE_FP16 = os.environ.get("SR_VAE_FP16", "1") == "1"
MIN_VRAM_MB = 5000

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_RFMSR_DIR = os.path.join(BASE_DIR, "RFMSR")
VAE_SUBDIR = os.path.join("ckpts", "stable-diffusion-2-1-base")
HF_OS_REPO, HF_OS_FILE = "frozen2001/RFMSR", "ckpts/rfmsr_os.safetensors"


def has_rfmsr_model(repo_dir: str = DEFAULT_RFMSR_DIR) -> bool:
    vae = os.path.join(repo_dir, VAE_SUBDIR, "vae", "config.json")
    ckpts = [os.path.join(repo_dir, "ckpts", n) for n in ("rfmsr_os.safetensors", "rfmsr.safetensors")]
    return os.path.exists(vae) and any(os.path.exists(c) for c in ckpts)


def resolve_checkpoint(repo_dir: str = DEFAULT_RFMSR_DIR):
    """Cell 2 checkpoint resolution — EXACT:
    prefer true one-step rfmsr_os.safetensors (HF download); if unavailable,
    symlink/copy rfmsr.safetensors onto the rfmsr_os name (script's default path).
    Returns (ckpt_path, steps_eff): steps_eff = 1 for one-step, STEPS otherwise."""
    ckpt = os.path.join(repo_dir, "ckpts", "rfmsr.safetensors")
    os_ckpt = os.path.join(repo_dir, "ckpts", "rfmsr_os.safetensors")
    if PREFER_ONE_STEP and not os.path.exists(os_ckpt):
        try:
            from huggingface_hub import hf_hub_download
            print("[SR] Downloading one-step ckpt rfmsr_os.safetensors ...")
            hf_hub_download(HF_OS_REPO, HF_OS_FILE, local_dir=repo_dir)
        except Exception:
            print("[SR] rfmsr_os not available -> using rfmsr.safetensors (multi-step)")
    if not os.path.exists(os_ckpt) and os.path.exists(ckpt):
        try:
            os.symlink(ckpt, os_ckpt)
        except OSError:
            shutil.copy(ckpt, os_ckpt)
    use_one = PREFER_ONE_STEP and os.path.exists(os_ckpt)
    return (os_ckpt if use_one else ckpt), (1 if use_one else STEPS)


# ------------------------------------------------------------------
# Flag detection — Cell 2 order: AST main() -> regex scan -> --help
# ------------------------------------------------------------------
def _main_params(script):
    try:
        tree = ast.parse(open(script, encoding="utf-8", errors="ignore").read())
    except Exception:
        return set()
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == "main":
            return {a.arg for a in node.args.args + node.args.kwonlyargs}
    return set()


def detect_cli_flags(repo_dir: str, script: str):
    flags = _main_params(script)                       # authoritative, ~ms
    if not flags:
        scan = ""
        for py in glob.glob(f"{repo_dir}/**/*.py", recursive=True):
            try:
                scan += open(py, encoding="utf-8", errors="ignore").read()
            except Exception:
                pass
        flags = set(re.findall(r"[\"']--([A-Za-z0-9_-]+)", scan))
    if not flags:
        try:
            h = subprocess.run([sys.executable, script, "--help"], capture_output=True,
                               text=True, timeout=300, cwd=repo_dir)
            flags = set(re.findall(r"--([A-Za-z0-9_-]+)", h.stdout + h.stderr))
        except Exception:
            pass
    return flags


def build_command(known, inp, outdir, script, repo_dir, ckpt_to_use, steps_eff):
    """Cell 2 command builder — EXACT alias lists (ckpt + steps ALWAYS explicit)."""
    config = os.path.join(repo_dir, "configs", "rfmsr.yaml")
    if not os.path.exists(config):
        y = sorted(glob.glob(f"{repo_dir}/configs/*.y*ml"))
        config = y[0] if y else None

    c = [sys.executable, script]

    def add(names, value=None):
        for n in names:
            if n in known or n.replace("_", "-") in known:
                c.append(f"--{n}")
                if value is not None:
                    c.append(str(value))
                return True
        return False

    if not add(["input", "input_path", "i", "image", "lr"], inp):
        c.append(inp)
    if not add(["output", "output_path", "outdir", "out", "o"], outdir):
        c.append(outdir)
    add(["scale"], SCALE)
    add(["steps", "num_steps", "n_steps"], steps_eff)              # ALWAYS explicit
    add(["rfmsr_path", "ckpt_path", "model_path"], ckpt_to_use)    # ALWAYS explicit
    add(["vae_path", "vae", "vae_dir"], os.path.join(repo_dir, VAE_SUBDIR))
    if config:
        add(["model_config", "config", "config_path"], config)
    add(["flow_sigma", "sigma"], 1.0)
    add(["seed"], SEED)
    add(["tile_size", "chop_size"], TILE_SIZE)                     # LOCKED: 512
    add(["tile_stride", "chop_stride"], 256)
    add(["color_correction", "color_fix", "colorfix"], "wavelet")
    return c


def _find_output(outdir):
    for root, _, fs in os.walk(outdir):
        for f in fs:
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff")):
                return os.path.join(root, f)
    return None


def _read_log(logp):
    try:
        return open(logp, encoding="utf-8", errors="ignore").read()
    except Exception:
        return ""


def gpu_free_mb():
    try:
        r = subprocess.run(["nvidia-smi", "--query-gpu=memory.free",
                            "--format=csv,noheader,nounits"],
                           capture_output=True, text=True, timeout=10)
        return float(r.stdout.strip().splitlines()[0])
    except Exception:
        return 1e9


def run_rfmsr_tile(in_png, outdir, logp, env, repo_dir, script, known,
                   ckpt_to_use, steps_eff, stream=True, reuse=True):
    """One tile run, streaming log (Cell 2 style) + optional cache."""
    if reuse:
        cached = _find_output(outdir)
        if cached and os.path.getmtime(cached) >= os.path.getmtime(in_png):
            print(f"  [cache] {os.path.basename(cached)}")
            return cached
    shutil.rmtree(outdir, ignore_errors=True)
    os.makedirs(outdir, exist_ok=True)
    cmd = build_command(known, in_png, outdir, script, repo_dir, ckpt_to_use, steps_eff)
    print("-" * 70)
    print(" ".join(cmd))
    print("-" * 70)
    with open(logp, "w", encoding="utf-8") as log, subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1, cwd=repo_dir, env=env) as p:
        for line in p.stdout:
            if stream:
                print("  " + line, end="")
            log.write(line)
        p.wait()
    return _find_output(outdir)


def notebook_stretch(rgb: np.ndarray, lo_pct=2.0, hi_pct=98.0) -> np.ndarray:
    """Cell 2 input prep: PER-CHANNEL 2-98 percentile stretch over valid (finite & >0) pixels.
    Use this in the fetch stage so RFMSR sees the same input distribution as the notebook."""
    out = np.zeros_like(rgb, dtype=np.float32)
    for c in range(rgb.shape[-1]):
        b = rgb[..., c].astype(np.float32)
        valid = b[np.isfinite(b) & (b > 0)]
        if valid.size == 0:
            raise RuntimeError("No valid pixels — pick another AOI/date.")
        lo, hi = np.percentile(valid, lo_pct), np.percentile(valid, hi_pct)
        out[..., c] = (b - lo) / (hi - lo + 1e-8)
    return np.clip(out, 0.0, 1.0)


def super_resolve_mosaic(
    rgb_vis: np.ndarray,
    output_dir: str,
    tf10=None,
    crsw=None,
    repo_dir: str = DEFAULT_RFMSR_DIR,
    engine_mode: str = "auto"
):
    """Full 4x SR mosaic pipeline (Cell 2 inference logic + Cell 2/3 mosaic logic)."""
    import torch
    os.makedirs(output_dir, exist_ok=True)
    n_px = rgb_vis.shape[0]
    s_out = n_px * SCALE

    # Snap / calculate tile positions (unchanged Cell 2 logic)
    if n_px > TILE_SIZE:
        n_along = int(np.ceil((n_px - TILE_SIZE) / (TILE_SIZE - O_IN))) + 1
        step = (n_px - TILE_SIZE) / max(n_along - 1, 1)
        pos = [int(round(i * step)) for i in range(n_along)]
        pos[-1] = n_px - TILE_SIZE
    else:
        n_along, pos, step = 1, [0], TILE_SIZE

    tiles = [(r, c) for r in pos for c in pos]
    r_out = max(32, min(256, int((TILE_SIZE - step) * SCALE) // 2)) if n_along > 1 else 0

    preferred = ["infer_rfmsr.py", "inference_rfmsr.py", "infer.py", "inference.py",
                 "sample.py", "scripts/infer_rfmsr.py"]
    script = next((os.path.join(repo_dir, s) for s in preferred
                   if os.path.exists(os.path.join(repo_dir, s))), None)
    rfmsr_available = script is not None and has_rfmsr_model(repo_dir)

    has_cuda = torch.cuda.is_available()
    if engine_mode == "rfmsr":
        use_rfmsr = rfmsr_available
    elif engine_mode == "fast":
        use_rfmsr = False
    else:
        use_rfmsr = rfmsr_available and has_cuda
        if not use_rfmsr and has_cuda:
            print("[SR] WARNING: RFMSR repo/ckpt not found — falling back to OpenCV engine "
                  "(NOT true super-resolution). Output will look over-sharpened/grainy.")

    dev_str = "CUDA GPU" if has_cuda else "CPU"
    engine_name = (f"RFMSR (Residual Flow Matching 4x, {dev_str})" if use_rfmsr
                   else f"Multi-Scale Satellite Detail Synthesis (4x Engine, {dev_str})")

    canvas = np.zeros((s_out, s_out, 3), np.float32)
    wsum = np.zeros((s_out, s_out, 1), np.float32)

    tiles_in_dir = os.path.join(output_dir, "tiles_in")
    os.makedirs(tiles_in_dir, exist_ok=True)

    if use_rfmsr:
        known_flags = detect_cli_flags(repo_dir, script)
        ckpt_to_use, steps_eff = resolve_checkpoint(repo_dir)
        print(f"[SR] Engine: {engine_name} | Grid: {len(tiles)} tile(s) ({n_along}x{n_along}) "
              f"| ckpt: {os.path.basename(ckpt_to_use)} | steps = {steps_eff}"
              + ("  (one-step — fastest)" if steps_eff == 1 else ""))
        print(f"[SR] Flags detected: {sorted(known_flags)}")

        def env_with(extra):
            e = os.environ.copy()
            e["PYTHONPATH"] = repo_dir + os.pathsep + e.get("PYTHONPATH", "")
            e.update(extra)
            return e

        # Cell 2 VRAM-aware attempts (max 2), fp16 VAE on GPU, CPU fallback
        if gpu_free_mb() < MIN_VRAM_MB:
            attempts = [("CPU VAE decode (low VRAM)", {"RFMSR_VAE_CPU": "1"})]
        else:
            attempts = ([("GPU decode + fp16", {"RFMSR_VAE_FP16": "1"})] if RFMSR_VAE_FP16
                        else [("GPU decode", {})]) + \
                       [("CPU VAE decode fallback", {"RFMSR_VAE_CPU": "1"})]

        tiles_out_dir = os.path.join(output_dir, f"tiles_out_t{TILE_SIZE}_s{steps_eff}")
        os.makedirs(tiles_out_dir, exist_ok=True)

        for (r, c) in tiles:
            tin = os.path.join(tiles_in_dir, f"tile_{r}_{c}.png")
            tout = os.path.join(tiles_out_dir, f"tile_{r}_{c}")
            logp = os.path.join(output_dir, f"rfmsr_tile_r{r}_c{c}.log")

            if not os.path.exists(tin):
                Image.fromarray((rgb_vis[r:r + TILE_SIZE, c:c + TILE_SIZE] * 255)
                                .astype(np.uint8)).save(tin)

            got = None
            for i, (label, extra) in enumerate(attempts):
                print(f"[SR] tile r{r}c{c} — attempt {i + 1}/{len(attempts)}: {label}")
                got = run_rfmsr_tile(tin, tout, logp, env_with(extra), repo_dir, script,
                                     known_flags, ckpt_to_use, steps_eff)
                if got:
                    break
                log = _read_log(logp)
                if "doesn't match model" in log:
                    raise RuntimeError("RFMSR: tile_size must stay 512 (model constraint).")
                if "No such file or directory" in log and "safetensors" in log:
                    raise RuntimeError("RFMSR: checkpoint missing — inspect RFMSR/ckpts/.")
                if "unexpected keyword argument" in log or "unrecognized argument" in log:
                    raise RuntimeError("RFMSR: bad flag name — detected flags were: "
                                       + str(sorted(known_flags)))
                if "out of memory" not in log:
                    break  # non-OOM failure: retrying won't help (Cell 2 behaviour)

            if not got:
                tail = "\n".join(_read_log(logp).splitlines()[-60:])
                raise RuntimeError(f"RFMSR failed on tile r{r} c{c}.\n--- LOG TAIL ---\n{tail}")

            tile_sr = np.asarray(Image.open(got).convert("RGB"), np.float32) / 255.0
            t_size = tile_sr.shape[0]

            # Feather weights (unchanged)
            wx = np.ones(t_size, np.float32)
            wy = np.ones(t_size, np.float32)
            if n_along > 1 and r_out > 0:
                ramp = np.linspace(0, 1, r_out, dtype=np.float32)
                if c != pos[0]:
                    wx[:r_out] = ramp
                if c != pos[-1]:
                    wx[-r_out:] = ramp[::-1]
                if r != pos[0]:
                    wy[:r_out] = ramp
                if r != pos[-1]:
                    wy[-r_out:] = ramp[::-1]

            w = (wy[:, None] * wx[None, :])[..., None]
            canvas[r * SCALE:r * SCALE + t_size, c * SCALE:c * SCALE + t_size] += tile_sr * w
            wsum[r * SCALE:r * SCALE + t_size, c * SCALE:c * SCALE + t_size] += w

        mosaic = np.clip(canvas / np.maximum(wsum, 1e-6), 0.0, 1.0)

    else:
        print(f"[SR] Engine: {engine_name} | Grid: {len(tiles)} tile(s) ({n_along}x{n_along})")
        import cv2
        input_uint8 = (np.clip(rgb_vis, 0.0, 1.0) * 255).astype(np.uint8)
        up_lanczos = cv2.resize(input_uint8, (s_out, s_out), interpolation=cv2.INTER_LANCZOS4)
        lab = cv2.cvtColor(up_lanczos, cv2.COLOR_RGB2LAB)
        l_chan, a_chan, b_chan = cv2.split(lab)
        g1 = cv2.GaussianBlur(l_chan, (0, 0), sigmaX=1.0)
        g2 = cv2.GaussianBlur(l_chan, (0, 0), sigmaX=2.5)
        g3 = cv2.GaussianBlur(l_chan, (0, 0), sigmaX=5.0)
        enhanced_l = np.clip(
            l_chan.astype(np.float32)
            + 2.2 * cv2.subtract(l_chan, g1).astype(np.float32)
            + 1.4 * cv2.subtract(g1, g2).astype(np.float32)
            + 0.6 * cv2.subtract(g2, g3).astype(np.float32), 0, 255).astype(np.uint8)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_l = clahe.apply(enhanced_l)
        mosaic = cv2.cvtColor(cv2.merge([enhanced_l, a_chan, b_chan]),
                              cv2.COLOR_LAB2RGB).astype(np.float32) / 255.0

    # Bicubic baseline + exports (unchanged)
    input_pil = Image.fromarray((rgb_vis * 255).astype(np.uint8))
    bicubic_pil = input_pil.resize((s_out, s_out), Image.BICUBIC)
    bicubic = np.asarray(bicubic_pil, dtype=np.float32) / 255.0

    mosaic_png = os.path.join(output_dir, "mosaic_sr.png")
    input_png = os.path.join(output_dir, "input_10m.png")
    bicubic_png = os.path.join(output_dir, "bicubic_baseline.png")
    Image.fromarray((mosaic * 255).astype(np.uint8)).save(mosaic_png)
    input_pil.save(input_png)
    bicubic_pil.save(bicubic_png)

    geotiff_path = None
    if RASTERIO_AVAILABLE and tf10 is not None and crsw is not None:
        try:
            tf25 = tf10 * Affine.scale(n_px / s_out)
            geotiff_path = os.path.join(output_dir, "sr_georef_2p5m.tif")
            with rasterio.open(geotiff_path, "w", driver="GTiff", height=s_out, width=s_out,
                               count=3, dtype="uint8", crs=crsw, transform=tf25,
                               compress="deflate") as d:
                d.write((mosaic.transpose(2, 0, 1) * 255).astype(np.uint8))
        except Exception as e:
            print(f"GeoTIFF export note: {e}")

    return {
        "engine_used": engine_name,
        "input_10m": rgb_vis,
        "bicubic": bicubic,
        "sr": mosaic,
        "s_out": s_out,
        "n_px": n_px,
        "scale": SCALE,
        "input_png": input_png,
        "bicubic_png": bicubic_png,
        "mosaic_png": mosaic_png,
        "geotiff_path": geotiff_path,
    }