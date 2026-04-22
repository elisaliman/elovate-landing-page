"""Normalize a single asset onto a standardized canvas.

The pipeline per asset is:

  1. Load as RGBA (auto bg removal for non-alpha sources).
  2. Crop to the visible content bbox.
  3. Compute scale so the long edge of the bbox matches
     `target_fill_long * canvas_long_edge`. Aspect ratio is preserved.
  4. Place onto a fresh transparent canvas of the category's standardized size,
     positioning the bbox center at (anchor_x, anchor_y) of the canvas.
  5. Save as PNG.

Step 3's "long edge" choice means the visible content always reaches the same
fraction of the canvas's natural long axis, which is what makes a tall pant
and a wide pair of shoes feel like they take up the same on-screen room.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from .config import (
    DEFAULT_FILL_CAP,
    CanvasSize,
    CategoryOverride,
    canvas_for,
    override_for,
)
from .imageio import content_bbox, load_rgba, transparent_canvas
from .inspect import CategoryTarget


@dataclass(frozen=True)
class NormalizeResult:
    src: Path
    dst: Path
    category: str
    canvas: tuple[int, int]
    src_bbox: tuple[int, int]              # (w, h) of original visible content
    scale: float
    placed_bbox: tuple[int, int, int, int] # (left, top, right, bottom) in output canvas


def _resolve_target(
    category: str,
    derived: CategoryTarget,
    override: CategoryOverride,
) -> tuple[float, float, float]:
    """Resolve final (fill_long_edge, anchor_x, anchor_y) for this category."""
    fill_long = override.fill_long_edge if override.fill_long_edge is not None else derived.fill_long_edge
    return fill_long, override.anchor_x, override.anchor_y


def normalize_asset(
    src: Path,
    dst: Path,
    category: str,
    target: CategoryTarget,
) -> NormalizeResult:
    img = load_rgba(src)
    bbox = content_bbox(img)
    if bbox is None:
        raise ValueError(f"{src} has no visible content")

    # Crop tightly to visible content. Cropping first means scaling math is
    # simple (we know exactly what we're scaling) and we drop unneeded
    # transparent padding from the source.
    cropped = img.crop(bbox.as_tuple())
    cw, ch = cropped.size

    canvas: CanvasSize = canvas_for(category)
    override = override_for(category)
    fill_long, anchor_x, anchor_y = _resolve_target(category, target, override)
    fill_long = min(fill_long, DEFAULT_FILL_CAP)

    # "Contain" scaling: the bbox must fit inside (fill * canvas_w, fill *
    # canvas_h). Whichever axis is more constraining wins, which guarantees no
    # axis overflows even when the bbox aspect doesn't match the canvas aspect
    # exactly. The bbox will hit the target fill on its constraining axis and
    # leave a small margin on the other.
    scale_w = (fill_long * canvas.width) / cw
    scale_h = (fill_long * canvas.height) / ch
    scale = min(scale_w, scale_h)

    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    out = transparent_canvas(canvas.width, canvas.height)
    cx_px = int(round(anchor_x * canvas.width))
    cy_px = int(round(anchor_y * canvas.height))
    paste_left = cx_px - new_w // 2
    paste_top = cy_px - new_h // 2

    out.alpha_composite(resized, dest=(paste_left, paste_top))

    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, format="PNG", optimize=True)

    return NormalizeResult(
        src=src,
        dst=dst,
        category=category,
        canvas=(canvas.width, canvas.height),
        src_bbox=(bbox.width, bbox.height),
        scale=scale,
        placed_bbox=(paste_left, paste_top, paste_left + new_w, paste_top + new_h),
    )
