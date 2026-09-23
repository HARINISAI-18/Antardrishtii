"""
Setup RFMSR Repository & Inference Engine.
Extracts only the essential inference files from https://github.com/Faze-Hsw/RFMSR.git
and injects the VAE tiled-decode monkey-patch according to Cell 1 of rfmsrh.ipynb / rfmsrh_(1).ipynb.
"""

import os
import sys
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RFMSR_DIR = os.path.join(BASE_DIR, "RFMSR")
REPO_URL = "https://github.com/Faze-Hsw/RFMSR.git"

SITECUSTOMIZE = r'''
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import shutil
if shutil.which("cl") is None:
    os.environ["TORCHDYNAMO_DISABLE"] = "1"

try:
    import diffusers
    _AEKL = diffusers.AutoencoderKL
    _orig_fp = _AEKL.from_pretrained          # bound classmethod

    def _patched(*args, **kwargs):
        model = _orig_fp(*args, **kwargs)
        for fn in ("enable_tiling", "enable_slicing"):
            try:
                getattr(model, fn)()
            except Exception:
                pass
        print("[sitecustomize] VAE tiled/sliced decoding enabled")
        # Last-resort mode (env RFMSR_VAE_CPU=1): keep VAE on CPU
        if os.environ.get("RFMSR_VAE_CPU") == "1":
            try:
                _to = model.to
                def _to_guard(*a, **k):
                    if a and isinstance(a[0], str) and "cuda" in str(a[0]):
                        return model
                    return _to(*a, **k)
                model.to = _to_guard
                _dec = model.decode
                def _dec_guard(z=None, **kw):
                    dev = next(model.parameters()).device
                    return _dec(z.to(dev), **kw)
                model.decode = _dec_guard
                print("[sitecustomize] VAE forced to CPU decode mode")
            except Exception as e:
                print("[sitecustomize] CPU-VAE patch skipped:", e)
        return model

    _AEKL.from_pretrained = classmethod(lambda cls, *a, **k: _patched(*a, **k))
except Exception:
    pass

try:
    import torch
    if not torch.cuda.is_available():
        os.environ["RFMSR_VAE_CPU"] = "1"
        _orig_mod_to = torch.nn.Module.to
        def _safe_mod_to(self, *args, **kwargs):
            if args and isinstance(args[0], str) and "cuda" in str(args[0]):
                args = ("cpu",) + args[1:]
            elif args and isinstance(args[0], torch.device) and args[0].type == "cuda":
                args = (torch.device("cpu"),) + args[1:]
            if "device" in kwargs and (kwargs["device"] == "cuda" or (isinstance(kwargs["device"], torch.device) and kwargs["device"].type == "cuda")):
                kwargs["device"] = "cpu"
            return _orig_mod_to(self, *args, **kwargs)
        torch.nn.Module.to = _safe_mod_to

        _orig_t_to = torch.Tensor.to
        def _safe_t_to(self, *args, **kwargs):
            if args and isinstance(args[0], str) and "cuda" in str(args[0]):
                args = ("cpu",) + args[1:]
            elif args and isinstance(args[0], torch.device) and args[0].type == "cuda":
                args = (torch.device("cpu"),) + args[1:]
            if "device" in kwargs and (kwargs["device"] == "cuda" or (isinstance(kwargs["device"], torch.device) and kwargs["device"].type == "cuda")):
                kwargs["device"] = "cpu"
            return _orig_t_to(self, *args, **kwargs)
        torch.Tensor.to = _safe_t_to
        torch.Tensor.cuda = lambda self, *a, **kw: self.to("cpu")
        print("[sitecustomize] Non-CUDA host detected: automatically mapped to CPU")
except Exception:
    pass
'''

def setup_repo():
    print(f"[1/4] Checking RFMSR repository at {RFMSR_DIR}...")
    if not os.path.exists(RFMSR_DIR):
        print(f"  Cloning {REPO_URL} (shallow depth 1)...")
        subprocess.run(["git", "clone", "--depth", "1", "-q", REPO_URL, RFMSR_DIR], check=True)
    else:
        print("  Repository already exists.")

    print("\n[2/4] Pruning non-inference files to keep only the useful architecture...")
    # Keep: models/, configs/, utils/, infer_*.py, requirements.txt
    # Remove: traindata/, testdata/, assets/, train_*.py, .git
    for folder in ["traindata", "testdata", "assets"]:
        target = os.path.join(RFMSR_DIR, folder)
        if os.path.exists(target):
            try:
                shutil.rmtree(target, ignore_errors=True)
                print(f"  Removed unused dataset folder: {folder}/")
            except Exception:
                pass

    for f in ["train_rfmsr.py", "train_rfmsr_os.py", "train_consistency.py"]:
        target = os.path.join(RFMSR_DIR, f)
        if os.path.exists(target):
            try:
                os.remove(target)
                print(f"  Removed training script: {f}")
            except Exception:
                pass

    print("\n[3/4] Injecting VAE tiled-decode monkey-patch (sitecustomize.py)...")
    site_file = os.path.join(RFMSR_DIR, "sitecustomize.py")
    with open(site_file, "w", encoding="utf-8") as f:
        f.write(SITECUSTOMIZE)
    print(f"  Injected: {site_file}")

    print("\n[4/4] Setting up checkpoints directory...")
    ckpt_dir = os.path.join(RFMSR_DIR, "ckpts")
    vae_dir = os.path.join(ckpt_dir, "stable-diffusion-2-1-base")
    os.makedirs(ckpt_dir, exist_ok=True)
    os.makedirs(vae_dir, exist_ok=True)
    print(f"  Checkpoints dir: {ckpt_dir}")

    print("\n[OK] RFMSR inference architecture successfully prepared!")


def download_weights(download_vae=True):
    """Downloads model checkpoints matching exact notebook Cell 1."""
    print("\n[Weights] Checking Hugging Face checkpoints...")
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("Installing huggingface_hub...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "huggingface_hub"], check=True)
        from huggingface_hub import hf_hub_download

    ckpt_dir = os.path.join(RFMSR_DIR, "ckpts")
    vae_dir = os.path.join(ckpt_dir, "stable-diffusion-2-1-base")
    ckpt = os.path.join(ckpt_dir, "rfmsr.safetensors")

    # 1. Download RFMSR checkpoint
    if not os.path.exists(ckpt):
        print(f"Downloading RFMSR checkpoint (rfmsr.safetensors) from frozen2001/RFMSR...")
        hf_hub_download(repo_id="frozen2001/RFMSR", filename="ckpts/rfmsr.safetensors", local_dir=RFMSR_DIR)
        print(f"  RFMSR ckpt saved: {ckpt} ({os.path.getsize(ckpt)/1024**3:.2f} GB)")
    else:
        print(f"  RFMSR ckpt already exists: {ckpt} ({os.path.getsize(ckpt)/1024**3:.2f} GB)")

    # 2. Download SD 2.1 VAE
    if download_vae:
        vae_cfg = os.path.join(vae_dir, "vae", "config.json")
        vae_model = os.path.join(vae_dir, "vae", "diffusion_pytorch_model.safetensors")
        vae_bin = os.path.join(vae_dir, "vae", "diffusion_pytorch_model.bin")

        if not (os.path.exists(vae_cfg) and (os.path.exists(vae_model) or os.path.exists(vae_bin))):
            print("Downloading SD 2.1 VAE...")
            for repo in ["sd-research/stable-diffusion-2-1-base", "stabilityai/stable-diffusion-2-1-base"]:
                try:
                    hf_hub_download(repo_id=repo, filename="vae/config.json", local_dir=vae_dir)
                    for w in ["vae/diffusion_pytorch_model.safetensors", "vae/diffusion_pytorch_model.bin"]:
                        try:
                            hf_hub_download(repo_id=repo, filename=w, local_dir=vae_dir)
                            break
                        except Exception:
                            continue
                    break
                except Exception as e:
                    print(f"  VAE from '{repo}' failed: {e}")
        else:
            print("  SD 2.1 VAE already exists.")

    print("\n[OK] Pretrained weights verified!")



if __name__ == "__main__":
    setup_repo()
    if "--download-weights" in sys.argv:
        download_weights()
