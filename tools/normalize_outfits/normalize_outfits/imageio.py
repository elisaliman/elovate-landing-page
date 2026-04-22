"""Loading + bounding-box detection for clothing images.

Inputs to this pipeline are mixed: outfit_1 is true PNGs with an alpha channel,
later outfits are JPGs with a solid (usually white) studio background. We need a
single representation everywhere downstream, so every image is normalized into
RGBA early, with a derived alpha mask that treats the background as transparent.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image


# Treat any pixel within this Euclidean RGB distance of the sampled background
# as background. Tuned on the actual outfit_2 / outfit_3 white studio shots —
# loose enough to catch shadow halos, tight enough not to eat into garment
# edges. Override per-call if a particular asset needs it.
DEFAULT_BG_TOLERANCE = 28

# How many pixels around the canvas perimeter to sample when guessing the
# background color of a non-alpha image.
PERIMETER_SAMPLE = 4

# Below this alpha value a pixel is considered fully transparent for the
# purposes of bounding-box detection. Items often have soft anti-aliased
# halos; using >0 keeps those halos from inflating the bbox.
ALPHA_THRESHOLD = 16


@dataclass(frozen=True)
class BBox:
    """Inclusive-exclusive pixel bounding box (left, top, right, bottom)."""
    left: int
    top: int
    right: int
    bottom: int

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    @property
    def cx(self) -> float:
        return (self.left + self.right) / 2.0

    @property
    def cy(self) -> float:
        return (self.top + self.bottom) / 2.0

    def as_tuple(self) -> tuple[int, int, int, int]:
        return (self.left, self.top, self.right, self.bottom)


def load_rgba(path: Path, bg_tolerance: int = DEFAULT_BG_TOLERANCE) -> Image.Image:
    """Load any supported image as RGBA, deriving alpha from the studio
    background when the source has no real alpha channel.

    JPGs always come back as RGB. We sample the corners + edges of the image to
    estimate the background color, then anything within `bg_tolerance` of that
    color is set transparent. The original RGB values are preserved so the
    garment edges retain their natural shading.
    """
    img = Image.open(path)
    img.load()

    # PNGs / WEBPs etc. with a useful alpha channel — keep as-is.
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        return img.convert("RGBA")

    rgb = img.convert("RGB")
    arr = np.asarray(rgb)  # (H, W, 3)

    # Guess background color from the perimeter. Most studio shots use a near-
    # uniform backdrop, so the median over edge pixels is robust to small
    # shadows and stray pixels.
    h, w = arr.shape[:2]
    p = PERIMETER_SAMPLE
    edges = np.concatenate([
        arr[:p, :, :].reshape(-1, 3),
        arr[-p:, :, :].reshape(-1, 3),
        arr[:, :p, :].reshape(-1, 3),
        arr[:, -p:, :].reshape(-1, 3),
    ], axis=0)
    bg = np.median(edges, axis=0).astype(np.int16)

    diff = arr.astype(np.int16) - bg[None, None, :]
    dist = np.sqrt(np.sum(diff * diff, axis=2))
    alpha = np.where(dist > bg_tolerance, 255, 0).astype(np.uint8)

    rgba = np.dstack([arr, alpha])
    return Image.fromarray(rgba, mode="RGBA")


def alpha_mask(img: Image.Image, threshold: int = ALPHA_THRESHOLD) -> np.ndarray:
    """Return a boolean mask of opaque pixels."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    a = np.asarray(img)[..., 3]
    return a > threshold


def content_bbox(img: Image.Image, threshold: int = ALPHA_THRESHOLD) -> BBox | None:
    """Tight bbox around all opaque pixels. Returns None if the image is empty."""
    mask = alpha_mask(img, threshold=threshold)
    if not mask.any():
        return None
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    top, bottom = np.where(rows)[0][[0, -1]]
    left, right = np.where(cols)[0][[0, -1]]
    # +1 on the far edges so width/height come out right (exclusive bound).
    return BBox(int(left), int(top), int(right) + 1, int(bottom) + 1)


def transparent_canvas(width: int, height: int) -> Image.Image:
    return Image.new("RGBA", (width, height), (0, 0, 0, 0))
