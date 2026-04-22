"""Walk the outfits directory tree and group files by category."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

# Map from filename stem (lowercased) → canonical category. Filenames in this
# project are predictable (`shirt.png`, `pants.jpg`, etc.) so a stem lookup is
# enough; if you add aliases later, extend this dict.
CATEGORY_BY_STEM: dict[str, str] = {
    "shirt": "shirt",
    "shirts": "shirt",
    "top":   "shirt",
    "pants": "pants",
    "jeans": "pants",
    "trousers": "pants",
    "shoes": "shoes",
    "shoe":  "shoes",
    "sneakers": "shoes",
    "belt":  "belt",
    "belts": "belt",
}

CATEGORIES: tuple[str, ...] = ("shirt", "pants", "shoes", "belt")

SUPPORTED_EXTS: frozenset[str] = frozenset({".png", ".jpg", ".jpeg", ".webp"})


@dataclass(frozen=True)
class Asset:
    path: Path
    outfit: str          # e.g. "outfit_1"
    category: str        # canonical: shirt | pants | shoes | belt
    is_reference: bool   # True iff this asset belongs to the reference outfit


def discover(outfits_root: Path, reference_outfit: str = "outfit_1") -> list[Asset]:
    """Return every clothing asset under `outfits_root`, grouped by outfit /
    category. Unknown files (e.g. `.DS_Store`) are skipped silently."""
    assets: list[Asset] = []
    if not outfits_root.is_dir():
        raise FileNotFoundError(f"outfits root not found: {outfits_root}")
    for outfit_dir in sorted(p for p in outfits_root.iterdir() if p.is_dir()):
        for f in sorted(outfit_dir.iterdir()):
            if f.suffix.lower() not in SUPPORTED_EXTS:
                continue
            category = CATEGORY_BY_STEM.get(f.stem.lower())
            if category is None:
                continue
            assets.append(Asset(
                path=f,
                outfit=outfit_dir.name,
                category=category,
                is_reference=(outfit_dir.name == reference_outfit),
            ))
    return assets


def group_by_category(assets: list[Asset]) -> dict[str, list[Asset]]:
    grouped: dict[str, list[Asset]] = {c: [] for c in CATEGORIES}
    for a in assets:
        grouped.setdefault(a.category, []).append(a)
    return grouped
