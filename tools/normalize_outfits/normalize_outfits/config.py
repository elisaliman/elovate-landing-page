"""User-tweakable normalization config.

Two layers:

  * `CANVAS` defines the standardized output canvas per category. Choose values
    that comfortably contain the largest expected garment for each category at
    the desired fill ratio. The web page sizes pieces with CSS, so absolute
    pixel size only affects rendering quality.

  * `OVERRIDES` lets you nudge the targets per category instead of taking the
    raw values derived from Outfit 1. Anything left as `None` falls back to the
    reference-derived value. Anchors (`anchor_x`, `anchor_y`) are positions in
    the output canvas, in 0–1 space, where the bbox center is placed.

Per-category anchors are intentional: shirts hang from the shoulders, pants
hang from the waist, shoes sit on the floor, belts wrap around the waist. We
keep visible content centered horizontally everywhere, but vertical anchors
shift slightly so the natural "hang point" of each garment lands consistently.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CanvasSize:
    width: int
    height: int


# Output canvas dimensions per category. Aspect ratios are tuned to the
# observed bbox aspects in Outfit 1 (shirt ~0.84, pants ~0.61, shoes ~2.51,
# belt ~1.45) so a "contain"-scaled bbox naturally lands close to the long
# edge without leaving large dead margins on the short axis.
CANVAS: dict[str, CanvasSize] = {
    "shirt": CanvasSize(width=900,  height=1080),  # ~0.83
    "pants": CanvasSize(width=720,  height=1200),  # ~0.60
    "shoes": CanvasSize(width=1100, height=480),   # ~2.29
    "belt":  CanvasSize(width=1200, height=820),   # ~1.46
}

# Safety cap so we never let the bbox touch the canvas edge after rounding.
# 1.0 = use the reference outfit's own ratio verbatim; 0.95 is conservative.
DEFAULT_FILL_CAP = 0.95


@dataclass(frozen=True)
class CategoryOverride:
    """Per-category overrides for normalization targets.

    Any field set to None is filled in from the reference outfit's measured
    values during target derivation, so the defaults below stay tracked to the
    Outfit 1 visual balance.
    """
    fill_long_edge: float | None = None  # 0..1; how much of the canvas long axis the bbox occupies
    anchor_x: float = 0.5                # bbox center x in canvas (0..1)
    anchor_y: float = 0.5                # bbox center y in canvas (0..1)
    bbox_aspect: float | None = None     # only used for sanity-check warnings


# All anchors are centered laterally; vertical anchors are tuned per category
# for natural "hang" points. These are starting values — adjust freely.
OVERRIDES: dict[str, CategoryOverride] = {
    # Shirt: hangs from shoulders. Slightly above center so the collar reads at
    # the same height across swaps.
    "shirt": CategoryOverride(anchor_x=0.5, anchor_y=0.48),

    # Pants: waistband at the top of the bbox. Anchor a hair below center so
    # the waistband sits where a hip would be.
    "pants": CategoryOverride(anchor_x=0.5, anchor_y=0.50),

    # Shoes: sit flat on a virtual floor. Anchor toward the bottom so heel
    # lines up across pairs regardless of the original photo's framing.
    "shoes": CategoryOverride(anchor_x=0.5, anchor_y=0.58),

    # Belt: horizontal strip, exact center is fine.
    "belt":  CategoryOverride(anchor_x=0.5, anchor_y=0.50),
}


def canvas_for(category: str) -> CanvasSize:
    if category not in CANVAS:
        raise KeyError(f"no canvas defined for category {category!r}")
    return CANVAS[category]


def override_for(category: str) -> CategoryOverride:
    return OVERRIDES.get(category, CategoryOverride())
